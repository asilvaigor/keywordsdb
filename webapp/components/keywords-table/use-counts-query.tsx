import useSWR from "swr";
import type { KeywordFilters } from "@/lib/types";

const fetchCounts = async (filters: KeywordFilters, isSample: boolean) => {
  const params = new URLSearchParams();
  if (filters.keyword) params.append("keyword", filters.keyword);
  if (filters.volume_estimated_google)
    params.append(
      "volume_estimated_google",
      JSON.stringify(filters.volume_estimated_google),
    );
  if (filters.competition_index)
    params.append(
      "competition_index",
      JSON.stringify(filters.competition_index),
    );
  if (filters.cpc_high)
    params.append("cpc_high", JSON.stringify(filters.cpc_high));
  params.append("isSample", String(isSample));

  const response = await fetch(`/api/keywords/count?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch counts");
  }
  const data = await response.json();
  return data.count as number;
};

export function useCountsQuery({
  debouncedFilters,
  isFiltersDebouncing,
  isSample,
}: {
  debouncedFilters: KeywordFilters;
  isFiltersDebouncing: boolean;
  isSample: boolean;
}) {
  const { data: totalRows, isLoading: isTotalRowsLoadingQuery } = useSWR(
    [debouncedFilters, isSample],
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
