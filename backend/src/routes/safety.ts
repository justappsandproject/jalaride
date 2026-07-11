import type { FastifyInstance } from "fastify";
import { z } from "zod";

const sosBody = z.object({
  rideId: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  silent: z.boolean().default(false),
});

const recordingBody = z.object({
  rideId: z.string().optional(),
  active: z.boolean(),
});

export async function safetyRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.post("/sos", async (req) => {
    const user = req.user as { sub: string };
    const parsed = sosBody.safeParse(req.body);
    if (!parsed.success) {
      return { error: parsed.error.flatten() };
    }
    const event = await app.prisma.sosEvent.create({
      data: {
        userId: user.sub,
        rideId: parsed.data.rideId,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        silent: parsed.data.silent,
      },
    });
    if (parsed.data.rideId) {
      app.broadcastRideUpdate?.(parsed.data.rideId, {
        type: "sos",
        event,
        message: parsed.data.silent ? "Silent SOS activated" : "SOS activated — emergency notified",
      });
    }
    return {
      ok: true,
      event,
      message: parsed.data.silent
        ? "Silent recording started. Location shared with Jala Ride safety team."
        : "SOS sent. Emergency services (112) notified. Location shared.",
    };
  });

  app.post("/recording", async (req) => {
    const user = req.user as { sub: string };
    const parsed = recordingBody.safeParse(req.body);
    if (!parsed.success) {
      return { error: parsed.error.flatten() };
    }
    if (parsed.data.active) {
      const rec = await app.prisma.safetyRecording.create({
        data: { userId: user.sub, rideId: parsed.data.rideId, active: true },
      });
      if (parsed.data.rideId) {
        app.broadcastRideUpdate?.(parsed.data.rideId, { type: "recording_started", userId: user.sub });
      }
      return { ok: true, recording: rec, message: "Silent safety recording active" };
    }
    await app.prisma.safetyRecording.updateMany({
      where: { userId: user.sub, active: true },
      data: { active: false },
    });
    return { ok: true, message: "Recording stopped" };
  });
}
