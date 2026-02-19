import type { NextRequest } from "next/server";
import { getKeywordsCount } from "@/lib/keywords/keywords";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const filters = {
    keyword: searchParams.get("keyword") || undefined,
    avg_monthly_searches:
      JSON.parse(searchParams.get("avg_monthly_searches") || "null") ??
      undefined,
    competition_index:
      JSON.parse(searchParams.get("competition_index") || "null") ?? undefined,
    cpc_high: JSON.parse(searchParams.get("cpc_high") || "null") ?? undefined,
  };
  const isSample = searchParams.get("isSample") === "true";

  try {
    const count = await getKeywordsCount(filters, isSample);
    return new Response(JSON.stringify({ count }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching keywords count:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch keywords count" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
