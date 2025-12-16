/**
 * Format large numbers with k/M suffix
 * Examples:
 * 0 → 0
 * 999 → 999
 * 1000 → 1k
 * 1500 → 1.5k
 * 12302 → 12.3k
 * 1000000 → 1M
 */
export function formatNumber(num) {
  if (!num || num === 0) return '0';
  
  const number = Number(num);
  
  if (number < 1000) {
    return number.toString();
  }
  
  if (number < 1000000) {
    const k = number / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  
  const m = number / 1000000;
  return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
}