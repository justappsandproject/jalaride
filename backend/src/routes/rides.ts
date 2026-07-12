import type { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { RideStatus } from "@prisma/client";
import { estimateFare } from "../services/fare.js";
import { DEFAULT_SEARCH_RADIUS_KM, findNearestDrivers, haversineKm, startDispatch } from "../services/dispatch.js";

const createRide = z.object({
  originLat: z.number(),
  originLng: z.number(),
  destLat: z.number(),
  destLng: z.number(),
  originLabel: z.string().optional(),
  destLabel: z.string().optional(),
  category: z.string().default("EXECUTIVE"),
  distanceKm: z.number().optional(),
  durationMin: z.number().optional(),
  fareEstimate: z.number().optional(),
  polyline: z.string().optional(),
  searchRadiusKm: z.number().min(1).max(30).optional(),
});

function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function sanitizeRide(ride: Record<string, unknown>, role: string, userId: string) {
  const r = { ...ride };
  const status = r.status as string;
  // Rider sees pickup PIN from MATCHED onward so they can share it with the driver.
  const pinVisibleToRider =
    role === "RIDER" &&
    ["MATCHED", "DRIVER_EN_ROUTE", "ARRIVED", "PIN_CONFIRMED", "IN_PROGRESS"].includes(status);
  const pinVisibleToDriver =
    role === "DRIVER" &&
    ["ARRIVED", "PIN_CONFIRMED", "IN_PROGRESS"].includes(status);

  if (!pinVisibleToRider && !pinVisibleToDriver) {
    delete r.pickupPinPlain;
    delete r.pickupPinHash;
  } else {
    delete r.pickupPinHash;
    if (!pinVisibleToRider && role === "RIDER") delete r.pickupPinPlain;
    if (!pinVisibleToDriver && role === "DRIVER") delete r.pickupPinPlain;
  }

  // Wait countdown after driver arrives (5 minutes)
  const waitExpiresAt = r.waitExpiresAt ? new Date(String(r.waitExpiresAt)) : null;
  if (status === "ARRIVED" && waitExpiresAt) {
    r.waitSecondsLeft = Math.max(0, Math.floor((waitExpiresAt.getTime() - Date.now()) / 1000));
  } else {
    r.waitSecondsLeft = null;
  }

  const payment = r.payment as Record<string, unknown> | undefined;
  r.paymentSummary = payment
    ? {
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        confirmedByDriver: payment.confirmedByDriver,
      }
    : null;

  // Trust + public driver profile for rider
  const driver = r.driver as Record<string, unknown> | undefined;
  if (driver) {
    const user = driver.user as Record<string, unknown> | undefined;
    const vehicles = driver.vehicles as Record<string, unknown>[] | undefined;
    const vehicle = vehicles?.[0];
    const createdAt = user?.createdAt ? new Date(String(user.createdAt)) : null;
    r.driverProfile = {
      name: user?.name ?? "Driver",
      phone: user?.phone ?? null,
      photo: user?.selfieUrl ?? null,
      rating: driver.rating ?? null,
      plate: vehicle?.plate ?? null,
      vehicleLabel: vehicle
        ? `${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim()
        : null,
    };
    if (role === "RIDER") {
      r.trust = {
        ninVerified: Boolean(user?.ninVerified),
        driverApproved: driver.status === "APPROVED",
        rating: driver.rating ?? null,
        accountTenureDays: createdAt
          ? Math.floor((Date.now() - createdAt.getTime()) / 86_400_000)
          : null,
      };
    }
  }
  return r;
}

const rideInclude = {
  rider: { select: { id: true, name: true, phone: true, selfieUrl: true } },
  driver: {
    include: {
      user: { select: { id: true, name: true, phone: true, selfieUrl: true, ninVerified: true, createdAt: true } },
      vehicles: true,
    },
  },
  payment: true,
} as const;

export async function rideRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.post("/", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "RIDER") {
      return reply.status(403).send({ error: "Riders only" });
    }
    const me = await app.prisma.user.findUnique({ where: { id: user.sub } });
    if (me?.registrationStatus !== "APPROVED") {
      return reply.status(403).send({ error: "Complete registration approval first" });
    }
    const parsed = createRide.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const d = parsed.data;
    const km =
      d.distanceKm ??
      haversineKm(
        { lat: d.originLat, lng: d.originLng },
        { lat: d.destLat, lng: d.destLng },
      );
    const durationMin = d.durationMin ?? Math.max(5, (km / 25) * 60);
    const fareEstimate =
      d.fareEstimate ?? estimateFare("EXECUTIVE", km, durationMin);
    const searchRadiusKm = d.searchRadiusKm ?? DEFAULT_SEARCH_RADIUS_KM;
    const ride = await app.prisma.ride.create({
      data: {
        riderId: user.sub,
        originLat: d.originLat,
        originLng: d.originLng,
        destLat: d.destLat,
        destLng: d.destLng,
        originLabel: d.originLabel,
        destLabel: d.destLabel,
        category: "EXECUTIVE",
        fareEstimate,
        distanceKm: Math.round(km * 100) / 100,
        durationMin: Math.round(durationMin * 10) / 10,
        polyline: d.polyline,
        status: "SEARCHING",
        searchRadiusKm,
        dispatchRound: 0,
      },
    });
    app.broadcastRideUpdate?.(ride.id, { type: "ride_searching", ride });
    await startDispatch(app, ride);
    return { ride };
  });

  /** Nearby online drivers for the rider map */
  app.get("/nearby-drivers", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "RIDER") return reply.status(403).send({ error: "Riders only" });
    const q = z
      .object({
        lat: z.coerce.number(),
        lng: z.coerce.number(),
        radiusKm: z.coerce.number().min(1).max(30).default(DEFAULT_SEARCH_RADIUS_KM),
      })
      .safeParse(req.query);
    if (!q.success) return reply.status(400).send({ error: "lat,lng required" });

    const nearest = await findNearestDrivers(
      app,
      q.data.lat,
      q.data.lng,
      q.data.radiusKm,
      [],
      30,
    );

    return {
      radiusKm: q.data.radiusKm,
      count: nearest.length,
      drivers: nearest.map((d) => ({
        id: d.id,
        lat: d.lat,
        lng: d.lng,
        heading: d.heading,
        distanceKm: Math.round(d.distanceKm * 100) / 100,
        rating: d.rating,
        name: d.user?.name ?? "Driver",
        vehicle: d.vehicles?.[0]
          ? {
              make: d.vehicles[0].make,
              model: d.vehicles[0].model,
              plate: d.vehicles[0].plate,
            }
          : null,
      })),
    };
  });

  app.post("/:id/retry", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "RIDER") return reply.status(403).send({ error: "Riders only" });
    const { id } = req.params as { id: string };
    const ride = await app.prisma.ride.findUnique({ where: { id } });
    if (!ride || ride.riderId !== user.sub) return reply.status(404).send({ error: "Not found" });

    // Allow retry from NO_DRIVER, and also re-kick SEARCHING if stuck without a driver
    if (ride.status === "SEARCHING" && !ride.driverId) {
      await app.prisma.rideOffer.deleteMany({ where: { rideId: id, status: "PENDING" } });
      const updated = await app.prisma.ride.update({
        where: { id },
        data: {
          dispatchRound: 0,
          searchRadiusKm: Math.max(ride.searchRadiusKm || DEFAULT_SEARCH_RADIUS_KM, DEFAULT_SEARCH_RADIUS_KM),
        },
        include: rideInclude,
      });
      await startDispatch(app, updated);
      return { ride: sanitizeRide(updated as unknown as Record<string, unknown>, user.role, user.sub) };
    }

    if (ride.status !== "NO_DRIVER") {
      return reply.status(400).send({
        error: "Only NO_DRIVER rides can be retried",
        status: ride.status,
      });
    }
    await app.prisma.rideOffer.deleteMany({ where: { rideId: id } });
    const updated = await app.prisma.ride.update({
      where: { id },
      data: {
        status: "SEARCHING",
        searchRadiusKm: ride.searchRadiusKm || DEFAULT_SEARCH_RADIUS_KM,
        dispatchRound: 0,
        driverId: null,
      },
      include: rideInclude,
    });
    await startDispatch(app, updated);
    return { ride: sanitizeRide(updated as unknown as Record<string, unknown>, user.role, user.sub) };
  });

  app.get("/active", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    let ride = null;
    const unpaidCompleted = {
      status: "COMPLETED" as const,
      updatedAt: { gte: new Date(Date.now() - 6 * 60 * 60_000) },
      NOT: { payment: { is: { status: "CAPTURED" } } },
    };
    if (user.role === "RIDER") {
      ride = await app.prisma.ride.findFirst({
        where: {
          riderId: user.sub,
          OR: [
            { status: { notIn: ["COMPLETED", "CANCELLED", "NO_DRIVER"] } },
            unpaidCompleted,
          ],
        },
        orderBy: { createdAt: "desc" },
        include: rideInclude,
      });
    } else if (user.role === "DRIVER") {
      const driver = await app.prisma.driver.findUnique({ where: { userId: user.sub } });
      if (driver) {
        ride = await app.prisma.ride.findFirst({
          where: {
            driverId: driver.id,
            OR: [
              { status: { notIn: ["COMPLETED", "CANCELLED", "NO_DRIVER"] } },
              unpaidCompleted,
            ],
          },
          orderBy: { createdAt: "desc" },
          include: rideInclude,
        });
      }
    }
    if (!ride) return { ride: null };
    return { ride: sanitizeRide(ride as unknown as Record<string, unknown>, user.role, user.sub) };
  });

  app.get("/mine", async (req) => {
    const user = req.user as { sub: string; role: string };
    if (user.role === "RIDER") {
      const rides = await app.prisma.ride.findMany({
        where: { riderId: user.sub },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { driver: { include: { user: true, vehicles: true } } },
      });
      return { rides };
    }
    const driver = await app.prisma.driver.findUnique({ where: { userId: user.sub } });
    if (!driver) return { rides: [] };
    const rides = await app.prisma.ride.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { rider: true },
    });
    return { rides };
  });

  app.get("/available", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "DRIVER") {
      return reply.status(403).send({ error: "Drivers only" });
    }
    const driver = await app.prisma.driver.findUnique({ where: { userId: user.sub } });
    if (!driver?.isOnline || (driver.status !== "APPROVED" && driver.status !== "PENDING")) {
      return reply.status(400).send({ error: "Go online to see jobs" });
    }
    // Legacy: pending offers for this driver (prefer /v1/driver/offers)
    const offers = await app.prisma.rideOffer.findMany({
      where: {
        driverId: driver.id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: {
        ride: { include: { rider: { select: { id: true, name: true, phone: true } } } },
      },
      orderBy: { offeredAt: "asc" },
    });
    return {
      rides: offers.map((o) => o.ride),
      offers,
    };
  });

  app.get("/:id", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    const { id } = req.params as { id: string };
    const ride = await app.prisma.ride.findUnique({
      where: { id },
      include: rideInclude,
    });
    if (!ride) return reply.status(404).send({ error: "Not found" });
    return { ride: sanitizeRide(ride as unknown as Record<string, unknown>, user.role, user.sub) };
  });

  app.post("/:id/accept", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "DRIVER") {
      return reply.status(403).send({ error: "Drivers only" });
    }
    const driver = await app.prisma.driver.findUnique({ where: { userId: user.sub } });
    if (!driver || (driver.status !== "APPROVED" && driver.status !== "PENDING")) {
      return reply.status(403).send({ error: "Driver not approved" });
    }
    if (driver.status === "PENDING") {
      await app.prisma.driver.update({
        where: { id: driver.id },
        data: { status: "APPROVED" },
      });
    }
    const { id } = req.params as { id: string };

    // Prefer accepting via active offer; fall back to open SEARCHING/REQUESTED
    const offer = await app.prisma.rideOffer.findFirst({
      where: {
        rideId: id,
        driverId: driver.id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    const ride = await app.prisma.ride.findUnique({ where: { id } });
    if (!ride || !["SEARCHING", "REQUESTED"].includes(ride.status) || ride.driverId) {
      return reply.status(404).send({ error: "Ride not available" });
    }
    if (!offer && ride.status === "SEARCHING") {
      // Allow accept only if this driver has an offer or legacy REQUESTED
      return reply.status(404).send({ error: "No active offer for this ride" });
    }

    const pin = generatePin();
    const pickupPinHash = await bcrypt.hash(pin, 8);

    if (offer) {
      await app.prisma.rideOffer.update({
        where: { id: offer.id },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });
      await app.prisma.rideOffer.updateMany({
        where: { rideId: id, status: "PENDING", id: { not: offer.id } },
        data: { status: "EXPIRED", respondedAt: new Date() },
      });
    }

    const updated = await app.prisma.ride.update({
      where: { id },
      data: {
        driverId: driver.id,
        status: "MATCHED",
        pickupPinHash,
        pickupPinPlain: pin,
        pinRevealedAt: null,
        riderPinConfirmed: false,
        driverPinConfirmed: false,
      },
      include: { rider: true, driver: { include: { user: true } } },
    });
    await app.prisma.driver.update({
      where: { id: driver.id },
      data: { availability: "ON_TRIP" },
    });
    const safe = sanitizeRide(updated as unknown as Record<string, unknown>, user.role, user.sub);
    app.broadcastRideUpdate?.(id, { type: "ride_matched", ride: safe });
    app.broadcastDriverOffer?.(driver.id, { type: "offer_accepted", rideId: id });
    return { ride: safe, message: "Ride accepted. PIN will be revealed when you arrive." };
  });

  const transition = async (
    id: string,
    userId: string,
    role: string,
    allowed: RideStatus[],
    next: RideStatus,
    extra?: Record<string, unknown>,
  ) => {
    const ride = await app.prisma.ride.findUnique({
      where: { id },
      include: { driver: true, rider: true, payment: true },
    });
    if (!ride) return { error: "Not found" as const, statusCode: 404 as const };
    // Idempotent: already in target state
    if (ride.status === next) {
      const full = await app.prisma.ride.findUnique({ where: { id }, include: rideInclude });
      return {
        ride: sanitizeRide(full as unknown as Record<string, unknown>, role, userId),
        already: true as const,
      };
    }
    if (!allowed.includes(ride.status)) {
      return {
        error: "Invalid state" as const,
        statusCode: 400 as const,
        current: ride.status,
        allowed,
      };
    }
    if (role === "RIDER" && ride.riderId !== userId) {
      return { error: "Forbidden" as const, statusCode: 403 as const };
    }
    if (role === "DRIVER") {
      const d = await app.prisma.driver.findUnique({ where: { userId } });
      if (!d || ride.driverId !== d.id) {
        return { error: "Forbidden" as const, statusCode: 403 as const };
      }
    }
    const updated = await app.prisma.ride.update({
      where: { id },
      data: { status: next, ...extra },
      include: rideInclude,
    });
    const safe = sanitizeRide(updated as unknown as Record<string, unknown>, role, userId);
    app.broadcastRideUpdate?.(id, { type: "ride_status", status: next, ride: safe });
    return { ride: safe };
  };

  app.post("/:id/en-route", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    const { id } = req.params as { id: string };
    const res = await transition(id, user.sub, user.role, ["MATCHED", "DRIVER_EN_ROUTE"], "DRIVER_EN_ROUTE");
    if ("error" in res) return reply.status(res.statusCode ?? 400).send(res);
    return res;
  });

  app.post("/:id/arrived", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "DRIVER") {
      return reply.status(403).send({ error: "Drivers only" });
    }
    const { id } = req.params as { id: string };
    const now = new Date();
    const waitExpiresAt = new Date(now.getTime() + 5 * 60_000);
    const res = await transition(id, user.sub, user.role, ["DRIVER_EN_ROUTE", "MATCHED", "ARRIVED"], "ARRIVED", {
      pinRevealedAt: now,
      arrivedAt: now,
      waitExpiresAt,
    });
    if ("error" in res) return reply.status(res.statusCode ?? 400).send(res);
    app.broadcastRideUpdate?.(id, {
      type: "driver_arrived",
      waitExpiresAt,
      waitSecondsLeft: 300,
      message: "Your driver has arrived at the pickup location",
      ride: res.ride,
    });
    return {
      ...res,
      waitExpiresAt,
      waitSecondsLeft: 300,
      pickupPin: (res.ride as { pickupPinPlain?: string }).pickupPinPlain,
      message: "Rider notified. 5-minute wait started. Share PIN at pickup.",
    };
  });

  app.post("/:id/confirm-pin", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    const { id } = req.params as { id: string };
    const ride = await app.prisma.ride.findUnique({ where: { id } });
    if (!ride || !["ARRIVED", "PIN_CONFIRMED"].includes(ride.status)) {
      return reply.status(400).send({ error: "Driver must mark arrived first" });
    }
    if (ride.status === "PIN_CONFIRMED") {
      const full = await app.prisma.ride.findUnique({ where: { id }, include: rideInclude });
      return {
        ride: sanitizeRide(full as unknown as Record<string, unknown>, user.role, user.sub),
        bothConfirmed: true,
      };
    }
    const data: { riderPinConfirmed?: boolean; driverPinConfirmed?: boolean; status?: RideStatus } = {};
    if (user.role === "RIDER" && ride.riderId === user.sub) {
      data.riderPinConfirmed = true;
    } else if (user.role === "DRIVER") {
      const d = await app.prisma.driver.findUnique({ where: { userId: user.sub } });
      if (!d || ride.driverId !== d.id) return reply.status(403).send({ error: "Forbidden" });
      data.driverPinConfirmed = true;
    } else {
      return reply.status(403).send({ error: "Forbidden" });
    }
    const riderOk = data.riderPinConfirmed || ride.riderPinConfirmed;
    const driverOk = data.driverPinConfirmed || ride.driverPinConfirmed;
    if (riderOk && driverOk) {
      data.status = "PIN_CONFIRMED";
    }
    const updated = await app.prisma.ride.update({
      where: { id },
      data,
      include: rideInclude,
    });
    const safe = sanitizeRide(updated as unknown as Record<string, unknown>, user.role, user.sub);
    app.broadcastRideUpdate?.(id, { type: "pin_confirmed", ride: safe });
    return { ride: safe, bothConfirmed: updated.status === "PIN_CONFIRMED" };
  });

  app.post("/:id/start", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    const { id } = req.params as { id: string };
    const ride = await app.prisma.ride.findUnique({ where: { id } });
    if (!ride) return reply.status(404).send({ error: "Not found" });
    if (ride.status === "IN_PROGRESS") {
      const full = await app.prisma.ride.findUnique({ where: { id }, include: rideInclude });
      return { ride: sanitizeRide(full as unknown as Record<string, unknown>, user.role, user.sub) };
    }
    if (ride.status !== "PIN_CONFIRMED") {
      return reply.status(400).send({
        error: "Enter the rider PIN to confirm pickup before starting the trip",
        current: ride.status,
      });
    }
    const res = await transition(id, user.sub, user.role, ["PIN_CONFIRMED"], "IN_PROGRESS", {
      startedAt: new Date(),
    });
    if ("error" in res) return reply.status(res.statusCode ?? 400).send(res);
    return res;
  });

  app.post("/:id/complete", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    const { id } = req.params as { id: string };
    const ride = await app.prisma.ride.findUnique({ where: { id }, include: { payment: true } });
    if (!ride) return reply.status(404).send({ error: "Not found" });
    const res = await transition(id, user.sub, user.role, ["IN_PROGRESS", "COMPLETED"], "COMPLETED", {
      completedAt: new Date(),
      fareFinal: ride.fareEstimate ?? ride.fareFinal,
    });
    if ("error" in res) return reply.status(res.statusCode ?? 400).send(res);
    if (ride.driverId) {
      await app.prisma.driver.update({
        where: { id: ride.driverId },
        data: { availability: "ONLINE" },
      });
    }
    const amount = ride.fareEstimate ?? ride.fareFinal ?? 0;
    if (amount > 0) {
      const existing = await app.prisma.payment.findUnique({ where: { rideId: id } });
      if (!existing) {
        await app.prisma.payment.create({
          data: {
            rideId: id,
            amount,
            method: "PENDING",
            status: "AWAITING_PAYMENT",
          },
        });
      }
    }
    const full = await app.prisma.ride.findUnique({ where: { id }, include: rideInclude });
    const safe = sanitizeRide(full as unknown as Record<string, unknown>, user.role, user.sub);
    app.broadcastRideUpdate?.(id, { type: "ride_completed_awaiting_payment", ride: safe });
    return { ride: safe, message: "Trip ended. Awaiting rider payment." };
  });

  /** Rider selects payment method after trip */
  app.post("/:id/pay", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "RIDER") return reply.status(403).send({ error: "Riders only" });
    const { id } = req.params as { id: string };
    const body = z
      .object({ method: z.enum(["WALLET", "CARD", "TRANSFER"]) })
      .safeParse(req.body);
    if (!body.success) return reply.status(400).send({ error: "method required: WALLET|CARD|TRANSFER" });

    const ride = await app.prisma.ride.findUnique({
      where: { id },
      include: { payment: true, rider: { include: { wallet: true } } },
    });
    if (!ride || ride.riderId !== user.sub) return reply.status(404).send({ error: "Not found" });
    if (ride.status !== "COMPLETED") {
      return reply.status(400).send({ error: "Pay after the trip is completed" });
    }

    const amount = ride.fareFinal ?? ride.fareEstimate ?? 0;
    if (body.data.method === "WALLET") {
      const wallet = ride.rider.wallet ?? (await app.prisma.wallet.create({
        data: { userId: user.sub, balance: 0 },
      }));
      if (wallet.balance < amount) {
        return reply.status(400).send({
          error: "Insufficient wallet balance. Top up or choose Card / Transfer.",
          balance: wallet.balance,
          amount,
        });
      }
      await app.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });
    }

    const payment = await app.prisma.payment.upsert({
      where: { rideId: id },
      create: {
        rideId: id,
        amount,
        method: body.data.method,
        status: "AWAITING_CONFIRMATION",
      },
      update: {
        method: body.data.method,
        amount,
        status: "AWAITING_CONFIRMATION",
        confirmedByDriver: false,
        confirmedAt: null,
      },
    });

    const full = await app.prisma.ride.findUnique({ where: { id }, include: rideInclude });
    const safe = sanitizeRide(full as unknown as Record<string, unknown>, user.role, user.sub);
    app.broadcastRideUpdate?.(id, { type: "payment_submitted", payment, ride: safe });
    return {
      ride: safe,
      payment,
      message:
        body.data.method === "WALLET"
          ? "Wallet charged. Waiting for driver to confirm receipt."
          : `Pay via ${body.data.method.toLowerCase()}. Driver will confirm receipt.`,
    };
  });

  /** Driver confirms payment received — ends the commercial trip */
  app.post("/:id/confirm-payment", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "DRIVER") return reply.status(403).send({ error: "Drivers only" });
    const { id } = req.params as { id: string };
    const driver = await app.prisma.driver.findUnique({ where: { userId: user.sub } });
    const ride = await app.prisma.ride.findUnique({ where: { id }, include: { payment: true } });
    if (!ride || !driver || ride.driverId !== driver.id) {
      return reply.status(404).send({ error: "Not found" });
    }
    if (ride.status !== "COMPLETED") {
      return reply.status(400).send({ error: "Trip must be completed first" });
    }
    if (!ride.payment || ride.payment.status === "AWAITING_PAYMENT") {
      return reply.status(400).send({ error: "Rider has not selected a payment method yet" });
    }
    if (ride.payment.status === "CAPTURED") {
      const full = await app.prisma.ride.findUnique({ where: { id }, include: rideInclude });
      return {
        ride: sanitizeRide(full as unknown as Record<string, unknown>, user.role, user.sub),
        already: true,
      };
    }

    await app.prisma.payment.update({
      where: { rideId: id },
      data: {
        status: "CAPTURED",
        confirmedByDriver: true,
        confirmedAt: new Date(),
      },
    });

    const full = await app.prisma.ride.findUnique({ where: { id }, include: rideInclude });
    const safe = sanitizeRide(full as unknown as Record<string, unknown>, user.role, user.sub);
    app.broadcastRideUpdate?.(id, { type: "payment_confirmed", ride: safe });
    return { ride: safe, message: "Payment confirmed. Trip closed." };
  });

  app.post("/:id/cancel", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    const { id } = req.params as { id: string };
    const ride = await app.prisma.ride.findUnique({ where: { id } });
    // Once trip has started, only driver complete ends it — no cancel
    if (ride && ["IN_PROGRESS", "PIN_CONFIRMED", "COMPLETED"].includes(ride.status)) {
      return reply.status(400).send({
        error: "Trip already started — it ends when the driver completes the trip",
        current: ride.status,
      });
    }
    const allowed: RideStatus[] = [
      "REQUESTED",
      "SEARCHING",
      "NO_DRIVER",
      "MATCHED",
      "DRIVER_EN_ROUTE",
      "ARRIVED",
    ];
    const res = await transition(id, user.sub, user.role, allowed, "CANCELLED");
    if ("error" in res) return reply.status(res.statusCode ?? 400).send(res);
    if (ride?.driverId) {
      await app.prisma.driver.update({
        where: { id: ride.driverId },
        data: { availability: "ONLINE" },
      });
    }
    await app.prisma.rideOffer.updateMany({
      where: { rideId: id, status: "PENDING" },
      data: { status: "EXPIRED", respondedAt: new Date() },
    });
    return res;
  });
}
