import type { PrismaClient } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    broadcastRideUpdate?: (rideId: string, payload: unknown) => void;
    broadcastDriverLocation?: (
      driverId: string,
      payload: { lat: number; lng: number; heading?: number },
    ) => void;
  }
}
