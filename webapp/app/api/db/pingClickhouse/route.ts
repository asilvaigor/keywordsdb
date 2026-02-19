import { pingClickhouse } from "@/lib/db/clickhouse-utils";

export async function GET() {
  try {
    const success = await pingClickhouse();
    return new Response(JSON.stringify({ success }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error pinging ClickHouse:", error);
    return new Response(
      JSON.stringify({ error: "Failed to ping ClickHouse" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
