/** Fare config — ₦ rates. Single product: Jala Executive */
export const FARE_CONFIG = {
  EXECUTIVE: { base: 800, perKm: 160, perMin: 25, label: "Jala Executive" },
  // Legacy aliases map to Executive so old clients still quote correctly
  ECONOMY: { base: 800, perKm: 160, perMin: 25, label: "Jala Executive" },
  VERIFIED: { base: 800, perKm: 160, perMin: 25, label: "Jala Executive" },
  FLEET: { base: 800, perKm: 160, perMin: 25, label: "Jala Executive" },
} as const;

export type RideCategory = keyof typeof FARE_CONFIG;

export function estimateFare(
  category: string,
  distanceKm: number,
  durationMin: number,
  surge = 1.0,
) {
  const key = (category in FARE_CONFIG ? category : "EXECUTIVE") as RideCategory;
  const cfg = FARE_CONFIG[key];
  const raw = cfg.base + distanceKm * cfg.perKm + durationMin * cfg.perMin;
  return Math.round(raw * surge);
}

export function estimateAllFares(distanceKm: number, durationMin: number, surge = 1.0) {
  return [
    {
      category: "EXECUTIVE",
      label: FARE_CONFIG.EXECUTIVE.label,
      fare: estimateFare("EXECUTIVE", distanceKm, durationMin, surge),
      etaMin: Math.round(durationMin),
      distanceKm: Math.round(distanceKm * 10) / 10,
    },
  ];
}
