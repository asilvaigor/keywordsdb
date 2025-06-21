import type { PaginationState } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";

export const API_PAGE_SIZE = 100;

export function usePagination(defaultPageSize: number) {
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  const resetPagination = useCallback(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const apiPageIndex = useMemo(
    () => Math.floor((pageIndex * pageSize) / API_PAGE_SIZE),
    [pageIndex, pageSize],
  );

  return { pageIndex, pageSize, setPagination, resetPagination, apiPageIndex };
}

export function calcPageCount(
  totalRows: number | undefined,
  pageSize: number,
): number {
  return totalRows ? Math.ceil(totalRows / pageSize) : -1;
}

export function calcDataSlice(pageIndex: number, pageSize: number) {
  const start = (pageIndex % pageSize) * pageSize;
  const end = start + pageSize;
  return { start, end };
}
