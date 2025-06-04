export function formatLargeNumber(num: number, short: boolean): string {
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(1)}${short ? "B" : " billion"}`;
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(1)}${short ? "M" : " million"}`;
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(1)}${short ? "k" : " thousand"}`;
  }
  return num.toString();
}
