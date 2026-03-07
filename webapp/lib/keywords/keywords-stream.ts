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
  buildSelectClause,
  buildWhereClause,
  createDuckDBCacheIfNeeded,
} from "./utils";

export async function getKeywordsStreamSample({
  filters,
  sorting,
  columns,
  page = 1,
  pageSize = 100,
}: {
  filters: KeywordFilters;
  sorting: SortingState;
  columns: string[];
  page: number;
  pageSize: number;
}): Promise<Keyword[]> {
  const connection = await getDuckDBConnection();
  await createDuckDBCacheIfNeeded(connection);

  const { whereClause, params } = buildWhereClause("duckdb", filters);
  const selectClause = buildSelectClause(columns);
  const orderByClause = buildOrderByClause(sorting);
  const offset = (page - 1) * pageSize;

  const result = await connection.runAndReadAll(
    `SELECT ${selectClause}
    FROM keywords_sample kws
    ${whereClause}
    ${orderByClause}
    LIMIT $pageSize OFFSET $offset`,
    { ...params, pageSize, offset },
  );
  const rows = result.getRows();
  const colIndices = columns.reduce(
    (acc, col, index) => {
      acc[col] = index + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const sample = rows.map(
    (row) =>
      ({
        keyword: row[0],
        volume_estimated_google: colIndices.volume_estimated_google
          ? Number(row[colIndices.volume_estimated_google])
          : undefined,
        volume_google: colIndices.volume_google
          ? Number(row[colIndices.volume_google])
          : undefined,
        volume_bing: colIndices.volume_bing
          ? Number(row[colIndices.volume_bing])
          : undefined,
        competition_index: colIndices.competition_index
          ? Number(row[colIndices.competition_index])
          : undefined,
        cpc_high: colIndices.cpc_high
          ? Number(row[colIndices.cpc_high])
          : undefined,
        volume_history_google: colIndices.volume_history_google
          ? row[colIndices.volume_history_google]
          : undefined,
        is_adult: colIndices.is_adult
          ? Boolean(row[colIndices.is_adult])
          : undefined,
        updated_at: colIndices.updated_at
          ? row[colIndices.updated_at]?.toString()
          : undefined,
      }) as Keyword,
  );
  return sample;
}

export async function* getKeywordsStreamClickhouse({
  filters,
  sorting,
  columns,
  page = 1,
  pageSize = 100,
}: {
  filters: KeywordFilters;
  sorting: SortingState;
  columns: string[];
  page: number;
  pageSize: number;
}): AsyncGenerator<KeywordsStreamResponse, Keyword[], unknown> {
  const { whereClause, params } = buildWhereClause("clickhouse", filters);
  const selectClause = buildSelectClause(columns);
  const orderByClause = buildOrderByClause(sorting);

  const query = `
    SELECT ${selectClause}
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
