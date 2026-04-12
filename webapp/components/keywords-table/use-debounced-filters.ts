import type { ColumnFiltersState } from "@tanstack/react-table";
import { useState } from "react";
import type { KeywordFilters } from "@/lib/types";
import useDebounce from "./use-debounce";

function buildInitialColumnFilters(
  filters: KeywordFilters,
): ColumnFiltersState {
  return Object.entries(filters).reduce<ColumnFiltersState>(
    (acc, [id, value]) => {
      if (value == null || value === "") {
        return acc;
      }

      acc.push({
        id,
        value:
          typeof value === "string" || typeof value === "boolean"
            ? value.toString()
            : JSON.stringify(value),
      });
      return acc;
    },
    [],
  );
}

export function useDebouncedFilters({
  resetPagination,
  defaultFilters,
}: {
  resetPagination: () => void;
  defaultFilters?: KeywordFilters;
}) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() =>
    buildInitialColumnFilters({
      is_adult: false,
      ...defaultFilters,
    }),
  );

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
