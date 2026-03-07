import type { SortingState } from "@tanstack/react-table";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { KeywordFilters } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getInt(value: string | null): number | undefined {
  return value ? Number.parseInt(value, 10) : undefined;
}

export function parseSearchParams(searchParams: URLSearchParams) {
  const filters = {
    keyword: searchParams.get("keyword") || undefined,
    volume_estimated_google:
      JSON.parse(searchParams.get("volume_estimated_google") || "null") ??
      undefined,
    volume_google:
      JSON.parse(searchParams.get("volume_google") || "null") ?? undefined,
    volume_bing:
      JSON.parse(searchParams.get("volume_bing") || "null") ?? undefined,
    competition_index:
      JSON.parse(searchParams.get("competition_index") || "null") ?? undefined,
    cpc_high: JSON.parse(searchParams.get("cpc_high") || "null") ?? undefined,
    is_adult:
      searchParams.get("is_adult") === "true"
        ? true
        : searchParams.get("is_adult") === "false"
          ? false
          : undefined,
  };
  const sortParams = searchParams.getAll("sortBy");
  const sorting: SortingState = sortParams.map((param) => {
    const isDescending = param.startsWith("-");
    const columnId = param.slice(1);
    return {
      id: columnId,
      desc: isDescending,
    };
  });
  const columns = searchParams.getAll("columns");
  const page = getInt(searchParams.get("page"));
  const pageSize = getInt(searchParams.get("pageSize"));
  const isSample = searchParams.get("isSample") === "true";

  return { filters, sorting, columns, page, pageSize, isSample };
}

export function buildSearchParams({
  filters,
  sorting,
  columns,
  page,
  pageSize,
  isSample,
}: {
  filters?: KeywordFilters;
  sorting?: SortingState;
  columns?: string[];
  page?: number;
  pageSize?: number;
  isSample?: boolean;
}) {
  const urlParams = new URLSearchParams();
  if (page) {
    urlParams.append("page", page.toString());
  }
  if (pageSize) {
    urlParams.append("pageSize", pageSize.toString());
  }
  if (isSample !== undefined) {
    urlParams.append("isSample", isSample.toString());
  }
  if (filters?.volume_estimated_google) {
    urlParams.append(
      "volume_estimated_google",
      JSON.stringify(filters.volume_estimated_google),
    );
  }
  if (filters?.volume_google) {
    urlParams.append("volume_google", JSON.stringify(filters.volume_google));
  }
  if (filters?.volume_bing) {
    urlParams.append("volume_bing", JSON.stringify(filters.volume_bing));
  }
  if (filters?.competition_index) {
    urlParams.append(
      "competition_index",
      JSON.stringify(filters.competition_index),
    );
  }
  if (filters?.cpc_high) {
    urlParams.append("cpc_high", JSON.stringify(filters.cpc_high));
  }
  if (filters?.keyword) {
    urlParams.append("keyword", filters.keyword);
  }
  if (filters?.is_adult != null) {
    urlParams.append("is_adult", filters.is_adult.toString());
  }
  if (sorting && sorting.length > 0) {
    for (const sort of sorting) {
      urlParams.append("sortBy", `${sort.desc ? "-" : "+"}${sort.id}`);
    }
  }
  if (columns && columns.length > 0) {
    for (const column of columns) {
      urlParams.append("columns", column);
    }
  }
  return urlParams;
}
