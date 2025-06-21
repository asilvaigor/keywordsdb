import { getKeywordsCount } from "@/lib/keywords";
import { useState } from "react";
import useSWR from "swr";

import type { KeywordFilters } from "@/lib/types";

export function useCountsQuery({
  debouncedFilters,
  isFiltersDebouncing,
}: { debouncedFilters: KeywordFilters; isFiltersDebouncing: boolean }) {
  const [isCacheMiss, setIsCacheMiss] = useState(false);

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
      onLoadingSlow: () => setIsCacheMiss(true),
      onSuccess: () => setIsCacheMiss(false),
      onError: () => setIsCacheMiss(false),
    },
  );
  const isLoading = isTotalRowsLoadingQuery || isFiltersDebouncing;

  return {
    isLoading,
    totalRows,
    isCacheMiss,
  };
}
