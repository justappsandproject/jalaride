import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import { PrismaClient } from "@prisma/client";
import { authRoutes } from "./routes/auth.js";
import { rideRoutes } from "./routes/rides.js";
import { driverRoutes } from "./routes/drivers.js";
import { adminRoutes } from "./routes/admin.js";
import { registerWs } from "./plugins/ws.js";
import { registerJwtAuth } from "./plugins/jwt-auth.js";

export const prisma = new PrismaClient();

const app = Fastify({ logger: true });

await app.register(cors, { origin: true, credentials: true });
await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
});
await app.register(websocket);
await registerJwtAuth(app);

app.decorate("prisma", prisma);

app.get("/health", async () => ({ ok: true, service: "jala-ride-api" }));

await app.register(authRoutes, { prefix: "/v1/auth" });
await app.register(rideRoutes, { prefix: "/v1/rides" });
await app.register(driverRoutes, { prefix: "/v1/driver" });
await app.register(adminRoutes, { prefix: "/v1/admin" });
await registerWs(app);

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
  app.log.info(`Jala Ride API listening on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
