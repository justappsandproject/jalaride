import type { FastifyInstance } from "fastify";
import { z } from "zod";

const locationBody = z.object({
  lat: z.number(),
  lng: z.number(),
  heading: z.number().optional(),
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
      data: { isOnline: true },
    });
    return { driver };
  });

  app.post("/offline", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    if (user.role !== "DRIVER") {
      return reply.status(403).send({ error: "Drivers only" });
    }
    const driver = await app.prisma.driver.update({
      where: { userId: user.sub },
      data: { isOnline: false },
    });
    return { driver };
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
      },
    });
    app.broadcastDriverLocation?.(driver.id, parsed.data);
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
