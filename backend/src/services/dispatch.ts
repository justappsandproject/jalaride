import type { FastifyInstance } from "fastify";
import type { Driver, Ride } from "@prisma/client";

/** Longer TTL so offers survive switching apps on the same phone. */
const OFFER_TTL_MS = 60_000;
/**
 * Heartbeats pause when the driver app is backgrounded (common when testing
 * rider+driver on one device). Keep sticky online for 15 minutes.
 */
const HEARTBEAT_MAX_AGE_MS = 15 * 60_000;
const MAX_ROUNDS = 4;
const RADIUS_STEP_KM = 2;
export const DEFAULT_SEARCH_RADIUS_KM = 2;

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

export type NearestDriver = Driver & {
  distanceKm: number;
  user?: { id: string; name: string; phone: string } | null;
  vehicles?: { make: string; model: string; plate: string; category: string }[];
};

export async function findNearestDrivers(
  app: FastifyInstance,
  lat: number,
  lng: number,
  radiusKm: number,
  excludeIds: string[] = [],
  limit = 20,
): Promise<NearestDriver[]> {
  const cutoff = new Date(Date.now() - HEARTBEAT_MAX_AGE_MS);

  // Match any online driver with a recent enough heartbeat (or never-null location
  // that was set at go-online). Do NOT require admin APPROVED alone — goOnline
  // auto-promotes PENDING → APPROVED so matching works after onboarding.
  const drivers = await app.prisma.driver.findMany({
    where: {
      isOnline: true,
      availability: { in: ["ONLINE"] },
      status: { in: ["APPROVED", "PENDING"] },
      lat: { not: null },
      lng: { not: null },
      OR: [
        { lastHeartbeat: { gte: cutoff } },
        // Fallback: just came online; heartbeat write may have raced
        { lastHeartbeat: null, updatedAt: { gte: cutoff } },
      ],
      ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      vehicles: { take: 1 },
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
    // Expand radius for the next poll — do not recurse or riders see NO_DRIVER instantly
    await app.prisma.ride.update({
      where: { id: rideId },
      data: {
        dispatchRound: { increment: 1 },
        searchRadiusKm: ride.searchRadiusKm + RADIUS_STEP_KM,
      },
    });
    return null;
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

  app.broadcastDriverOffer?.(driver.id, {
    type: "ride_offer",
    offer,
  });

  return offer;
}

export async function startDispatch(app: FastifyInstance, ride: Ride) {
  await app.prisma.ride.update({
    where: { id: ride.id },
    data: {
      status: "SEARCHING",
      dispatchRound: 0,
      // Keep rider-chosen radius; don't reset below default
      searchRadiusKm: Math.max(ride.searchRadiusKm || DEFAULT_SEARCH_RADIUS_KM, DEFAULT_SEARCH_RADIUS_KM),
    },
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

  // Keep SEARCHING rides alive: retry dispatch periodically even without expired offers
  const searching = await app.prisma.ride.findMany({
    where: { status: "SEARCHING", driverId: null },
    take: 20,
    orderBy: { createdAt: "asc" },
  });
  for (const ride of searching) {
    const hasPending = await app.prisma.rideOffer.findFirst({
      where: { rideId: ride.id, status: "PENDING", expiresAt: { gt: now } },
    });
    if (!hasPending) await offerToNextDriver(app, ride.id);
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
