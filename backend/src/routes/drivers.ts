import type { FastifyInstance } from "fastify";
import { z } from "zod";

const locationBody = z.object({
  lat: z.number(),
  lng: z.number(),
  heading: z.number().optional(),
});

const heartbeatBody = z.object({
  lat: z.number(),
  lng: z.number(),
  heading: z.number().optional(),
  pushToken: z.string().optional(),
});

const vehicleBody = z.object({
  make: z.string(),
  model: z.string(),
  plate: z.string(),
  category: z.string().default("ECONOMY"),
});

export async function driverRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.post("/online", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "DRIVER") {
      return reply.status(403).send({ error: "Drivers only" });
    }
    const driver = await app.prisma.driver.update({
      where: { userId: user.sub },
      data: {
        isOnline: true,
        availability: "ONLINE",
        lastHeartbeat: new Date(),
      },
    });
    return { driver };
  });

  app.post("/offline", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "DRIVER") {
      return reply.status(403).send({ error: "Drivers only" });
    }
    const driver = await app.prisma.driver.findUnique({ where: { userId: user.sub } });
    if (!driver) return reply.status(404).send({ error: "Not found" });
    if (driver.availability === "ON_TRIP") {
      return reply.status(400).send({ error: "Finish active trip before going offline" });
    }
    const updated = await app.prisma.driver.update({
      where: { userId: user.sub },
      data: { isOnline: false, availability: "OFFLINE" },
    });
    // Expire pending offers for this driver so rides reassign
    const pending = await app.prisma.rideOffer.findMany({
      where: { driverId: driver.id, status: "PENDING" },
    });
    for (const offer of pending) {
      await app.prisma.rideOffer.update({
        where: { id: offer.id },
        data: { status: "EXPIRED", respondedAt: new Date() },
      });
    }
    return { driver: updated };
  });

  app.post("/heartbeat", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "DRIVER") {
      return reply.status(403).send({ error: "Drivers only" });
    }
    const parsed = heartbeatBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const driver = await app.prisma.driver.findUnique({ where: { userId: user.sub } });
    if (!driver) return reply.status(404).send({ error: "Not found" });
    if (!driver.isOnline && driver.availability !== "ON_TRIP") {
      return reply.status(400).send({ error: "Go online first" });
    }
    const updated = await app.prisma.driver.update({
      where: { userId: user.sub },
      data: {
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        heading: parsed.data.heading,
        lastHeartbeat: new Date(),
        ...(parsed.data.pushToken ? { pushToken: parsed.data.pushToken } : {}),
      },
    });
    app.broadcastDriverLocation?.(updated.id, {
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      heading: parsed.data.heading,
    });
    return { ok: true, lastHeartbeat: updated.lastHeartbeat };
  });

  app.post("/location", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "DRIVER") {
      return reply.status(403).send({ error: "Drivers only" });
    }
    const parsed = locationBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const driver = await app.prisma.driver.update({
      where: { userId: user.sub },
      data: {
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        heading: parsed.data.heading,
        lastHeartbeat: new Date(),
      },
    });
    app.broadcastDriverLocation?.(driver.id, parsed.data);
    return { ok: true };
  });

  app.get("/offers", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "DRIVER") {
      return reply.status(403).send({ error: "Drivers only" });
    }
    const driver = await app.prisma.driver.findUnique({ where: { userId: user.sub } });
    if (!driver) return reply.status(404).send({ error: "Not found" });
    const offers = await app.prisma.rideOffer.findMany({
      where: {
        driverId: driver.id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: {
        ride: {
          include: {
            rider: { select: { id: true, name: true, phone: true } },
          },
        },
      },
      orderBy: { offeredAt: "asc" },
    });
    return { offers };
  });

  app.post("/offers/:id/accept", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "DRIVER") {
      return reply.status(403).send({ error: "Drivers only" });
    }
    const driver = await app.prisma.driver.findUnique({ where: { userId: user.sub } });
    if (!driver || driver.status !== "APPROVED") {
      return reply.status(403).send({ error: "Driver not approved" });
    }
    const { id } = req.params as { id: string };
    const offer = await app.prisma.rideOffer.findUnique({ where: { id } });
    if (!offer || offer.driverId !== driver.id) {
      return reply.status(404).send({ error: "Offer not found" });
    }
    if (offer.status !== "PENDING" || offer.expiresAt <= new Date()) {
      return reply.status(400).send({ error: "Offer expired" });
    }
    const ride = await app.prisma.ride.findUnique({ where: { id: offer.rideId } });
    if (!ride || !["SEARCHING", "REQUESTED"].includes(ride.status) || ride.driverId) {
      return reply.status(404).send({ error: "Ride not available" });
    }
    const bcrypt = await import("bcryptjs");
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const pickupPinHash = await bcrypt.hash(pin, 8);
    await app.prisma.rideOffer.update({
      where: { id: offer.id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
    await app.prisma.rideOffer.updateMany({
      where: { rideId: offer.rideId, status: "PENDING", id: { not: offer.id } },
      data: { status: "EXPIRED", respondedAt: new Date() },
    });
    const updated = await app.prisma.ride.update({
      where: { id: offer.rideId },
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
    app.broadcastRideUpdate?.(offer.rideId, { type: "ride_matched", ride: updated });
    app.broadcastDriverOffer?.(driver.id, { type: "offer_accepted", rideId: offer.rideId });
    return { ride: updated, message: "Ride accepted" };
  });

  app.post("/offers/:id/decline", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "DRIVER") {
      return reply.status(403).send({ error: "Drivers only" });
    }
    const driver = await app.prisma.driver.findUnique({ where: { userId: user.sub } });
    if (!driver) return reply.status(404).send({ error: "Not found" });
    const { id } = req.params as { id: string };
    const offer = await app.prisma.rideOffer.findUnique({ where: { id } });
    if (!offer || offer.driverId !== driver.id) {
      return reply.status(404).send({ error: "Offer not found" });
    }
    if (offer.status !== "PENDING") {
      return reply.status(400).send({ error: "Offer not pending" });
    }
    await app.prisma.rideOffer.update({
      where: { id },
      data: { status: "DECLINED", respondedAt: new Date() },
    });
    const { offerToNextDriver } = await import("../services/dispatch.js");
    await offerToNextDriver(app, offer.rideId);
    return { ok: true };
  });

  app.post("/vehicle", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "DRIVER") {
      return reply.status(403).send({ error: "Drivers only" });
    }
    const parsed = vehicleBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const driver = await app.prisma.driver.findUniqueOrThrow({
      where: { userId: user.sub },
    });
    const vehicle = await app.prisma.vehicle.create({
      data: { ...parsed.data, driverId: driver.id },
    });
    return { vehicle };
  });

  app.get("/earnings/summary", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "DRIVER") {
      return reply.status(403).send({ error: "Drivers only" });
    }
    const driver = await app.prisma.driver.findUnique({ where: { userId: user.sub } });
    if (!driver) return { totals: { completed: 0, revenue: 0 } };
    const rides = await app.prisma.ride.findMany({
      where: { driverId: driver.id, status: "COMPLETED" },
      select: { fareFinal: true, createdAt: true },
    });
    const revenue = rides.reduce((s, r) => s + (r.fareFinal ?? 0), 0);
    return {
      totals: { completed: rides.length, revenue },
      commissionRate: 0.12,
      estimatedPayout: Math.round(revenue * 0.88 * 100) / 100,
    };
  });
}
