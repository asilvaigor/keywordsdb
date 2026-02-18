"use server";

import clickhouse from "@/lib/db/clickhouse";

export async function pingClickhouse(): Promise<boolean> {
  return (await clickhouse.ping()).success;
}
