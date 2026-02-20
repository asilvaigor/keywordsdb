import type { NextRequest } from "next/server";
import { getDownloadUrls } from "@/lib/keywords/keywords";
import { TooManyRowsError } from "@/lib/keywords/keywords-download";
import { parseSearchParams } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const { filters, sorting, isSample } = parseSearchParams(searchParams);
  const format = searchParams.get("format") === "csv" ? "csv" : "parquet";

  try {
    const urls = await getDownloadUrls({ format, filters, sorting, isSample });
    return new Response(JSON.stringify({ urls }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof TooManyRowsError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("Error fetching download URLs:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch download URLs" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
