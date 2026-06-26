import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function registerJwtAuth(app: FastifyInstance) {
  app.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }
    },
  );
}
