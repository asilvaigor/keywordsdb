import type { DuckDBConnection } from "@duckdb/node-api";
import type { SortingState } from "@tanstack/react-table";
import { BUCKET_NAME } from "@/lib/db/storage";
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
        volume_estimated_google,
        volume_google,
        volume_bing,
        competition_index,
        cpc_high,
        volume_history_google,
        is_adult,
        is_question,
        is_comparison,
        is_branded,
        intent,
        entity_type,
        saas_potential,
        updated_at
      FROM parquet_scan('gs://${BUCKET_NAME}/keywords-sample/sample.parquet')
    `);
  }
}

export function buildSelectClause(
  dialect: "duckdb" | "clickhouse",
  columns?: string[],
) {
  const validColumns = [
    "volume_estimated_google",
    "volume_google",
    "volume_bing",
    "competition_index",
    "cpc_high",
    "volume_history_google",
    "is_adult",
    "is_question",
    "is_comparison",
    "is_branded",
    "intent",
    "entity_type",
    "saas_potential",
    "updated_at",
  ];
  const customFormatters: Record<string, (col: string) => string> = {
    saas_potential: (col: string) =>
      `CASE WHEN kws.${col} < 0.33 THEN 'low' WHEN kws.${col} < 0.66 THEN 'medium' ELSE 'high' END as ${col}`,
    intent: (col: string) =>
      dialect === "clickhouse"
        ? `INITCAP(kws.${col}) as ${col}`
        : `upper(substring(kws.${col}, 1, 1)) || substring(kws.${col}, 2) as ${col}`,
    entity_type: (col: string) =>
      dialect === "clickhouse"
        ? `INITCAP(kws.${col}) as ${col}`
        : `upper(substring(kws.${col}, 1, 1)) || substring(kws.${col}, 2) as ${col}`,
  };
  if (columns == null) {
    columns = validColumns;
  } else {
    columns.forEach((col) => {
      if (!validColumns.includes(col)) {
        throw new Error(`Invalid column: ${col}`);
      }
    });
  }
  return `kws.keyword,${columns.map((c) => (customFormatters[c] ? customFormatters[c](c) : `kws.${c}`)).join(", ")}`;
}

export function buildWhereClause(
  dialect: "duckdb" | "clickhouse",
  filters?: KeywordFilters,
): {
  whereClause: string;
  params: Record<string, string | number | boolean>;
} {
  let whereClause = "WHERE 1=1";
  let params: Record<string, string | number | boolean> = {};

  if (filters?.keyword) {
    whereClause += ` AND kws.keyword LIKE ${dialect === "clickhouse" ? "{keyword_filter:String}" : "$keyword_filter"}`;
    params = {
      ...params,
      keyword_filter: `%${filters.keyword.toLowerCase()}%`,
    };
  }
  if (filters?.volume_estimated_google?.min !== undefined) {
    whereClause += ` AND kws.volume_estimated_google >= ${dialect === "clickhouse" ? "{min_searches:Int32}" : "$min_searches"}`;
    params = { ...params, min_searches: filters?.volume_estimated_google?.min };
  }
  if (filters?.volume_estimated_google?.max !== undefined) {
    whereClause += ` AND kws.volume_estimated_google <= ${dialect === "clickhouse" ? "{max_searches:Int32}" : "$max_searches"}`;
    params = { ...params, max_searches: filters?.volume_estimated_google?.max };
  }
  if (filters?.volume_google?.min !== undefined) {
    whereClause += ` AND kws.volume_google >= ${dialect === "clickhouse" ? "{min_searches_google:Int32}" : "$min_searches_google"}`;
    params = { ...params, min_searches_google: filters?.volume_google?.min };
  }
  if (filters?.volume_google?.max !== undefined) {
    whereClause += ` AND kws.volume_google <= ${dialect === "clickhouse" ? "{max_searches_google:Int32}" : "$max_searches_google"}`;
    params = { ...params, max_searches_google: filters?.volume_google?.max };
  }
  if (filters?.volume_bing?.min !== undefined) {
    whereClause += ` AND kws.volume_bing >= ${dialect === "clickhouse" ? "{min_searches_bing:Int32}" : "$min_searches_bing"}`;
    params = { ...params, min_searches_bing: filters?.volume_bing?.min };
  }
  if (filters?.volume_bing?.max !== undefined) {
    whereClause += ` AND kws.volume_bing <= ${dialect === "clickhouse" ? "{max_searches_bing:Int32}" : "$max_searches_bing"}`;
    params = { ...params, max_searches_bing: filters?.volume_bing?.max };
  }
  if (filters?.competition_index?.min !== undefined) {
    whereClause += ` AND kws.competition_index >= ${dialect === "clickhouse" ? "{min_competition:Float32}" : "$min_competition"}`;
    params = { ...params, min_competition: filters?.competition_index?.min };
  }
  if (filters?.competition_index?.max !== undefined) {
    whereClause += ` AND kws.competition_index <= ${dialect === "clickhouse" ? "{max_competition:Float32}" : "$max_competition"}`;
    params = { ...params, max_competition: filters?.competition_index?.max };
  }
  if (filters?.cpc_high?.min !== undefined) {
    whereClause += ` AND kws.cpc_high >= ${dialect === "clickhouse" ? "{min_cpc:Float32}" : "$min_cpc"}`;
    params = { ...params, min_cpc: filters?.cpc_high?.min };
  }
  if (filters?.cpc_high?.max !== undefined) {
    whereClause += ` AND kws.cpc_high <= ${dialect === "clickhouse" ? "{max_cpc:Float32}" : "$max_cpc"}`;
    params = { ...params, max_cpc: filters?.cpc_high?.max };
  }
  if (filters?.is_adult != null) {
    whereClause += ` AND kws.is_adult = ${dialect === "clickhouse" ? "{is_adult:UInt8}" : "$is_adult"}`;
    params = { ...params, is_adult: filters?.is_adult };
  }
  if (filters?.is_question != null) {
    whereClause += ` AND kws.is_question = ${dialect === "clickhouse" ? "{is_question:UInt8}" : "$is_question"}`;
    params = { ...params, is_question: filters?.is_question };
  }
  if (filters?.is_comparison != null) {
    whereClause += ` AND kws.is_comparison = ${dialect === "clickhouse" ? "{is_comparison:UInt8}" : "$is_comparison"}`;
    params = { ...params, is_comparison: filters?.is_comparison };
  }
  if (filters?.is_branded != null) {
    whereClause += ` AND kws.is_branded = ${dialect === "clickhouse" ? "{is_branded:UInt8}" : "$is_branded"}`;
    params = { ...params, is_branded: filters?.is_branded };
  }
  if (filters?.intent) {
    whereClause += ` AND kws.intent = ${dialect === "clickhouse" ? "{intent:String}" : "$intent"}`;
    params = { ...params, intent: filters?.intent };
  }
  if (filters?.entity_type) {
    whereClause += ` AND kws.entity_type = ${dialect === "clickhouse" ? "{entity_type:String}" : "$entity_type"}`;
    params = { ...params, entity_type: filters?.entity_type };
  }
  if (filters?.saas_potential) {
    const minSaasPotential =
      filters.saas_potential === "low"
        ? -0.01
        : filters.saas_potential === "medium"
          ? 0.33
          : 0.66;
    const maxSaasPotential =
      filters.saas_potential === "low"
        ? 0.33
        : filters.saas_potential === "medium"
          ? 0.66
          : 1.01;
    whereClause += ` AND kws.saas_potential >= ${dialect === "clickhouse" ? "{min_saas_potential:Float32}" : "$min_saas_potential"}`;
    whereClause += ` AND kws.saas_potential < ${dialect === "clickhouse" ? "{max_saas_potential:Float32}" : "$max_saas_potential"}`;
    params = {
      ...params,
      min_saas_potential: minSaasPotential,
      max_saas_potential: maxSaasPotential,
    };
  }
  return { whereClause, params };
}

export function buildOrderByClause(sort?: SortingState) {
  if (!sort || sort.length === 0) return "";
  sort.forEach((s) => {
    if (
      ![
        "volume_estimated_google",
        "volume_google",
        "volume_bing",
        "competition_index",
        "cpc_high",
      ].includes(s.id)
    ) {
      throw new Error(`Invalid sort column: ${s.id}`);
    }
  });
  const sortClauses = sort.map((s) => `kws.${s.id} ${s.desc ? "DESC" : "ASC"}`);
  return `ORDER BY ${sortClauses.join(", ")}`;
}
