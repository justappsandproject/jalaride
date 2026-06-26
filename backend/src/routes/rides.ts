import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { RideStatus } from "@prisma/client";

const createRide = z.object({
  originLat: z.number(),
  originLng: z.number(),
  destLat: z.number(),
  destLng: z.number(),
  originLabel: z.string().optional(),
  destLabel: z.string().optional(),
  category: z.string().default("ECONOMY"),
});

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

export async function rideRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.post("/", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "RIDER") {
      return reply.status(403).send({ error: "Riders only" });
    }
    const parsed = createRide.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const d = parsed.data;
    const km = haversineKm(
      { lat: d.originLat, lng: d.originLng },
      { lat: d.destLat, lng: d.destLng },
    );
    const fareEstimate = Math.max(3.5, Math.round((2.5 + km * 1.2) * 100) / 100);
    const ride = await app.prisma.ride.create({
      data: {
        riderId: user.sub,
        originLat: d.originLat,
        originLng: d.originLng,
        destLat: d.destLat,
        destLng: d.destLng,
        originLabel: d.originLabel,
        destLabel: d.destLabel,
        category: d.category,
        fareEstimate,
        status: "REQUESTED",
      },
    });
    app.broadcastRideUpdate?.(ride.id, { type: "ride_requested", ride });
    return { ride };
  });

  app.get("/mine", async (req) => {
    const user = req.user as { sub: string; role: string };
    if (user.role === "RIDER") {
      return app.prisma.ride.findMany({
        where: { riderId: user.sub },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { driver: { include: { user: true, vehicles: true } } },
      });
    }
    const driver = await app.prisma.driver.findUnique({ where: { userId: user.sub } });
    if (!driver) return [];
    return app.prisma.ride.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { rider: true },
    });
  });

  app.get("/available", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "DRIVER") {
      return reply.status(403).send({ error: "Drivers only" });
    }
    const driver = await app.prisma.driver.findUnique({ where: { userId: user.sub } });
    if (!driver?.isOnline || driver.status !== "APPROVED") {
      return reply.status(400).send({ error: "Go online and be approved to see jobs" });
    }
    return app.prisma.ride.findMany({
      where: { status: "REQUESTED", driverId: null },
      orderBy: { createdAt: "asc" },
      take: 20,
      include: { rider: { select: { id: true, name: true, phone: true } } },
    });
  });

  app.post("/:id/accept", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "DRIVER") {
      return reply.status(403).send({ error: "Drivers only" });
    }
    const driver = await app.prisma.driver.findUnique({ where: { userId: user.sub } });
    if (!driver || driver.status !== "APPROVED") {
      return reply.status(403).send({ error: "Driver not approved" });
    }
    const { id } = req.params as { id: string };
    const ride = await app.prisma.ride.findUnique({ where: { id } });
    if (!ride || ride.status !== "REQUESTED") {
      return reply.status(404).send({ error: "Ride not available" });
    }
    const updated = await app.prisma.ride.update({
      where: { id },
      data: { driverId: driver.id, status: "MATCHED" },
      include: { rider: true, driver: { include: { user: true } } },
    });
    app.broadcastRideUpdate?.(id, { type: "ride_matched", ride: updated });
    return { ride: updated };
  });

  const transition = async (
    id: string,
    userId: string,
    role: string,
    allowed: RideStatus[],
    next: RideStatus,
  ) => {
    const ride = await app.prisma.ride.findUnique({
      where: { id },
      include: { driver: true, rider: true },
    });
    if (!ride) return { error: "Not found" as const };
    if (!allowed.includes(ride.status)) {
      return { error: "Invalid state" as const };
    }
    if (role === "RIDER" && ride.riderId !== userId) return { error: "Forbidden" as const };
    if (role === "DRIVER") {
      const d = await app.prisma.driver.findUnique({ where: { userId } });
      if (!d || ride.driverId !== d.id) return { error: "Forbidden" as const };
    }
    const updated = await app.prisma.ride.update({
      where: { id },
      data: { status: next },
      include: { rider: true, driver: { include: { user: true } } },
    });
    app.broadcastRideUpdate?.(id, { type: "ride_status", status: next, ride: updated });
    return { ride: updated };
  };

  app.post("/:id/start", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    const { id } = req.params as { id: string };
    const res = await transition(
      id,
      user.sub,
      user.role,
      ["MATCHED", "DRIVER_EN_ROUTE"],
      "IN_PROGRESS",
    );
    if ("error" in res) return reply.status(400).send(res);
    return res;
  });

  app.post("/:id/complete", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    const { id } = req.params as { id: string };
    const ride = await app.prisma.ride.findUnique({ where: { id } });
    if (!ride) return reply.status(404).send({ error: "Not found" });
    const res = await transition(id, user.sub, user.role, ["IN_PROGRESS"], "COMPLETED");
    if ("error" in res) return reply.status(400).send(res);
    if (ride.fareEstimate != null) {
      const existing = await app.prisma.payment.findUnique({ where: { rideId: id } });
      if (!existing) {
        await app.prisma.payment.create({
          data: {
            rideId: id,
            amount: ride.fareEstimate,
            method: "CARD",
            status: "CAPTURED",
          },
        });
        await app.prisma.ride.update({
          where: { id },
          data: { fareFinal: ride.fareEstimate },
        });
      }
    }
    return res;
  });

  app.post("/:id/cancel", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    const { id } = req.params as { id: string };
    const ride = await app.prisma.ride.findUnique({ where: { id } });
    if (!ride) return reply.status(404).send({ error: "Not found" });
    const allowed: RideStatus[] = ["REQUESTED", "MATCHED"];
    if (user.role === "DRIVER" || user.role === "RIDER") {
      const res = await transition(id, user.sub, user.role, allowed, "CANCELLED");
      if ("error" in res) return reply.status(400).send(res);
      return res;
    }
    return reply.status(403).send({ error: "Forbidden" });
  });

  app.post("/:id/en-route", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    const { id } = req.params as { id: string };
    const res = await transition(id, user.sub, user.role, ["MATCHED"], "DRIVER_EN_ROUTE");
    if ("error" in res) return reply.status(400).send(res);
    return res;
  });
}
