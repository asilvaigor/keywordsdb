import useSWR from "swr";
import { getKeywordsCount } from "@/lib/keywords/keywords";

import type { KeywordFilters } from "@/lib/types";

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
    async ([filters, isSample]) => getKeywordsCount(filters, isSample),
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
