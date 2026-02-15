import type { SortingState } from "@tanstack/react-table";
import clickhouse from "@/lib/clickhouse";
import type {
  ClickhouseProgress,
  Keyword,
  KeywordFilters,
  KeywordsStreamResponse,
  Progress,
} from "@/lib/types";
import { getDuckDBConnection } from "../storage";
import { buildWhereClause, createDuckDBCacheIfNeeded } from "./utils";

export async function getKeywordsStreamSample(
  filters?: KeywordFilters,
  sort?: SortingState,
  page = 1,
  pageSize = 100,
): Promise<Keyword[]> {
  const connection = await getDuckDBConnection();
  await createDuckDBCacheIfNeeded(connection);

  const { whereClause, params } = buildWhereClause("duckdb", filters);
  const orderByClause = buildOrderByClause(sort);
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
  filters?: KeywordFilters,
  sort?: SortingState,
  page = 1,
  pageSize = 100,
): AsyncGenerator<KeywordsStreamResponse, Keyword[], unknown> {
  const { whereClause, params } = buildWhereClause("clickhouse", filters);
  const orderByClause = buildOrderByClause(sort);

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

  return allResults;
}

function buildOrderByClause(sort?: SortingState) {
  if (!sort || sort.length === 0) return "";
  const sortClauses = sort.map((s) => `kws.${s.id} ${s.desc ? "DESC" : "ASC"}`);
  return `ORDER BY ${sortClauses.join(", ")}`;
}
