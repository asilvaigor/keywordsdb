import { DuckDBConnection } from "@duckdb/node-api";
import { Storage } from "@google-cloud/storage";

export const BUCKET_NAME = `keywordsdb-${process.env.NEXT_PUBLIC_ENV}`;

const storage = new Storage();

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

export default storage;
