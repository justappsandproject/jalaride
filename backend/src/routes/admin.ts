import type { FastifyInstance } from "fastify";

function assertAdmin(req: { user?: unknown }) {
  const u = req.user as { role?: string } | undefined;
  return u?.role === "ADMIN";
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/riders", async (req, reply) => {
    if (!assertAdmin(req)) return reply.status(403).send({ error: "Admin only" });
    const riders = await app.prisma.user.findMany({
      where: { role: "RIDER" },
      orderBy: { createdAt: "desc" },
      include: {
        documents: { select: { docType: true, verified: true } },
        _count: { select: { ridesAsRider: true } },
      },
    });
    return {
      riders: riders.map(({ passwordHash: _, ...r }) => ({
        ...r,
        totalRides: r._count.ridesAsRider,
      })),
    };
  });

  app.get("/drivers", async (req, reply) => {
    if (!assertAdmin(req)) return reply.status(403).send({ error: "Admin only" });
    const drivers = await app.prisma.driver.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          include: { documents: { select: { id: true, docType: true, verified: true } } },
        },
        vehicles: true,
        _count: { select: { rides: true } },
      },
    });
    return { drivers };
  });

  app.get("/drivers/pending", async (req, reply) => {
    if (!assertAdmin(req)) return reply.status(403).send({ error: "Admin only" });
    return app.prisma.driver.findMany({
      where: { status: "PENDING" },
      include: {
        user: { include: { documents: true } },
        vehicles: true,
      },
    });
  });

  app.post("/drivers/:id/approve", async (req, reply) => {
    if (!assertAdmin(req)) return reply.status(403).send({ error: "Admin only" });
    const { id } = req.params as { id: string };
    const driver = await app.prisma.driver.update({
      where: { id },
      data: { status: "APPROVED" },
      include: { user: true },
    });
    await app.prisma.user.update({
      where: { id: driver.userId },
      data: { registrationStatus: "APPROVED" },
    });
    return { driver };
  });

  app.post("/drivers/:id/reject", async (req, reply) => {
    if (!assertAdmin(req)) return reply.status(403).send({ error: "Admin only" });
    const { id } = req.params as { id: string };
    const driver = await app.prisma.driver.update({
      where: { id },
      data: { status: "REJECTED" },
      include: { user: true },
    });
    await app.prisma.user.update({
      where: { id: driver.userId },
      data: { registrationStatus: "REJECTED" },
    });
    return { driver };
  });

  app.post("/documents/:id/verify", async (req, reply) => {
    if (!assertAdmin(req)) return reply.status(403).send({ error: "Admin only" });
    const { id } = req.params as { id: string };
    const doc = await app.prisma.document.update({
      where: { id },
      data: { verified: true },
    });
    return { document: doc };
  });

  app.get("/rides/live", async (req, reply) => {
    if (!assertAdmin(req)) return reply.status(403).send({ error: "Admin only" });
    const rides = await app.prisma.ride.findMany({
      where: {
        status: {
          in: ["REQUESTED", "MATCHED", "DRIVER_EN_ROUTE", "ARRIVED", "PIN_CONFIRMED", "IN_PROGRESS"],
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        rider: { select: { id: true, name: true, phone: true, nin: true } },
        driver: { include: { user: { select: { name: true, phone: true } } } },
      },
    });
    return { rides };
  });

  app.get("/sos/recent", async (req, reply) => {
    if (!assertAdmin(req)) return reply.status(403).send({ error: "Admin only" });
    const events = await app.prisma.sosEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { name: true, phone: true, role: true } } },
    });
    return { events };
  });

  app.get("/recordings/recent", async (req, reply) => {
    if (!assertAdmin(req)) return reply.status(403).send({ error: "Admin only" });
    const recordings = await app.prisma.safetyRecording.findMany({
      where: { fileData: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, name: true, phone: true, role: true } },
        ride: { select: { id: true, status: true, originLabel: true, destLabel: true } },
      },
    });
    return {
      recordings: recordings.map((r) => ({
        id: r.id,
        rideId: r.rideId,
        mimeType: r.mimeType,
        durationSec: r.durationSec,
        createdAt: r.createdAt,
        endedAt: r.endedAt,
        hasAudio: Boolean(r.fileData),
        fileData: r.fileData,
        user: r.user,
        ride: r.ride,
      })),
    };
  });

  app.get("/stats/overview", async (req, reply) => {
    if (!assertAdmin(req)) return reply.status(403).send({ error: "Admin only" });
    const [users, riders, drivers, pendingDrivers, ridesToday, sosToday] = await Promise.all([
      app.prisma.user.count(),
      app.prisma.user.count({ where: { role: "RIDER", registrationStatus: "APPROVED" } }),
      app.prisma.driver.count({ where: { status: "APPROVED" } }),
      app.prisma.driver.count({ where: { status: "PENDING" } }),
      app.prisma.ride.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      app.prisma.sosEvent.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);
    return { users, riders, approvedDrivers: drivers, pendingDrivers, ridesToday, sosToday };
  });
}
