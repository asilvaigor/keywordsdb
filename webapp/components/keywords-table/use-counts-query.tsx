import useSWR from "swr";
import type { KeywordFilters } from "@/lib/types";
import { buildSearchParams } from "@/lib/utils";

const fetchCounts = async (filters: KeywordFilters, isSample: boolean) => {
  const urlParams = buildSearchParams({ filters, isSample });
  const response = await fetch(`/api/keywords/count?${urlParams.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch counts");
  }
  const data = await response.json();
  return data.count as number;
};

export function useCountsQuery({
  filters,
  isFiltersDebouncing,
  isSample,
}: {
  filters: KeywordFilters;
  isFiltersDebouncing: boolean;
  isSample: boolean;
}) {
  const { data: totalRows, isLoading: isTotalRowsLoadingQuery } = useSWR(
    [filters, isSample],
    async ([filters, isSample]) => fetchCounts(filters, isSample),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      refreshInterval: 0,
      dedupingInterval: 1000,
      keepPreviousData: true,
    },
  );
  const isLoading = isTotalRowsLoadingQuery || isFiltersDebouncing;
  return { isLoading, totalRows };
}
