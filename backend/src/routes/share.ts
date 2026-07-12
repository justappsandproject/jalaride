import type { FastifyInstance } from "fastify";
import { randomBytes } from "crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";

const SHARE_BASE =
  process.env.PUBLIC_SHARE_BASE_URL ??
  process.env.WEB_ORIGIN ??
  "https://website-tau-two-57.vercel.app";

export async function shareRoutes(app: FastifyInstance) {
  /** Public — no auth */
  app.get("/:token", async (req, reply) => {
    const { token } = req.params as { token: string };
    const ride = await app.prisma.ride.findFirst({
      where: {
        shareToken: token,
        shareExpiresAt: { gt: new Date() },
        status: {
          in: ["MATCHED", "DRIVER_EN_ROUTE", "ARRIVED", "PIN_CONFIRMED", "IN_PROGRESS"],
        },
      },
      include: {
        driver: {
          include: {
            user: { select: { name: true, ninVerified: true, createdAt: true } },
            vehicles: true,
          },
        },
        rider: { select: { name: true } },
      },
    });
    if (!ride) return reply.status(404).send({ error: "Share link expired or invalid" });

    const vehicle = ride.driver?.vehicles?.[0];
    const tenureDays = ride.driver?.user?.createdAt
      ? Math.floor((Date.now() - ride.driver.user.createdAt.getTime()) / 86_400_000)
      : null;

    return {
      ride: {
        id: ride.id,
        status: ride.status,
        originLabel: ride.originLabel,
        destLabel: ride.destLabel,
        originLat: ride.originLat,
        originLng: ride.originLng,
        destLat: ride.destLat,
        destLng: ride.destLng,
        driverLat: ride.driver?.lat ?? null,
        driverLng: ride.driver?.lng ?? null,
        driverName: ride.driver?.user?.name ?? null,
        vehicle: vehicle
          ? { make: vehicle.make, model: vehicle.model, plate: vehicle.plate }
          : null,
        trust: {
          ninVerified: ride.driver?.user?.ninVerified ?? false,
          driverApproved: ride.driver?.status === "APPROVED",
          accountTenureDays: tenureDays,
          rating: ride.driver?.rating ?? null,
        },
        expiresAt: ride.shareExpiresAt,
      },
    };
  });
}

export async function createShareLink(app: FastifyInstance, rideId: string, userId: string) {
  const ride = await app.prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride || ride.riderId !== userId) return null;
  if (
    !["MATCHED", "DRIVER_EN_ROUTE", "ARRIVED", "PIN_CONFIRMED", "IN_PROGRESS"].includes(ride.status)
  ) {
    return null;
  }
  const token = ride.shareToken ?? randomBytes(16).toString("hex");
  const shareExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await app.prisma.ride.update({
    where: { id: rideId },
    data: { shareToken: token, shareExpiresAt },
  });
  return {
    token,
    url: `${SHARE_BASE}/share/${token}`,
    expiresAt: shareExpiresAt,
  };
}

const rateBody = z.object({
  score: z.number().int().min(1).max(5),
  tags: z.array(z.string()).max(8).default([]),
  comment: z.string().max(500).optional(),
});

const pinBody = z.object({
  pin: z.string().length(4).optional(),
});

export async function registerRideExtras(app: FastifyInstance) {
  const auth = async (request: any, reply: any) => {
    if (typeof app.authenticate === "function") {
      return app.authenticate(request, reply);
    }
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  };

  app.post("/:id/share", { preHandler: [auth] }, async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "RIDER") return reply.status(403).send({ error: "Riders only" });
    const { id } = req.params as { id: string };
    const link = await createShareLink(app, id, user.sub);
    if (!link) return reply.status(400).send({ error: "Cannot share this ride" });
    return link;
  });

  app.post("/:id/rate", { preHandler: [auth] }, async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    const { id } = req.params as { id: string };
    const parsed = rateBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const ride = await app.prisma.ride.findUnique({
      where: { id },
      include: { driver: true },
    });
    if (!ride || ride.status !== "COMPLETED") {
      return reply.status(400).send({ error: "Rate only completed trips" });
    }

    let rateeId: string | null = null;
    if (user.role === "RIDER" && ride.riderId === user.sub) {
      rateeId = ride.driver?.userId ?? null;
    } else if (user.role === "DRIVER") {
      const d = await app.prisma.driver.findUnique({ where: { userId: user.sub } });
      if (!d || ride.driverId !== d.id) return reply.status(403).send({ error: "Forbidden" });
      rateeId = ride.riderId;
    } else {
      return reply.status(403).send({ error: "Forbidden" });
    }
    if (!rateeId) return reply.status(400).send({ error: "Missing ratee" });

    const existing = await app.prisma.rating.findFirst({
      where: { rideId: id, raterId: user.sub },
    });
    const rating = existing
      ? await app.prisma.rating.update({
          where: { id: existing.id },
          data: {
            score: parsed.data.score,
            tags: parsed.data.tags,
            comment: parsed.data.comment,
            rateeId,
          },
        })
      : await app.prisma.rating.create({
          data: {
            rideId: id,
            raterId: user.sub,
            rateeId,
            score: parsed.data.score,
            tags: parsed.data.tags,
            comment: parsed.data.comment,
          },
        });

    // Refresh driver average if rider rated driver
    if (user.role === "RIDER" && ride.driverId) {
      const agg = await app.prisma.rating.aggregate({
        where: { rateeId },
        _avg: { score: true },
      });
      if (agg._avg.score != null) {
        await app.prisma.driver.update({
          where: { id: ride.driverId },
          data: { rating: Math.round(agg._avg.score * 10) / 10 },
        });
      }
    }

    return { rating };
  });

  /** Driver enters PIN to unlock start; rider confirms with optional pin match */
  app.post("/:id/verify-pin", { preHandler: [auth] }, async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    const { id } = req.params as { id: string };
    const parsed = pinBody.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

    const ride = await app.prisma.ride.findUnique({ where: { id } });
    if (!ride || !["ARRIVED", "MATCHED", "DRIVER_EN_ROUTE"].includes(ride.status)) {
      return reply.status(400).send({ error: "PIN verification not available in this state" });
    }

    if (user.role === "DRIVER") {
      const d = await app.prisma.driver.findUnique({ where: { userId: user.sub } });
      if (!d || ride.driverId !== d.id) return reply.status(403).send({ error: "Forbidden" });
      const pin = parsed.data.pin;
      if (!pin || !ride.pickupPinHash) {
        return reply.status(400).send({ error: "Enter the 4-digit rider PIN" });
      }
      const ok = await bcrypt.compare(pin, ride.pickupPinHash);
      if (!ok) return reply.status(400).send({ error: "Incorrect PIN" });
      const updated = await app.prisma.ride.update({
        where: { id },
        data: {
          driverPinConfirmed: true,
          riderPinConfirmed: true,
          status: "PIN_CONFIRMED",
          pinRevealedAt: ride.pinRevealedAt ?? new Date(),
        },
        include: { rider: true, driver: { include: { user: true, vehicles: true } } },
      });
      app.broadcastRideUpdate?.(id, { type: "pin_verified", ride: updated });
      return { ride: updated, bothConfirmed: true };
    }

    if (user.role === "RIDER" && ride.riderId === user.sub) {
      const updated = await app.prisma.ride.update({
        where: { id },
        data: { riderPinConfirmed: true },
        include: { rider: true, driver: { include: { user: true, vehicles: true } } },
      });
      app.broadcastRideUpdate?.(id, { type: "pin_confirmed", ride: updated });
      return { ride: updated, bothConfirmed: updated.driverPinConfirmed && updated.riderPinConfirmed };
    }

    return reply.status(403).send({ error: "Forbidden" });
  });
}
