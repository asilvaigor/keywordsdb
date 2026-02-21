import type { SortingState } from "@tanstack/react-table";
import clickhouse from "@/lib/db/clickhouse";
import type {
  ClickhouseProgress,
  Keyword,
  KeywordFilters,
  KeywordsStreamResponse,
  Progress,
} from "@/lib/types";
import { getDuckDBConnection } from "../db/storage";
import {
  buildOrderByClause,
  buildWhereClause,
  createDuckDBCacheIfNeeded,
} from "./utils";

export async function getKeywordsStreamSample(
  filters: KeywordFilters,
  sorting: SortingState,
  page = 1,
  pageSize = 100,
): Promise<Keyword[]> {
  const connection = await getDuckDBConnection();
  await createDuckDBCacheIfNeeded(connection);

  const { whereClause, params } = buildWhereClause("duckdb", filters);
  const orderByClause = buildOrderByClause(sorting);
  const offset = (page - 1) * pageSize;

  const result = await connection.runAndReadAll(
    `SELECT
      keyword,
      avg_monthly_searches,
      competition_index,
      cpc_high,
      volume_history,
      updated_at
    FROM keywords_sample kws
    ${whereClause}
    ${orderByClause}
    LIMIT $pageSize OFFSET $offset`,
    { ...params, pageSize, offset },
  );
  const rows = result.getRows();
  const sample = rows.map(
    (row) =>
      ({
        keyword: row[0],
        avg_monthly_searches: Number(row[1]),
        competition_index: row[2],
        cpc_high: row[3],
        volume_history: row[4],
        updated_at: row[5]?.toString(),
      }) as Keyword,
  );
  return sample;
}

export async function* getKeywordsStreamClickhouse(
  filters: KeywordFilters,
  sorting: SortingState,
  page = 1,
  pageSize = 100,
): AsyncGenerator<KeywordsStreamResponse, Keyword[], unknown> {
  const { whereClause, params } = buildWhereClause("clickhouse", filters);
  const orderByClause = buildOrderByClause(sorting);

  const query = `
    SELECT
      kws.keyword,
      kws.avg_monthly_searches,
      kws.competition_index,
      kws.cpc_high,
      kws.volume_history,
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
  let lastProgressReadRows = 0;
  let firstProgressTime: number | null = null;

  for await (const chunk of resultSet.stream()) {
    const results: Keyword[] = [];
    for (const row of chunk) {
      const chunkData = row.json() as Record<string, unknown>;
      if (chunkData.progress) {
        if (Date.now() - lastProgressTime > 100) {
          const clickhouseProgress = chunkData.progress as ClickhouseProgress;
          if (clickhouseProgress.read_rows > lastProgressReadRows) {
            const progress: Progress = {
              isProgress: true,
              percent:
                clickhouseProgress.read_rows /
                clickhouseProgress.total_rows_to_read,
            };
            if (firstProgressTime === null) {
              // Very often the first updates give an innacurate total_rows_to_read, which makes the progress percentage jump around
              firstProgressTime = Date.now();
            } else {
              yield progress;
            }
            lastProgressReadRows = clickhouseProgress.read_rows;
            lastProgressTime = Date.now();
          }
        }
      } else if (chunkData.row) {
        results.push(chunkData.row as Keyword);
        allResults.push(chunkData.row as Keyword);
      }
    }
    yield results;
  }

  return allResults;
}
