import type { FastifyInstance } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

const registerBody = z.object({
  phone: z.string().min(6),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["RIDER", "DRIVER", "ADMIN"]).default("RIDER"),
});

const loginBody = z.object({
  phone: z.string(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (req, reply) => {
    const parsed = registerBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const { phone, password, name, role } = parsed.data;
    const existing = await app.prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return reply.status(409).send({ error: "Phone already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await app.prisma.user.create({
      data: {
        phone,
        name,
        passwordHash,
        role: role as UserRole,
        wallet: { create: {} },
        ...(role === "DRIVER"
          ? { driverProfile: { create: { status: "PENDING" } } }
          : {}),
      },
      select: { id: true, phone: true, name: true, role: true, createdAt: true },
    });
    const token = await reply.jwtSign({
      sub: user.id,
      role: user.role,
    });
    return { user, token };
  });

  app.post("/login", async (req, reply) => {
    const parsed = loginBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const user = await app.prisma.user.findUnique({
      where: { phone: parsed.data.phone },
      include: { driverProfile: true },
    });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }
    const token = await reply.jwtSign({ sub: user.id, role: user.role });
    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        driverStatus: user.driverProfile?.status,
      },
    };
  });

  app.get(
    "/me",
    { preHandler: [app.authenticate] },
    async (req) => {
      const sub = (req.user as { sub: string }).sub;
      const user = await app.prisma.user.findUnique({
        where: { id: sub },
        include: { driverProfile: { include: { vehicles: true } }, wallet: true },
      });
      if (!user) return { error: "Not found" };
      const { passwordHash: _, ...rest } = user;
      return rest;
    },
  );
}
