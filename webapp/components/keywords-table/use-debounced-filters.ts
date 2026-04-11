import type { ColumnFiltersState } from "@tanstack/react-table";
import { useState } from "react";
import type { KeywordFilters } from "@/lib/types";
import useDebounce from "./use-debounce";

export function useDebouncedFilters({
  resetPagination,
}: {
  resetPagination: () => void;
}) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: "is_adult", value: "false" },
  ]);

  const {
    debouncedValue: debouncedFilters,
    isDebouncing: isFiltersDebouncing,
  } = useDebounce(columnFilters, resetPagination);

  const debouncedFiltersT: KeywordFilters = debouncedFilters.reduce(
    (acc, filter) => {
      const v = filter.value;
      if (
        ["keyword", "intent", "entity_type", "saas_potential"].includes(
          filter.id,
        )
      ) {
        acc[filter.id] = v as string;
      } else if (
        ["is_adult", "is_question", "is_comparison", "is_branded"].includes(
          filter.id,
        )
      ) {
        acc[filter.id] =
          v === "true" ? true : v === "false" ? false : undefined;
      } else {
        acc[filter.id] = JSON.parse(v as string);
      }
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
