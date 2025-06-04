import { Skeleton } from "@/components/ui/skeleton";
import { getKeywordsCount } from "@/lib/keywords";
import type { Keyword } from "@/lib/types";
import {
  type ColumnFiltersState,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { columns } from "./columns";
import useDebounce from "./use-debounce";

function startStreaming({
  debouncedKeyword,
  sorting,
  eventSourceRef,
  setKeywords,
  setIsLoading,
  setError,
}: {
  debouncedKeyword: string;
  sorting: SortingState;
  eventSourceRef: React.RefObject<EventSource | null>;
  setKeywords: React.Dispatch<React.SetStateAction<Keyword[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<Error | null>>;
}) {
  if (eventSourceRef.current) {
    eventSourceRef.current.close();
  }

  setKeywords([]);
  setIsLoading(true);
  setError(null);

  const params = new URLSearchParams();
  if (debouncedKeyword) {
    params.append("keyword", debouncedKeyword);
  }
  if (sorting.length > 0) {
    params.append("sort", JSON.stringify(sorting));
  }
  params.append("pageSize", "100");

  const url = `/api/keywords/stream?${params.toString()}`;
  const eventSource = new EventSource(url);
  eventSourceRef.current = eventSource;

  eventSource.onmessage = (event) => {
    const data = event.data;

    if (data === "[DONE]") {
      setIsLoading(false);
      eventSource.close();
      return;
    }
    const keywords = JSON.parse(data) as Keyword[];
    setKeywords((prev) => (prev ? [...prev, ...keywords] : keywords));
  };

  eventSource.onerror = (err) => {
    console.error("EventSource error:", err);
    setError(new Error("Failed to stream data"));
    setIsLoading(false);
    eventSource.close();
  };
}

export function useKeywordsTable() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "avg_monthly_searches", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const resetPagination = useCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const keyword = columnFilters.find((f) => f.id === "keyword")
    ?.value as string;
  const debouncedKeyword = useDebounce(keyword, resetPagination);

  useEffect(() => {
    startStreaming({
      debouncedKeyword,
      sorting,
      eventSourceRef,
      setKeywords,
      setIsLoading,
      setError,
    });

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close(); // eslint-disable-line react-hooks/exhaustive-deps
      }
    };
  }, [debouncedKeyword, sorting]);

  const {
    data: totalRows,
    isLoading: isTotalRowsLoading,
    error: totalRowsError,
  } = useSWR(
    [debouncedKeyword],
    async ([keyword]) => getKeywordsCount({ keyword }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      refreshInterval: 0,
      dedupingInterval: 1000,
      keepPreviousData: true,
    },
  );

  const paginatedKeywords = useMemo(() => {
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    return keywords.slice(startIndex, endIndex);
  }, [keywords, pageIndex, pageSize]);
  const tableData = useMemo(
    () => (isLoading ? Array(10).fill({}) : paginatedKeywords),
    [isLoading, paginatedKeywords],
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
    pageCount: totalRows ? Math.ceil(totalRows / pageSize) : -1,
  });

  return {
    table,
    isLoading,
    error,
    totalRows,
    isTotalRowsLoading,
    totalRowsError,
    pageIndex,
    pageSize,
  };
}
