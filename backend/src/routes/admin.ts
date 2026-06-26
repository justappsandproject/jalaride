import type { FastifyInstance } from "fastify";

function assertAdmin(req: { user?: unknown }) {
  const u = req.user as { role?: string } | undefined;
  return u?.role === "ADMIN";
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/drivers/pending", async (req, reply) => {
    if (!assertAdmin(req)) {
      return reply.status(403).send({ error: "Admin only" });
    }
    return app.prisma.driver.findMany({
      where: { status: "PENDING" },
      include: { user: true, vehicles: true },
    });
  });

  app.get("/rides/live", async (req, reply) => {
    if (!assertAdmin(req)) {
      return reply.status(403).send({ error: "Admin only" });
    }
    return app.prisma.ride.findMany({
      where: {
        status: { in: ["REQUESTED", "MATCHED", "DRIVER_EN_ROUTE", "IN_PROGRESS"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        rider: { select: { id: true, name: true, phone: true } },
        driver: { include: { user: { select: { name: true, phone: true } } } },
      },
    });
  });

  app.post("/drivers/:id/approve", async (req, reply) => {
    if (!assertAdmin(req)) {
      return reply.status(403).send({ error: "Admin only" });
    }
    const { id } = req.params as { id: string };
    const driver = await app.prisma.driver.update({
      where: { id },
      data: { status: "APPROVED" },
      include: { user: true },
    });
    return { driver };
  });

  app.post("/drivers/:id/reject", async (req, reply) => {
    if (!assertAdmin(req)) {
      return reply.status(403).send({ error: "Admin only" });
    }
    const { id } = req.params as { id: string };
    const driver = await app.prisma.driver.update({
      where: { id },
      data: { status: "REJECTED" },
      include: { user: true },
    });
    return { driver };
  });

  app.get("/stats/overview", async (req, reply) => {
    if (!assertAdmin(req)) {
      return reply.status(403).send({ error: "Admin only" });
    }
    const [users, drivers, ridesToday] = await Promise.all([
      app.prisma.user.count(),
      app.prisma.driver.count({ where: { status: "APPROVED" } }),
      app.prisma.ride.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);
    return { users, approvedDrivers: drivers, ridesToday };
  });
}
