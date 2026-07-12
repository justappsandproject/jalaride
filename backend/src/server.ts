import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import { PrismaClient } from "@prisma/client";
import { authRoutes } from "./routes/auth.js";
import { rideRoutes } from "./routes/rides.js";
import { driverRoutes } from "./routes/drivers.js";
import { adminRoutes } from "./routes/admin.js";
import { nimcRoutes } from "./routes/nimc.js";
import { onboardingRoutes } from "./routes/onboarding.js";
import { safetyRoutes } from "./routes/safety.js";
import { placesRoutes } from "./routes/places.js";
import { shareRoutes, registerRideExtras } from "./routes/share.js";
import { registerWs } from "./plugins/ws.js";
import { registerJwtAuth } from "./plugins/jwt-auth.js";
import { startDispatchLoop } from "./services/dispatch.js";

export const prisma = new PrismaClient();

const app = Fastify({
  logger: true,
  bodyLimit: 12 * 1024 * 1024, // safety audio uploads
});

await app.register(cors, { origin: true, credentials: true });
await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? "dev-secret-change-me",
});
await app.register(websocket);
await registerJwtAuth(app);

app.decorate("prisma", prisma);

app.get("/", async () => ({
  service: "jala-ride-api",
  status: "ok",
  docs: "https://github.com/justappsandproject/jalaride",
  endpoints: {
    health: "/health",
    auth: "/v1/auth",
    nimc: "/v1/nimc",
    onboarding: "/v1/onboarding",
    rides: "/v1/rides",
    driver: "/v1/driver",
    places: "/v1/places",
    safety: "/v1/safety",
    share: "/v1/share/:token",
    admin: "/v1/admin",
    websocket: "/ws?rideId={id} or /ws?driverId={id}",
  },
  note: "Free-tier hosts may sleep after ~15 min idle; first request can take 30–60s.",
}));

app.get("/health", async () => ({ ok: true, service: "jala-ride-api" }));

await app.register(authRoutes, { prefix: "/v1/auth" });
await app.register(nimcRoutes, { prefix: "/v1/nimc" });
await app.register(onboardingRoutes, { prefix: "/v1/onboarding" });
await app.register(rideRoutes, { prefix: "/v1/rides" });
await app.register(
  async (scoped) => {
    await registerRideExtras(scoped);
  },
  { prefix: "/v1/rides" },
);
await app.register(shareRoutes, { prefix: "/v1/share" });
await app.register(driverRoutes, { prefix: "/v1/driver" });
await app.register(placesRoutes, { prefix: "/v1/places" });
await app.register(safetyRoutes, { prefix: "/v1/safety" });
await app.register(adminRoutes, { prefix: "/v1/admin" });
await registerWs(app);
startDispatchLoop(app);

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

try {
  await app.listen({ port, host });
  app.log.info(`Jala Ride API listening on http://${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
