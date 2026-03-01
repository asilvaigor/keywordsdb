export const SAMPLE_MIN_VOLUME = 1000000;

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

export function getDefaultFilters(
  isSample: boolean,
  component: "DynamicFilter" | "ColumnFilter",
) {
  if (!isSample) {
    return [];
  }
  if (component === "ColumnFilter") {
    return [
      {
        id: "volume_estimated_google",
        value: JSON.stringify({ min: SAMPLE_MIN_VOLUME }),
      },
    ];
  }
  return [
    {
      id: "volume_estimated_google-filter",
      column: "volume_estimated_google",
      operator: "gte",
      value1: SAMPLE_MIN_VOLUME.toString(),
      value2: "",
      errors: {},
    },
  ];
}
