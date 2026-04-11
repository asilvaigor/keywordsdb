import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useState } from "react";
import { columns } from "./columns";
import useClickhouseReady from "./use-clickhouse-ready";
import { useCountsQuery } from "./use-counts-query";
import { useDebouncedFilters } from "./use-debounced-filters";
import { useDownloadModal } from "./use-download-modal";
import { useKeywordsQuery } from "./use-keywords-query";
import { calcPageCount, usePagination } from "./use-pagination";

export function useKeywordsTable({
  defaultPageSize,
  isSample,
}: {
  defaultPageSize: number;
  isSample: boolean;
}) {
  const { pageIndex, pageSize, setPagination, resetPagination, apiPageIndex } =
    usePagination(defaultPageSize);
  const {
    columnFilters,
    setColumnFilters,
    debouncedFilters,
    isFiltersDebouncing,
  } = useDebouncedFilters({ resetPagination });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "volume_estimated_google", desc: true },
  ]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    volume_estimated_google: true,
    volume_google: false,
    volume_bing: false,
    competition_index: true,
    cpc_high: true,
    is_adult: false,
    is_question: false,
    is_comparison: false,
    is_branded: false,
    intent: true,
    entity_type: false,
    saas_potential: false,
    volume_history_google: true,
    updated_at: false,
  });

  const isClickhouseReady = useClickhouseReady(!isSample);
  const { isLoading: isTotalRowsLoading, totalRows: totalRowsQuery } =
    useCountsQuery({
      filters: debouncedFilters,
      isFiltersDebouncing,
      isSample,
    });
  const { progress, isLoading, error, keywords, isCacheMiss } =
    useKeywordsQuery({
      sorting,
      filters: debouncedFilters,
      columnVisibility,
      apiPageIndex,
      pageIndex,
      pageSize,
      isFiltersDebouncing,
      isSample,
    });
  const { handleDownload, isLoading: isDownloadLoading } = useDownloadModal({
    filters: debouncedFilters,
    sorting,
    isSample,
  });

  const totalRows =
    isTotalRowsLoading || totalRowsQuery == null
      ? !isLoading && keywords.length < pageSize
        ? keywords.length
        : undefined
      : totalRowsQuery;

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
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      pagination: { pageIndex, pageSize },
      columnVisibility,
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
    isDbReady: isClickhouseReady || !isCacheMiss,
    handleDownload,
    isDownloadLoading,
    debouncedFilters,
    error,
    pageIndex,
    pageSize,
    totalRows,
  };
}
