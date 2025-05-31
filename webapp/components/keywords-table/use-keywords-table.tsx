import { getKeywords } from "@/lib/keywords";
import {
  type ColumnFiltersState,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Skeleton } from "../ui/skeleton";
import { columns } from "./columns";
import useDebounce from "./use-debounce";

export function useKeywordsTable() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "avg_monthly_searches", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = useState<number | undefined>(undefined);

  const resetPagination = useCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setTotalRows(undefined);
  }, []);
  const keyword = columnFilters.find((f) => f.id === "keyword")
    ?.value as string;
  const debouncedKeyword = useDebounce(keyword, resetPagination);

  const {
    data: page,
    isLoading,
    error,
  } = useSWR(
    [debouncedKeyword, sorting, pageIndex, pageSize],
    async ([keyword, sort, page, pageSize]) =>
      getKeywords({ keyword }, sort, page + 1, pageSize),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      refreshInterval: 0,
      dedupingInterval: 1000,
      keepPreviousData: true,
    },
  );

  useEffect(() => {
    if (page?.totalRows) {
      setTotalRows(page.totalRows);
    }
  }, [page?.totalRows]);

  const tableData = useMemo(
    () => (isLoading ? Array(10).fill({}) : (page?.keywords ?? [])),
    [isLoading, page?.keywords],
  );

  const tableColumns = useMemo(
    () =>
      isLoading
        ? columns.map((column) => ({
            ...column,
            cell: () => (
              <Skeleton
                className="my-0.5 h-[16px]"
                style={{ width: column.size ? 0.5 * column.size : undefined }}
              />
            ),
          }))
        : columns,
    [isLoading],
  );

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
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
    enableSorting: !isLoading,
    manualPagination: true,
    manualFiltering: true,
    pageCount: page?.totalPages ?? -1,
  });

  return {
    table,
    isLoading,
    error,
    totalRows,
    pageIndex,
    pageSize,
  };
}
