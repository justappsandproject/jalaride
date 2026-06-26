/** Weekly remittance: (price × rate% × years) ÷ (years × 52) */
export function calculateWeeklyRemittance(
  purchasePrice: number,
  annualRatePercent: number,
  amortizationYears: number,
): number {
  if (amortizationYears <= 0) return 0;
  return (
    (purchasePrice * (annualRatePercent / 100) * amortizationYears) /
    (amortizationYears * 52)
  );
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export const FARE_RATES = {
  economy: { base: 300, perKm: 80 },
  comfort: { base: 500, perKm: 120 },
  xl: { base: 700, perKm: 150 },
  moto: { base: 150, perKm: 50 },
} as const;

export type TripCategory = keyof typeof FARE_RATES;

export function calculateSurgeMultiplier(_lat: number, _lng: number): number {
  const hour = new Date().getHours();
  if (hour >= 7 && hour <= 9) return 1.2;
  if (hour >= 17 && hour <= 20) return 1.3;
  return 1.0;
}
