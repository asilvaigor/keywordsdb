import type { DuckDBConnection } from "@duckdb/node-api";
import { BUCKET_NAME } from "@/lib/storage";
import type { KeywordFilters } from "@/lib/types";

export async function createDuckDBCacheIfNeeded(connection: DuckDBConnection) {
  const res = await connection.runAndReadAll("SHOW TABLES");
  const tableExists = res.getRows().some((row) => row[0] === "keywords_sample");
  if (!tableExists) {
    console.log("Downloading keywords sample parquet file");
    await connection.run(`
      CREATE TABLE IF NOT EXISTS keywords_sample AS
      SELECT
        keyword,
        avg_monthly_searches,
        competition_index,
        cpc_high,
        volume_history,
        updated_at
      FROM parquet_scan('gs://${BUCKET_NAME}/keywords-sample/sample.parquet')
    `);
  }
}

export function buildWhereClause(
  mode: "duckdb" | "clickhouse",
  filters?: KeywordFilters,
): {
  whereClause: string;
  params: Record<string, string | number>;
} {
  let whereClause = "WHERE 1=1";
  let params: Record<string, string | number> = {};

  if (filters?.keyword) {
    whereClause += ` AND kws.keyword LIKE ${mode === "clickhouse" ? "{keyword_filter:String}" : "$keyword_filter"}`;
    params = {
      ...params,
      keyword_filter: `%${filters.keyword.toLowerCase()}%`,
    };
  }
  if (filters?.avg_monthly_searches?.min !== undefined) {
    whereClause += ` AND kws.avg_monthly_searches >= ${mode === "clickhouse" ? "{min_searches:Int32}" : "$min_searches"}`;
    params = { ...params, min_searches: filters?.avg_monthly_searches?.min };
  }
  if (filters?.avg_monthly_searches?.max !== undefined) {
    whereClause += ` AND kws.avg_monthly_searches <= ${mode === "clickhouse" ? "{max_searches:Int32}" : "$max_searches"}`;
    params = { ...params, max_searches: filters?.avg_monthly_searches?.max };
  }
  if (filters?.competition_index?.min !== undefined) {
    whereClause += ` AND kws.competition_index >= ${mode === "clickhouse" ? "{min_competition:Float32}" : "$min_competition"}`;
    params = { ...params, min_competition: filters?.competition_index?.min };
  }
  if (filters?.competition_index?.max !== undefined) {
    whereClause += ` AND kws.competition_index <= ${mode === "clickhouse" ? "{max_competition:Float32}" : "$max_competition"}`;
    params = { ...params, max_competition: filters?.competition_index?.max };
  }
  if (filters?.cpc_high?.min !== undefined) {
    whereClause += ` AND kws.cpc_high >= ${mode === "clickhouse" ? "{min_cpc:Float32}" : "$min_cpc"}`;
    params = { ...params, min_cpc: filters?.cpc_high?.min };
  }
  if (filters?.cpc_high?.max !== undefined) {
    whereClause += ` AND kws.cpc_high <= ${mode === "clickhouse" ? "{max_cpc:Float32}" : "$max_cpc"}`;
    params = { ...params, max_cpc: filters?.cpc_high?.max };
  }
  return { whereClause, params };
}
