"use server";

import { createHash } from "node:crypto";
import clickhouse from "@/lib/clickhouse";
import firestore from "@/lib/firestore";
import type {
  CacheMiss,
  ClickhouseProgress,
  Keyword,
  KeywordsStreamResponse,
  Progress,
} from "@/lib/types";
import type { KeywordFilters } from "@/lib/types";
import type { SortingState } from "@tanstack/react-table";
import { unstable_cache } from "next/cache";

interface KeywordsCached {
  results: Keyword[];
  expires_at: Date;
}

interface KeywordCountsCached {
  count: number;
  expires_at: Date;
}

export async function* getKeywordsStream(
  filters?: KeywordFilters,
  sort?: SortingState,
  page = 1,
  pageSize = 100,
): AsyncGenerator<KeywordsStreamResponse, void, unknown> {
  const cacheKey = `keywords-${JSON.stringify(filters)}-${JSON.stringify(sort)}-${page}-${pageSize}`;
  const hash = createHash("sha256").update(cacheKey, "utf8").digest("hex");
  const docRef = firestore.collection("keywords-cache").doc(hash);
  const doc = (await docRef.get()).data() as KeywordsCached | undefined;

  if (doc) {
    console.log("Returning keywords from firestore cache");
    yield doc.results;
    return;
  }

  const cacheMiss: CacheMiss = { isCacheMiss: true };
  yield cacheMiss;

  console.log("Streaming keywords from clickhouse");
  const { whereClause, params } = buildWhereClause(filters);

  let orderByClause = "";
  if (sort) {
    const sortClauses = sort.map(
      (s) => `kws.${s.id} ${s.desc ? "DESC" : "ASC"}`,
    );
    orderByClause = `ORDER BY ${sortClauses.join(", ")}`;
  }

  const query = `
    SELECT
      kws.keyword,
      kws.avg_monthly_searches,
      kws.competition_index,
      kws.cpc_high,
      kws.updated_at
    FROM keywords kws
    ${whereClause}
    ${orderByClause}
    LIMIT {pageSize:UInt32} OFFSET {offset:UInt32}
  `;

  const offset = (page - 1) * pageSize;

  const resultSet = await clickhouse.query({
    query,
    query_params: { ...params, pageSize, offset },
    format: "JSONEachRowWithProgress",
  });

  const allResults: Keyword[] = [];
  let lastProgressTime = Date.now();

  for await (const chunk of resultSet.stream()) {
    const results: Keyword[] = [];
    for (const row of chunk) {
      const chunkData = row.json() as Record<string, unknown>;
      if (chunkData.progress) {
        if (Date.now() - lastProgressTime > 100) {
          const clickhouseProgress = chunkData.progress as ClickhouseProgress;
          const progress: Progress = {
            isProgress: true,
            percent:
              clickhouseProgress.read_rows /
              clickhouseProgress.total_rows_to_read,
          };
          yield progress;
          lastProgressTime = Date.now();
        }
      } else {
        results.push(chunkData.row as Keyword);
        allResults.push(chunkData.row as Keyword);
      }
    }
    yield results;
  }

  // Cache the results in Firestore asynchronously
  const cacheData: KeywordsCached = {
    results: allResults,
    expires_at: new Date(Date.now() + 24 * 3600 * 1000),
  };
  docRef.set(cacheData).catch(console.error);

  console.log("Streaming query completed successfully");
}

export async function getKeywordsCount(
  filters?: KeywordFilters,
): Promise<number> {
  const cacheKey = `keyword-counts-${JSON.stringify(filters)}`;
  const count = await unstable_cache(getKeywordsCountNotCached, [cacheKey], {
    revalidate: 24 * 3600,
  })(cacheKey, filters);
  return count;
}

async function getKeywordsCountNotCached(
  cacheKey: string,
  filters?: KeywordFilters,
): Promise<number> {
  const hash = createHash("sha256").update(cacheKey, "utf8").digest("hex");
  const docRef = firestore.collection("keyword-counts-cache").doc(hash);
  const doc = (await docRef.get()).data() as KeywordCountsCached | undefined;
  if (doc) {
    console.log("Returning keyword count from firestore");
    return doc.count;
  }

  console.log("Getting keyword count from clickhouse");
  const { whereClause, params } = buildWhereClause(filters);
  const query = `
    SELECT COUNT(*) as count
    FROM keywords kws
    ${whereClause}
  `;
  const rows = await clickhouse.query({
    query,
    query_params: params,
    format: "JSONEachRow",
  });
  const result = (await rows.json()) as { count: number }[];
  result[0].count = Number(result[0].count);

  // Cache the result in Firestore asynchronously
  const cacheData: KeywordCountsCached = {
    count: result[0].count,
    expires_at: new Date(Date.now() + 24 * 3600 * 1000),
  };
  docRef.set(cacheData).catch(console.error);

  console.log("Keyword count query executed successfully");
  return result[0].count;
}

function buildWhereClause(filters?: KeywordFilters): {
  whereClause: string;
  params: Record<string, string | number>;
} {
  let whereClause = "WHERE 1=1";
  let params: Record<string, string | number> = {};

  if (filters?.keyword) {
    whereClause += " AND kws.keyword LIKE {keyword_filter:String}";
    params = {
      ...params,
      keyword_filter: `%${filters.keyword.toLowerCase()}%`,
    };
  }
  if (filters?.avg_monthly_searches?.min !== undefined) {
    whereClause += " AND kws.avg_monthly_searches >= {min_searches:Int32}";
    params = { ...params, min_searches: filters?.avg_monthly_searches?.min };
  }
  if (filters?.avg_monthly_searches?.max !== undefined) {
    whereClause += " AND kws.avg_monthly_searches <= {max_searches:Int32}";
    params = { ...params, max_searches: filters?.avg_monthly_searches?.max };
  }
  if (filters?.competition_index?.min !== undefined) {
    whereClause += " AND kws.competition_index >= {min_competition:Float32}";
    params = { ...params, min_competition: filters?.competition_index?.min };
  }
  if (filters?.competition_index?.max !== undefined) {
    whereClause += " AND kws.competition_index <= {max_competition:Float32}";
    params = { ...params, max_competition: filters?.competition_index?.max };
  }
  if (filters?.cpc_high?.min !== undefined) {
    whereClause += " AND kws.cpc_high >= {min_cpc:Float32}";
    params = { ...params, min_cpc: filters?.cpc_high?.min };
  }
  if (filters?.cpc_high?.max !== undefined) {
    whereClause += " AND kws.cpc_high <= {max_cpc:Float32}";
    params = { ...params, max_cpc: filters?.cpc_high?.max };
  }
  return { whereClause, params };
}
