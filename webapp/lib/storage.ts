import { DuckDBConnection } from "@duckdb/node-api";

export const BUCKET_NAME = `keywordsdb-${process.env.NEXT_PUBLIC_ENV}`;

let duckDBConnection: DuckDBConnection | null = null;

export async function getDuckDBConnection(): Promise<DuckDBConnection> {
  if (duckDBConnection) {
    return duckDBConnection;
  }

  duckDBConnection = await DuckDBConnection.create();
  await duckDBConnection.run(`
    CREATE SECRET (
    TYPE gcs,
        KEY_ID '${process.env.GCS_ACCESS_KEY_ID}',
        SECRET '${process.env.GCS_SECRET_ACCESS_KEY}'
    );
  `);
  return duckDBConnection;
}
