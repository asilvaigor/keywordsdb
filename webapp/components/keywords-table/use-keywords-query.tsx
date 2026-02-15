import type { SortingState } from "@tanstack/react-table";
import { useMemo, useRef, useState } from "react";
import useSWRSubscription from "swr/subscription";
import type {
  CacheMiss,
  Keyword,
  KeywordFilters,
  KeywordRow,
  KeywordsStreamResponse,
} from "@/lib/types";
import { API_PAGE_SIZE, calcDataSlice } from "./use-pagination";

class KeywordsStreamer extends EventTarget {
  private eventSource: EventSource | null = null;

  startStreaming(params: {
    page: number;
    filters: KeywordFilters;
    sorting: SortingState;
    isSample: boolean;
  }) {
    this.stopStreaming();

    const urlParams = new URLSearchParams();
    urlParams.append("page", (params.page + 1).toString());
    urlParams.append("pageSize", API_PAGE_SIZE.toString());
    urlParams.append("isSample", params.isSample.toString());
    if (params.filters.avg_monthly_searches) {
      urlParams.append(
        "avg_monthly_searches",
        JSON.stringify(params.filters.avg_monthly_searches),
      );
    }
    if (params.filters.competition_index) {
      urlParams.append(
        "competition_index",
        JSON.stringify(params.filters.competition_index),
      );
    }
    if (params.filters.cpc_high) {
      urlParams.append("cpc_high", JSON.stringify(params.filters.cpc_high));
    }
    if (params.filters.keyword) {
      urlParams.append("keyword", params.filters.keyword);
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
        const res = JSON.parse(event.data) as Keyword[] | CacheMiss;
        this.dispatchEvent(new CustomEvent("data", { detail: res }));
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

export function useKeywordsQuery({
  sorting,
  filters,
  apiPageIndex,
  pageIndex,
  pageSize,
  isFiltersDebouncing,
  isSample,
}: {
  sorting: SortingState;
  filters: KeywordFilters;
  apiPageIndex: number;
  pageIndex: number;
  pageSize: number;
  isFiltersDebouncing: boolean;
  isSample: boolean;
}) {
  const [hasReceivedData, setHasReceivedData] = useState(false);
  const [isCacheMiss, setIsCacheMiss] = useState(false);
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const completedKeysRef = useRef<Set<string>>(new Set());

  const streamKey = useMemo(() => {
    const key = JSON.stringify({
      page: apiPageIndex,
      filters: filters,
      sorting,
      isSample,
    });
    return key;
  }, [apiPageIndex, filters, sorting, isSample]);

  const { data: keywords = [], error } = useSWRSubscription(
    streamKey,
    (key, { next }) => {
      // If this key was already fully streamed, don't re-stream.
      if (completedKeysRef.current.has(key)) {
        setHasReceivedData(true);
        return () => {};
      }

      const params = JSON.parse(key);
      let accumulatedKeywords: Keyword[] = [];

      const handleData = (event: CustomEvent) => {
        const res = event.detail as KeywordsStreamResponse;
        if ("isCacheMiss" in res) {
          setIsCacheMiss(true);
          return;
        }
        if ("isProgress" in res) {
          setProgress(res.percent);
          return;
        }
        accumulatedKeywords = [...accumulatedKeywords, ...res];
        setHasReceivedData(true);
        next(null, accumulatedKeywords);
      };

      const handleError = (event: CustomEvent) => {
        const error = event.detail as Error;
        setHasReceivedData(true);
        setProgress(undefined);
        next(error);
      };

      const handleComplete = () => {
        setHasReceivedData(true);
        setProgress(undefined);
        completedKeysRef.current.add(key);
        keywordsStreamer.stopStreaming();
      };

      setHasReceivedData(false);
      setProgress(undefined);
      setIsCacheMiss(false);
      keywordsStreamer.stopStreaming();
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
  );

  const isStreaming = keywordsStreamer.isStreaming();
  const isLoading = isStreaming || !hasReceivedData || isFiltersDebouncing;
  const displayData: KeywordRow[] = useMemo(() => {
    if (isFiltersDebouncing) {
      return Array(pageSize)
        .fill(null)
        .map(() => ({ showSkeleton: true }));
    }

    const { start: startIndex, end: endIndex } = calcDataSlice(
      pageIndex,
      pageSize,
    );
    const realData = keywords.slice(startIndex, endIndex);

    const remainingSlots = pageSize - realData.length;
    if (remainingSlots <= 0) {
      return realData;
    }

    const placeholders: KeywordRow[] = Array(remainingSlots)
      .fill(null)
      .map(() => ({ showSkeleton: isLoading }));

    return [...realData, ...placeholders];
  }, [keywords, pageIndex, pageSize, isLoading, isFiltersDebouncing]);

  return {
    progress,
    isLoading,
    error,
    keywords: displayData,
    isCacheMiss,
  };
}
