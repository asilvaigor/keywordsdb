import useSWR from "swr";
import { getKeywordsCount } from "@/lib/keywords";

import type { KeywordFilters } from "@/lib/types";

export function useCountsQuery({
  debouncedFilters,
  isFiltersDebouncing,
}: {
  debouncedFilters: KeywordFilters;
  isFiltersDebouncing: boolean;
}) {
  const { data: totalRows, isLoading: isTotalRowsLoadingQuery } = useSWR(
    [debouncedFilters],
    async ([filters]) => getKeywordsCount(filters),
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
