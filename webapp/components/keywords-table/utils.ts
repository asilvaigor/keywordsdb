export function formatLargeNumber(num: number, decimals: number = 1): string {
  if (num >= 1e9) {
    return `${parseFloat((num / 1e9).toFixed(decimals))}B`;
  }
  if (num >= 1e6) {
    return `${parseFloat((num / 1e6).toFixed(decimals))}M`;
  }
  if (num >= 1e3) {
    return `${parseFloat((num / 1e3).toFixed(decimals))}k`;
  }
  return num.toString();
}
