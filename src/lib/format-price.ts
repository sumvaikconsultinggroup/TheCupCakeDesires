/**
 * Formats a dollar amount for display without the currency symbol:
 * whole amounts stay short ("5", "1,200") and anything with cents always
 * shows two decimals ("5.50", "16.50").
 */
export function formatAmount(value: number | string | null | undefined): string {
  const n = Math.round((Number(value) || 0) * 100) / 100
  return n.toLocaleString('en-AU', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })
}
