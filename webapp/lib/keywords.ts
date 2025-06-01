"use server";

import type { Keyword } from "@/lib/types";
import { createClient } from "@clickhouse/client";
import { BigQuery } from "@google-cloud/bigquery";
import type { SortingState } from "@tanstack/react-table";
import { unstable_cache } from "next/cache";

const bigquery = new BigQuery();
const clickhouse = createClient({
  url: process.env.CLICKHOUSE_URL,
  username: process.env.CLICKHOUSE_USERNAME,
  password: process.env.CLICKHOUSE_PASSWORD,
});

interface KeywordFilters {
  keyword?: string;
  minMonthlySearches?: number;
  maxMonthlySearches?: number;
  minCompetitionIndex?: number;
  maxCompetitionIndex?: number;
  minCpcHigh?: number;
  maxCpcHigh?: number;
}

interface PaginatedKeywords {
  keywords: Keyword[];
  totalRows: number;
  totalPages: number;
  currentPage: number;
}

interface Row extends Keyword {
  total_count?: number;
}

async function pingClickhouse(): Promise<boolean> {
  try {
    const pingPromise = clickhouse.ping();
    const timeoutPromise = new Promise<{ success: boolean }>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 500),
    );

    const ping = await Promise.race([pingPromise, timeoutPromise]);
    console.log("Ping ClickHouse:", ping);
    return ping.success;
  } catch {
    console.log("Ping Clickhouse:", { success: false });
    return false;
  }
}

export async function getKeywords(
  filters?: KeywordFilters,
  sort?: SortingState,
  page = 1,
  pageSize = 10,
): Promise<PaginatedKeywords> {
  return unstable_cache(
    getKeywordsNotCached,
    [
      `keywords-${JSON.stringify(filters)}-${JSON.stringify(sort)}-${page}-${pageSize}`,
    ],
    { revalidate: 24 * 3600 },
  )(filters, sort, page, pageSize);
}

async function getKeywordsNotCached(
  filters?: KeywordFilters,
  sort?: SortingState,
  page = 1,
  pageSize = 10,
): Promise<PaginatedKeywords> {
  const isClickhouseUp = await pingClickhouse();
  const selectedDb = isClickhouseUp ? "clickhouse" : "bigquery";

  console.log(`Getting keywords from ${selectedDb}`);
  let whereClause = "WHERE 1=1";
  let params: Record<string, string | number> = {};

  if (filters?.keyword) {
    whereClause +=
      selectedDb === "clickhouse"
        ? " AND kws.keyword LIKE {keyword_filter:String}"
        : " AND SEARCH(kws.keyword, @keyword_filter)";
    params = {
      ...params,
      keyword_filter: `%${filters.keyword.toLowerCase()}%`,
    };
  }
  if (filters?.minMonthlySearches !== undefined) {
    whereClause +=
      selectedDb === "clickhouse"
        ? " AND kws.avg_monthly_searches >= {min_searches:Int32}"
        : " AND kws.avg_monthly_searches >= @min_searches";
    params = { ...params, min_searches: filters.minMonthlySearches };
  }
  if (filters?.maxMonthlySearches !== undefined) {
    whereClause +=
      selectedDb === "clickhouse"
        ? " AND kws.avg_monthly_searches <= {max_searches:Int32}"
        : " AND kws.avg_monthly_searches <= @max_searches";
    params = { ...params, max_searches: filters.maxMonthlySearches };
  }
  if (filters?.minCompetitionIndex !== undefined) {
    whereClause +=
      selectedDb === "clickhouse"
        ? " AND kws.competition_index >= {min_competition:Float32}"
        : " AND kws.competition_index >= @min_competition";
    params = { ...params, min_competition: filters.minCompetitionIndex };
  }
  if (filters?.maxCompetitionIndex !== undefined) {
    whereClause +=
      selectedDb === "clickhouse"
        ? " AND kws.competition_index <= {max_competition:Float32}"
        : " AND kws.competition_index <= @max_competition";
    params = { ...params, max_competition: filters.maxCompetitionIndex };
  }
  if (filters?.minCpcHigh !== undefined) {
    whereClause +=
      selectedDb === "clickhouse"
        ? " AND kws.cpc_high >= {min_cpc:Float32}"
        : " AND kws.cpc_high >= @min_cpc";
    params = { ...params, min_cpc: filters.minCpcHigh };
  }
  if (filters?.maxCpcHigh !== undefined) {
    whereClause +=
      selectedDb === "clickhouse"
        ? " AND kws.cpc_high <= {max_cpc:Float32}"
        : " AND kws.cpc_high <= @max_cpc";
    params = { ...params, max_cpc: filters.maxCpcHigh };
  }

  let orderByClause = "";
  if (sort) {
    const sortClauses = sort.map(
      (s) => `kws.${s.id} ${s.desc ? "DESC" : "ASC"}`,
    );
    orderByClause = `ORDER BY ${sortClauses.join(", ")}`;
  }

  const offset = (page - 1) * pageSize;
  const query = `
    WITH data_cte AS (
      SELECT
        kws.keyword,
        kws.avg_monthly_searches,
        kws.competition_index,
        kws.cpc_high,
        kws.updated_at,
        ${selectedDb === "clickhouse" ? "NULL as total_count" : "cast(NULL as integer) as total_count"}
      FROM ${selectedDb === "clickhouse" ? "keywords" : "`keywordsdb-3.keywords.keywords`"} kws
      ${whereClause}
      ${orderByClause}
      ${selectedDb === "clickhouse" ? "LIMIT {page_size:UInt32} OFFSET {offset:UInt32}" : "LIMIT @page_size OFFSET @offset"}
    ),
    count_cte AS (
      SELECT
        ${selectedDb === "clickhouse" ? "NULL" : "cast(NULL as string)"} as keyword,
        ${selectedDb === "clickhouse" ? "NULL" : "cast(NULL as integer)"} as avg_monthly_searches,
        ${selectedDb === "clickhouse" ? "NULL" : "cast(NULL as integer)"} as competition_index,
        ${selectedDb === "clickhouse" ? "NULL" : "cast(NULL as float64)"} as cpc_high,
        ${selectedDb === "clickhouse" ? "NULL" : "cast(NULL as date)"} as updated_at,
        COUNT(*) as total_count
      FROM ${selectedDb === "clickhouse" ? "keywords" : "`keywordsdb-3.keywords.keywords`"} kws
      ${whereClause}
    )
    SELECT * FROM data_cte
    UNION ALL
    SELECT * FROM count_cte
  `;

  params = { ...params, page_size: pageSize, offset };

  let data: Row[];
  if (selectedDb === "clickhouse") {
    const rows = await clickhouse.query({
      query,
      query_params: params,
      format: "JSONEachRow",
    });
    data = (await rows.json()) as Row[];
  } else {
    const [rows] = await bigquery.query({ query, params });
    data = rows.map(row => ({
      ...row,
      updated_at: row.updated_at?.value || row.updated_at
    })) as Row[];
  }

  // Separate data rows from count row
  const dataRows = data.filter((row) => row.total_count == null);
  const countRow = data.find((row) => row.total_count != null);
  const totalRows = countRow?.total_count || 0;
  const totalPages = Math.ceil(totalRows / pageSize);

  console.log("Query executed successfully");
  return {
    keywords: dataRows.map((row) => ({
      keyword: row.keyword,
      avg_monthly_searches: row.avg_monthly_searches,
      competition_index: row.competition_index,
      cpc_high: row.cpc_high,
      updated_at: row.updated_at,
    })) as Keyword[],
    totalRows,
    totalPages,
    currentPage: page,
  };
}
