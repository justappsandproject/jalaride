/** Fare config — ₦ rates. Surge stub defaults to 1.0 */
export const FARE_CONFIG = {
  ECONOMY: { base: 500, perKm: 120, perMin: 15, label: "Economy" },
  VERIFIED: { base: 700, perKm: 150, perMin: 20, label: "Jala Verified" },
  FLEET: { base: 900, perKm: 180, perMin: 25, label: "Government Fleet" },
} as const;

export type RideCategory = keyof typeof FARE_CONFIG;

export function estimateFare(
  category: string,
  distanceKm: number,
  durationMin: number,
  surge = 1.0,
) {
  const key = (category in FARE_CONFIG ? category : "ECONOMY") as RideCategory;
  const cfg = FARE_CONFIG[key];
  const raw = cfg.base + distanceKm * cfg.perKm + durationMin * cfg.perMin;
  return Math.round(raw * surge);
}

export function estimateAllFares(distanceKm: number, durationMin: number, surge = 1.0) {
  return (Object.keys(FARE_CONFIG) as RideCategory[]).map((key) => ({
    category: key,
    label: FARE_CONFIG[key].label,
    fare: estimateFare(key, distanceKm, durationMin, surge),
    etaMin: Math.round(durationMin),
    distanceKm: Math.round(distanceKm * 10) / 10,
  }));
}
