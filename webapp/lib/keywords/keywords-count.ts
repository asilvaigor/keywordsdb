import clickhouse from "@/lib/db/clickhouse";
import { getDuckDBConnection } from "@/lib/db/storage";
import type { KeywordFilters } from "@/lib/types";
import { buildWhereClause, createDuckDBCacheIfNeeded } from "./utils";

export async function getKeywordsCountSample(
  filters?: KeywordFilters,
): Promise<number> {
  const connection = await getDuckDBConnection();
  await createDuckDBCacheIfNeeded(connection);
  const { whereClause, params } = buildWhereClause("duckdb", filters);
  const result = await connection.runAndReadAll(
    `SELECT COUNT(*) FROM keywords_sample kws ${whereClause}`,
    params,
  );
  const count = result.getRows()[0][0];
  return Number(count);
}

export async function getKeywordsCountClickhouse(
  filters?: KeywordFilters,
): Promise<number> {
  const { whereClause, params } = buildWhereClause("clickhouse", filters);
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
  return result[0].count;
}
