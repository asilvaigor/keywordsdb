import {
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { columns } from "./columns";
import { useCountsQuery } from "./use-counts-query";
import { useDebouncedFilters } from "./use-debounced-filters";
import { useKeywordsQuery } from "./use-keywords-query";
import { calcPageCount, usePagination } from "./use-pagination";

export function useKeywordsTable(defaultPageSize: number) {
  const { pageIndex, pageSize, setPagination, resetPagination, apiPageIndex } =
    usePagination(defaultPageSize);
  const {
    columnFilters,
    setColumnFilters,
    debouncedFilters,
    isFiltersDebouncing,
  } = useDebouncedFilters({ resetPagination });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "avg_monthly_searches", desc: true },
  ]);

  const { isLoading: isTotalRowsLoading, totalRows } = useCountsQuery({
    debouncedFilters,
    isFiltersDebouncing,
  });
  const { progress, isLoading, error, keywords, isCacheMiss } = useKeywordsQuery({
    sorting,
    filters: debouncedFilters,
    apiPageIndex,
    pageIndex,
    pageSize,
    isFiltersDebouncing,
  });

  const table = useReactTable({
    data: keywords,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: (value) => {
      setSorting(value);
      resetPagination();
    },
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination: { pageIndex, pageSize },
    },
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    pageCount: calcPageCount(totalRows, pageSize),
  });

  return {
    table,
    progress,
    isLoading,
    isTotalRowsLoading,
    isCacheMiss,
    error,
    pageIndex,
    pageSize,
    totalRows,
  };
}
