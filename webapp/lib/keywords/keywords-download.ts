import { createHash } from "node:crypto";
import type { SortingState } from "@tanstack/table-core";
import clickhouse from "@/lib/db/clickhouse";
import storage, {
  BACKUP_BUCKET_NAME,
  BUCKET_NAME,
  getDuckDBConnection,
} from "@/lib/db/storage";
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
  filters: KeywordFilters;
  sorting: SortingState;
  isSample: boolean;
}) {
  if (count > 1_000_000 && format === "csv") {
    throw new TooManyRowsError(
      "CSV format has a limit of 1 million rows. Please apply more filters or choose Parquet format.",
    );
  }
  if (format !== "parquet" && format !== "csv") {
    throw new Error("Invalid format. Must be 'parquet' or 'csv'.");
  }

  const cacheKey = `keywords-${JSON.stringify(filters)}-${JSON.stringify(sorting)}-${format}-${isSample}`;
  const hash = createHash("sha256").update(cacheKey, "utf8").digest("hex");
  const rowsPerPartition = format === "parquet" ? 500_000 : 100_000;
  const [existingFiles] = await storage
    .bucket(BUCKET_NAME)
    .getFiles({ prefix: `download/${hash}/`, maxResults: 1 });
  const fileExists = existingFiles.length > 0;
  const numPartitions = Math.ceil(count / rowsPerPartition);
  const hasFilters = Object.values(filters || {}).some((v) => v != null);

  if (!fileExists) {
    if (isSample) {
      await exportDuckDBToGCS({
        filters,
        sorting,
        format,
        hash,
        numPartitions,
      });
    } else if (hasFilters) {
      await exportClickHouseToGCS({
        filters,
        sorting,
        format,
        hash,
        numPartitions,
      });
    }
  }

  let filePaths: string[];
  if (isSample) {
    filePaths = Array.from(
      { length: numPartitions },
      (_, i) => `download/${hash}/partition_id=${i}/data_${i}.${format}`,
    );
    return generatePresignedUrlsFromPaths(filePaths, BUCKET_NAME, format);
  } else if (hasFilters) {
    filePaths = Array.from(
      { length: numPartitions },
      (_, i) => `download/${hash}/${i}.${format}`,
    );
    return generatePresignedUrlsFromPaths(filePaths, BUCKET_NAME, format);
  } else {
    // No filters, we can just get backup files
    if (format !== "parquet") {
      throw new Error("Not Implemented");
    }
    const currentFile = await storage
      .bucket(BACKUP_BUCKET_NAME)
      .file("current")
      .get();
    const currentString = (await currentFile[0].download()).toString();
    filePaths = await storage
      .bucket(BACKUP_BUCKET_NAME)
      .getFiles({ prefix: currentString })
      .then((res) => res[0].map((file) => file.name));
    return generatePresignedUrlsFromPaths(
      filePaths,
      BACKUP_BUCKET_NAME,
      format,
    );
  }
}

async function exportClickHouseToGCS({
  filters,
  sorting,
  format,
  hash,
  numPartitions,
}: {
  filters: KeywordFilters | undefined;
  sorting: SortingState | undefined;
  format: "parquet" | "csv";
  hash: string;
  numPartitions: number;
}) {
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
  PARTITION BY rand() % ${numPartitions}
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

async function exportDuckDBToGCS({
  filters,
  sorting,
  format,
  hash,
  numPartitions,
}: {
  filters: KeywordFilters | undefined;
  sorting: SortingState | undefined;
  format: "parquet" | "csv";
  hash: string;
  numPartitions: number;
}) {
  const connection = await getDuckDBConnection();
  await createDuckDBCacheIfNeeded(connection);
  const { whereClause, params } = buildWhereClause("duckdb", filters);
  const orderByClause = buildOrderByClause(sorting);
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
}

async function generatePresignedUrlsFromPaths(
  filePaths: string[],
  bucket: string,
  format: "parquet" | "csv",
) {
  const urls = await Promise.all(
    filePaths.map((path, i) =>
      storage
        .bucket(bucket)
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
