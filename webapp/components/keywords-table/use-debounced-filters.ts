import type { KeywordFilters } from "@/lib/types";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useState } from "react";
import useDebounce from "./use-debounce";

export function useDebouncedFilters({
  resetPagination,
}: {
  resetPagination: () => void;
}) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const {
    debouncedValue: debouncedFilters,
    isDebouncing: isFiltersDebouncing,
  } = useDebounce(columnFilters, resetPagination);

  const debouncedFiltersT: KeywordFilters = debouncedFilters.reduce(
    (acc, filter) => {
      const v = filter.value as string;
      acc[filter.id] = filter.id === "keyword" ? v : JSON.parse(v);
      return acc;
    },
    {} as Record<string, unknown>,
  );

  return {
    columnFilters,
    setColumnFilters,
    debouncedFilters: debouncedFiltersT,
    isFiltersDebouncing,
  };
}
