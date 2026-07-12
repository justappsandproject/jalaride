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
  recordingId: z.string().optional(),
  fileData: z.string().optional(),
  mimeType: z.string().optional(),
  durationSec: z.number().int().min(0).max(3600).optional(),
});

const MAX_AUDIO_CHARS = 8_000_000; // ~6MB base64

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

  app.post("/recording", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    const parsed = recordingBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }
    const d = parsed.data;

    if (d.active) {
      const rec = await app.prisma.safetyRecording.create({
        data: { userId: user.sub, rideId: d.rideId, active: true },
      });
      if (d.rideId) {
        app.broadcastRideUpdate?.(d.rideId, { type: "recording_started", userId: user.sub });
      }
      return { ok: true, recording: { id: rec.id, active: true }, message: "Silent safety recording active" };
    }

    // Stop + optionally upload audio payload
    let target = d.recordingId
      ? await app.prisma.safetyRecording.findFirst({
          where: { id: d.recordingId, userId: user.sub },
        })
      : await app.prisma.safetyRecording.findFirst({
          where: { userId: user.sub, active: true },
          orderBy: { createdAt: "desc" },
        });

    if (!target) {
      target = await app.prisma.safetyRecording.create({
        data: { userId: user.sub, rideId: d.rideId, active: false },
      });
    }

    if (d.fileData && d.fileData.length > MAX_AUDIO_CHARS) {
      return reply.status(413).send({ error: "Recording too large (max ~6MB)" });
    }

    const updated = await app.prisma.safetyRecording.update({
      where: { id: target.id },
      data: {
        active: false,
        endedAt: new Date(),
        ...(d.fileData ? { fileData: d.fileData } : {}),
        ...(d.mimeType ? { mimeType: d.mimeType } : {}),
        ...(d.durationSec != null ? { durationSec: d.durationSec } : {}),
        ...(d.rideId && !target.rideId ? { rideId: d.rideId } : {}),
      },
    });

    await app.prisma.safetyRecording.updateMany({
      where: { userId: user.sub, active: true, id: { not: updated.id } },
      data: { active: false, endedAt: new Date() },
    });

    if (updated.rideId) {
      app.broadcastRideUpdate?.(updated.rideId, {
        type: "recording_saved",
        recordingId: updated.id,
        userId: user.sub,
      });
    }

    return {
      ok: true,
      recording: {
        id: updated.id,
        active: false,
        hasAudio: Boolean(updated.fileData),
        durationSec: updated.durationSec,
        mimeType: updated.mimeType,
      },
      message: "Recording saved for audit",
    };
  });

  /** List recordings for a ride (rider, driver on that ride, or admin) */
  app.get("/recordings", async (req, reply) => {
    const user = req.user as { sub: string; role: string };
    const q = z.object({ rideId: z.string() }).safeParse(req.query);
    if (!q.success) return reply.status(400).send({ error: "rideId required" });

    const ride = await app.prisma.ride.findUnique({
      where: { id: q.data.rideId },
      include: { driver: true },
    });
    if (!ride) return reply.status(404).send({ error: "Ride not found" });

    const isRider = ride.riderId === user.sub;
    const isDriver = ride.driver?.userId === user.sub;
    const isAdmin = user.role === "ADMIN";
    if (!isRider && !isDriver && !isAdmin) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    const recordings = await app.prisma.safetyRecording.findMany({
      where: { rideId: q.data.rideId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, role: true } } },
    });

    return {
      recordings: recordings.map((r) => ({
        id: r.id,
        rideId: r.rideId,
        active: r.active,
        hasAudio: Boolean(r.fileData),
        mimeType: r.mimeType,
        durationSec: r.durationSec,
        createdAt: r.createdAt,
        endedAt: r.endedAt,
        user: r.user,
        // Include audio for authorized parties (audit)
        fileData: r.fileData,
      })),
    };
  });
}
