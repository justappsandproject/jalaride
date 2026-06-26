import { Brand } from '@/constants/brand';

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
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export { Brand };
