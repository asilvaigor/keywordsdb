import type { NextRequest } from "next/server";
import { getKeywordsCount } from "@/lib/keywords/keywords";
import { parseSearchParams } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const { filters, isSample } = parseSearchParams(searchParams);

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
