/**
 * Format a number as a full Euro currency string.
 * Example: 1234567.89 -> "€1,234,567.89"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as a compact Euro currency string.
 * Examples: 1200000 -> "€1.2M", 450000 -> "€450K", 999 -> "€999"
 */
export function formatCompactCurrency(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_000_000_000) {
    const value = abs / 1_000_000_000;
    return `${sign}\u20AC${value.toFixed(value >= 10 ? 0 : 1)}B`;
  }
  if (abs >= 1_000_000) {
    const value = abs / 1_000_000;
    return `${sign}\u20AC${value.toFixed(value >= 10 ? 0 : 1)}M`;
  }
  if (abs >= 1_000) {
    const value = abs / 1_000;
    return `${sign}\u20AC${value.toFixed(value >= 10 ? 0 : 0)}K`;
  }
  return `${sign}\u20AC${abs.toFixed(0)}`;
}

/**
 * Format an ISO date string into a readable format.
 * Example: "2024-03-15" -> "15 Mar 2024"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return dateStr;
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format a number with thousands separators.
 * Example: 1234567 -> "1,234,567"
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IE').format(num);
}
