import { getKeywordsCount } from "@/lib/keywords";
import type { Keyword, KeywordRow } from "@/lib/types";
import {
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import useSWRSubscription from "swr/subscription";
import { columns } from "./columns";
import useDebounce from "./use-debounce";

const API_PAGE_SIZE = 100;

class KeywordsStreamer extends EventTarget {
  private eventSource: EventSource | null = null;

  startStreaming(params: {
    page: number;
    filters: ColumnFiltersState;
    keyword: string;
    sorting: SortingState;
  }) {
    this.stopStreaming();

    const urlParams = new URLSearchParams();
    urlParams.append("page", (params.page + 1).toString());
    urlParams.append("pageSize", API_PAGE_SIZE.toString());
    for (const filter of params.filters) {
      if (filter.value != null) {
        urlParams.append(filter.id, filter.value.toString());
      }
    }
    if (params.keyword) {
      urlParams.append("keyword", params.keyword);
    }
    if (params.sorting.length > 0) {
      for (const sort of params.sorting) {
        urlParams.append("sortBy", `${sort.desc ? "-" : "+"}${sort.id}`);
      }
    }

    const url = `/api/keywords/stream?${urlParams.toString()}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      if (event.data === "[DONE]") {
        this.dispatchEvent(new CustomEvent("complete"));
        return;
      }

      try {
        const keywords = JSON.parse(event.data) as Keyword[];
        this.dispatchEvent(new CustomEvent("data", { detail: keywords }));
      } catch (error) {
        this.dispatchEvent(
          new CustomEvent("error", {
            detail: error instanceof Error ? error : new Error(String(error)),
          }),
        );
      }
    };

    this.eventSource.onerror = () => {
      this.dispatchEvent(
        new CustomEvent("error", {
          detail: new Error("Failed to stream data"),
        }),
      );
    };
  }

  stopStreaming() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  isStreaming() {
    return this.eventSource !== null;
  }
}

const keywordsStreamer = new KeywordsStreamer();

export function useKeywordsTable(defaultPageSize: number) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "avg_monthly_searches", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });
  const [hasReceivedData, setHasReceivedData] = useState(false);
  const [isLoadingSlow, setIsLoadingSlow] = useState(false);

  const resetPagination = useCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const apiPageIndex = useMemo(
    () => Math.floor((pageIndex * pageSize) / API_PAGE_SIZE),
    [pageIndex, pageSize],
  );
  const keyword = columnFilters.find((f) => f.id === "keyword")
    ?.value as string;
  const { debouncedValue: debouncedKeyword, isDebouncing } = useDebounce(
    keyword,
    resetPagination,
  );

  const streamKey = useMemo(() => {
    const key = JSON.stringify({
      page: apiPageIndex,
      filters: columnFilters.filter((f) => f.id !== "keyword"),
      keyword: debouncedKeyword,
      sorting,
    });
    setHasReceivedData(false);
    setIsLoadingSlow(false);
    return key;
  }, [apiPageIndex, columnFilters, debouncedKeyword, sorting]);

  const { data: keywords = [], error } = useSWRSubscription(
    streamKey,
    (key, { next }) => {
      const params = JSON.parse(key);
      let accumulatedKeywords: Keyword[] = [];

      const handleData = (event: CustomEvent) => {
        const newKeywords = event.detail as Keyword[];
        accumulatedKeywords = [...accumulatedKeywords, ...newKeywords];
        setHasReceivedData(true);
        next(null, accumulatedKeywords);
      };

      const handleError = (event: CustomEvent) => {
        const error = event.detail as Error;
        setHasReceivedData(true);
        next(error);
      };

      const handleComplete = () => {
        setHasReceivedData(true);
        keywordsStreamer.stopStreaming();
      };

      keywordsStreamer.addEventListener("data", handleData as EventListener);
      keywordsStreamer.addEventListener("error", handleError as EventListener);
      keywordsStreamer.addEventListener(
        "complete",
        handleComplete as EventListener,
      );
      keywordsStreamer.startStreaming(params);

      return () => {
        keywordsStreamer.removeEventListener(
          "data",
          handleData as EventListener,
        );
        keywordsStreamer.removeEventListener(
          "error",
          handleError as EventListener,
        );
        keywordsStreamer.removeEventListener(
          "complete",
          handleComplete as EventListener,
        );
        keywordsStreamer.stopStreaming();
      };
    },
    { onLoadingSlow: () => setIsLoadingSlow(true) },
  );

  const {
    data: totalRows,
    isLoading: isTotalRowsLoadingQuery,
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
  const isTotalRowsLoading = isTotalRowsLoadingQuery || isDebouncing;

  const isLoading =
    keywordsStreamer.isStreaming() || !hasReceivedData || isDebouncing;
  const displayData: KeywordRow[] = useMemo(() => {
    if (isDebouncing) {
      return Array(pageSize)
        .fill(null)
        .map(() => ({ showSkeleton: true }));
    }

    const startIndex = (pageIndex % pageSize) * pageSize;
    const endIndex = startIndex + pageSize;
    const realData = keywords.slice(startIndex, endIndex);

    const remainingSlots = pageSize - realData.length;
    if (remainingSlots <= 0) {
      return realData;
    }

    const placeholders: KeywordRow[] = Array(remainingSlots)
      .fill(null)
      .map(() => ({ showSkeleton: isLoading }));

    return [...realData, ...placeholders];
  }, [keywords, pageIndex, pageSize, isLoading, isDebouncing]);

  const table = useReactTable({
    data: displayData,
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
    pageCount: totalRows ? Math.ceil(totalRows / pageSize) : -1,
  });

  return {
    table,
    isLoading,
    isLoadingSlow,
    error,
    totalRows,
    isTotalRowsLoading,
    totalRowsError,
    pageIndex,
    pageSize,
  };
}
