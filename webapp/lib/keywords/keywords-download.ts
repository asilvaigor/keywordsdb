import { createHash } from "node:crypto";
import type { SortingState } from "@tanstack/table-core";
import clickhouse from "@/lib/db/clickhouse";
import storage, { BUCKET_NAME, getDuckDBConnection } from "@/lib/db/storage";
import {
  buildOrderByClause,
  buildWhereClause,
  createDuckDBCacheIfNeeded,
} from "@/lib/keywords/utils";
import type { KeywordFilters } from "@/lib/types";

export class TooManyRowsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TooManyRowsError";
  }
}

export async function generatePresignedUrls({
  format,
  count,
  filters,
  sorting,
  isSample,
}: {
  format: "parquet" | "csv";
  count: number;
  filters?: KeywordFilters;
  sorting?: SortingState;
  isSample: boolean;
}) {
  if (count > 1_000_000 && format === "csv") {
    throw new TooManyRowsError(
      "CSV format has a limit of 1 million rows. Please apply more filters or choose Parquet format.",
    );
  }

  const cacheKey = `keywords-${JSON.stringify(filters)}-${JSON.stringify(sorting)}-${format}-${isSample}`;
  const hash = createHash("sha256").update(cacheKey, "utf8").digest("hex");
  const rowsPerPartition = format === "parquet" ? 1_000_000 : 100_000;
  const [existingFiles] = await storage
    .bucket(BUCKET_NAME)
    .getFiles({ prefix: `download/${hash}/`, maxResults: 1 });
  const fileExists = existingFiles.length > 0;

  if (!fileExists) {
    if (isSample) {
      const connection = await getDuckDBConnection();
      await createDuckDBCacheIfNeeded(connection);
      const { whereClause, params } = buildWhereClause("duckdb", filters);
      const orderByClause = buildOrderByClause(sorting);
      const numPartitions = Math.ceil(count / rowsPerPartition);
      const query = `
        COPY (
          SELECT
            kws.keyword,
            kws.avg_monthly_searches,
            kws.competition_index,
            kws.cpc_high,
            kws.volume_history,
            kws.updated_at,
            CAST(FLOOR(random() * ${numPartitions}) AS INTEGER) AS partition_id
          FROM keywords_sample kws
          ${whereClause}
          ${orderByClause}
        ) TO 'gs://${BUCKET_NAME}/download/${hash}/' WITH (
          FORMAT ${format === "parquet" ? "parquet" : "csv"},
          COMPRESSION ${format === "parquet" ? "snappy" : "none"},
          ${format === "csv" ? "HEADER," : ""}
          PARTITION_BY (partition_id)
        )
      `;
      console.log("Executing DuckDB export query");
      await connection.run(query, params);
    } else {
      const { whereClause, params } = buildWhereClause("clickhouse", filters);
      const orderByClause = buildOrderByClause(sorting);

      // Export data to GCS
      const query = `
      INSERT INTO FUNCTION
      s3(
        'https://storage.googleapis.com/${BUCKET_NAME}/download/${hash}/{_partition_id}.${format}',
        '${process.env.GCS_ACCESS_KEY_ID}',
        '${process.env.GCS_SECRET_ACCESS_KEY}',
        '${format === "parquet" ? "Parquet" : "CSVWithNames"}'
      )
      PARTITION BY rand() % ${Math.ceil(count / rowsPerPartition)}
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
    `;

      console.log("Executing ClickHouse export query");
      await clickhouse.query({
        query,
        query_params: { ...params },
      });
    }
  }

  // Generate presigned URLs for each partition
  console.log("Generating presigned URLs for exported files");
  let filePaths: string[];
  if (isSample) {
    // DuckDB writes Hive-style paths: partition_id=N/filename
    const [files] = await storage
      .bucket(BUCKET_NAME)
      .getFiles({ prefix: `download/${hash}/` });
    filePaths = files.map((f) => f.name);
  } else {
    const numPartitions = Math.ceil(count / rowsPerPartition);
    filePaths = Array.from(
      { length: numPartitions },
      (_, i) => `download/${hash}/${i}.${format}`,
    );
  }

  const urls = await Promise.all(
    filePaths.map((path, i) =>
      storage
        .bucket(BUCKET_NAME)
        .file(path)
        .getSignedUrl({
          version: "v4",
          expires: Date.now() + 86400000, // 24 hours
          action: "read",
          responseDisposition: `attachment; filename="keywordsdb-${i}.${format}"`,
        }),
    ),
  );

  return urls.map(([url]) => url);
}
