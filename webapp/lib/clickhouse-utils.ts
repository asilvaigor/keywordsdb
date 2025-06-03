"use server";

import clickhouse from "@/lib/clickhouse";

export async function pingClickhouse(): Promise<boolean> {
  return (await clickhouse.ping()).success;
}
