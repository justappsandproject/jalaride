import type { FastifyInstance } from "fastify";
import type { Driver, Ride } from "@prisma/client";

const OFFER_TTL_MS = 15_000;
/** Tolerate ~2–3 missed beats plus brief backgrounding (client beats every 10s). */
const HEARTBEAT_MAX_AGE_MS = 90_000;
const MAX_ROUNDS = 3;
const RADIUS_STEP_KM = 2;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

export type NearestDriver = Driver & { distanceKm: number };

export async function findNearestDrivers(
  app: FastifyInstance,
  lat: number,
  lng: number,
  radiusKm: number,
  excludeIds: string[] = [],
  limit = 5,
): Promise<NearestDriver[]> {
  const cutoff = new Date(Date.now() - HEARTBEAT_MAX_AGE_MS);
  const drivers = await app.prisma.driver.findMany({
    where: {
      status: "APPROVED",
      isOnline: true,
      availability: { in: ["ONLINE"] },
      lat: { not: null },
      lng: { not: null },
      lastHeartbeat: { gte: cutoff },
      ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
    },
  });

  return drivers
    .map((d) => ({
      ...d,
      distanceKm: haversineKm({ lat, lng }, { lat: d.lat!, lng: d.lng! }),
    }))
    .filter((d) => d.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export async function offerToNextDriver(app: FastifyInstance, rideId: string) {
  const ride = await app.prisma.ride.findUnique({
    where: { id: rideId },
    include: { offers: true },
  });
  if (!ride || !["SEARCHING", "REQUESTED"].includes(ride.status)) return null;

  const offeredIds = ride.offers.map((o) => o.driverId);
  const pending = ride.offers.find((o) => o.status === "PENDING" && o.expiresAt > new Date());
  if (pending) return pending;

  const nearest = await findNearestDrivers(
    app,
    ride.originLat,
    ride.originLng,
    ride.searchRadiusKm,
    offeredIds,
    1,
  );

  if (nearest.length === 0) {
    if (ride.dispatchRound >= MAX_ROUNDS) {
      const updated = await app.prisma.ride.update({
        where: { id: rideId },
        data: { status: "NO_DRIVER" },
      });
      app.broadcastRideUpdate?.(rideId, { type: "no_driver", ride: updated });
      return null;
    }
    const updated = await app.prisma.ride.update({
      where: { id: rideId },
      data: {
        dispatchRound: { increment: 1 },
        searchRadiusKm: ride.searchRadiusKm + RADIUS_STEP_KM,
      },
    });
    return offerToNextDriver(app, updated.id);
  }

  const driver = nearest[0];
  const offer = await app.prisma.rideOffer.create({
    data: {
      rideId,
      driverId: driver.id,
      expiresAt: new Date(Date.now() + OFFER_TTL_MS),
    },
    include: {
      ride: { include: { rider: { select: { id: true, name: true, phone: true } } } },
      driver: { include: { user: { select: { id: true, name: true, phone: true } } } },
    },
  });

  app.broadcastRideUpdate?.(rideId, {
    type: "offer_created",
    offer: {
      id: offer.id,
      rideId,
      driverId: driver.id,
      expiresAt: offer.expiresAt,
      fareEstimate: ride.fareEstimate,
      originLabel: ride.originLabel,
      destLabel: ride.destLabel,
      distanceKm: ride.distanceKm,
      durationMin: ride.durationMin,
    },
  });

  // Driver-scoped channel via ride broadcast; clients also poll /offers
  app.broadcastDriverOffer?.(driver.id, {
    type: "ride_offer",
    offer,
  });

  return offer;
}

export async function startDispatch(app: FastifyInstance, ride: Ride) {
  await app.prisma.ride.update({
    where: { id: ride.id },
    data: { status: "SEARCHING", dispatchRound: 0 },
  });
  return offerToNextDriver(app, ride.id);
}

export async function expireStaleOffers(app: FastifyInstance) {
  const now = new Date();
  const stale = await app.prisma.rideOffer.findMany({
    where: { status: "PENDING", expiresAt: { lte: now } },
  });
  for (const offer of stale) {
    await app.prisma.rideOffer.update({
      where: { id: offer.id },
      data: { status: "EXPIRED", respondedAt: now },
    });
    app.broadcastDriverOffer?.(offer.driverId, {
      type: "offer_expired",
      offerId: offer.id,
      rideId: offer.rideId,
    });
    await offerToNextDriver(app, offer.rideId);
  }
  return stale.length;
}

export function startDispatchLoop(app: FastifyInstance) {
  const timer = setInterval(() => {
    expireStaleOffers(app).catch((err) => app.log.error(err, "expire offers failed"));
  }, 5_000);
  timer.unref?.();
  return timer;
}
