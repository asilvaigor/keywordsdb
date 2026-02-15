export const SAMPLE_MIN_VOLUME = 100000000;

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
        id: "avg_monthly_searches",
        value: JSON.stringify({ min: SAMPLE_MIN_VOLUME }),
      },
    ];
  }
  return [
    {
      id: "avg_monthly_searches-filter",
      column: "avg_monthly_searches",
      operator: "gte",
      value1: SAMPLE_MIN_VOLUME.toString(),
      value2: "",
      errors: {},
    },
  ];
}
