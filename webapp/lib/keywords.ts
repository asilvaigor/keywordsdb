"use server";

import { createHash } from "node:crypto";
import clickhouse from "@/lib/clickhouse";
import firestore from "@/lib/firestore";
import type { Keyword } from "@/lib/types";
import type { SortingState } from "@tanstack/react-table";
import { unstable_cache } from "next/cache";

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

interface KeywordsCached {
  results: Keyword[];
  count: number;
  expiresAt: Date;
}

interface Row extends Keyword {
  total_count?: number;
}

export async function getKeywords(
  filters?: KeywordFilters,
  sort?: SortingState,
  page = 1,
  pageSize = 10,
): Promise<PaginatedKeywords> {
  const dbPageSize = 100;
  const dbPage = Math.floor(((page - 1) * pageSize) / dbPageSize) + 1;
  const skipRows = ((page - 1) * pageSize) % dbPageSize;

  const cacheKey = `keywords-${JSON.stringify(filters)}-${JSON.stringify(sort)}-${dbPage}-${dbPageSize}`;
  const keywords = await unstable_cache(getKeywordsNotCached, [cacheKey], {
    revalidate: 24 * 3600,
  })(cacheKey, filters, sort, dbPage, dbPageSize);

  return {
    keywords: keywords.keywords.slice(skipRows, skipRows + pageSize),
    totalRows: keywords.totalRows,
    totalPages: keywords.totalPages * Math.ceil(pageSize / dbPageSize),
    currentPage: page,
  };
}

async function getKeywordsNotCached(
  cacheKey: string,
  filters?: KeywordFilters,
  sort?: SortingState,
  page = 1,
  pageSize = 10,
): Promise<PaginatedKeywords> {
  const hash = createHash("sha256").update(cacheKey, "utf8").digest("hex");
  const docRef = firestore.collection("keywords-cache").doc(hash);
  const doc = (await docRef.get()).data() as KeywordsCached | undefined;
  if (doc) {
    console.log("Returning keywords from firestore");
    return {
      keywords: doc.results,
      totalRows: doc.count,
      totalPages: Math.ceil(doc.count / pageSize),
      currentPage: page,
    };
  }

  console.log("Getting keywords from clickhouse");
  let whereClause = "WHERE 1=1";
  let params: Record<string, string | number> = {};

  if (filters?.keyword) {
    whereClause += " AND kws.keyword LIKE {keyword_filter:String}";
    params = {
      ...params,
      keyword_filter: `%${filters.keyword.toLowerCase()}%`,
    };
  }
  if (filters?.minMonthlySearches !== undefined) {
    whereClause += " AND kws.avg_monthly_searches >= {min_searches:Int32}";
    params = { ...params, min_searches: filters.minMonthlySearches };
  }
  if (filters?.maxMonthlySearches !== undefined) {
    whereClause += " AND kws.avg_monthly_searches <= {max_searches:Int32}";
    params = { ...params, max_searches: filters.maxMonthlySearches };
  }
  if (filters?.minCompetitionIndex !== undefined) {
    whereClause += " AND kws.competition_index >= {min_competition:Float32}";
    params = { ...params, min_competition: filters.minCompetitionIndex };
  }
  if (filters?.maxCompetitionIndex !== undefined) {
    whereClause += " AND kws.competition_index <= {max_competition:Float32}";
    params = { ...params, max_competition: filters.maxCompetitionIndex };
  }
  if (filters?.minCpcHigh !== undefined) {
    whereClause += " AND kws.cpc_high >= {min_cpc:Float32}";
    params = { ...params, min_cpc: filters.minCpcHigh };
  }
  if (filters?.maxCpcHigh !== undefined) {
    whereClause += " AND kws.cpc_high <= {max_cpc:Float32}";
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
        NULL as total_count
      FROM keywords kws
      ${whereClause}
      ${orderByClause}
      LIMIT {page_size:UInt32} OFFSET {offset:UInt32}
    ),
    count_cte AS (
      SELECT
        NULL as keyword,
        NULL as avg_monthly_searches,
        NULL as competition_index,
        NULL as cpc_high,
        NULL  as updated_at,
        COUNT(*) as total_count
      FROM keywords kws
      ${whereClause}
    )
    SELECT * FROM data_cte
    UNION ALL
    SELECT * FROM count_cte
  `;

  params = { ...params, page_size: pageSize, offset };
  const rows = await clickhouse.query({
    query,
    query_params: params,
    format: "JSONEachRow",
  });
  const data = (await rows.json()) as Row[];

  // Separate data rows from count row
  const dataRows = data.filter((row) => row.total_count == null);
  const countRow = data.find((row) => row.total_count != null);
  const totalRows = countRow?.total_count || 0;
  const totalPages = Math.ceil(totalRows / pageSize);

  const result = {
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

  // Cache the results in Firestore asynchronously
  const cacheData: KeywordsCached = {
    results: result.keywords,
    count: totalRows,
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
  };
  docRef.set(cacheData).catch(console.error);

  console.log("Query executed successfully");
  return result;
}
