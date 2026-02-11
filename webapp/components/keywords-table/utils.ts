export function formatLargeNumber(
  num: number,
  short: boolean,
  decimals: number = 1,
): string {
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(decimals)}${short ? "B" : " billion"}`;
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(decimals)}${short ? "M" : " million"}`;
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(decimals)}${short ? "k" : " thousand"}`;
  }
  return num.toString();
}
