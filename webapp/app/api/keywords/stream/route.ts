import { getKeywordsStream } from "@/lib/keywords";
import type { SortingState } from "@tanstack/react-table";
import type { NextRequest } from "next/server";

function getInt(value: string | null): number | undefined {
  return value ? Number.parseInt(value) : undefined;
}

function getFloat(value: string | null): number | undefined {
  return value ? Number.parseFloat(value) : undefined;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filters = {
    keyword: searchParams.get("keyword") || undefined,
    minMonthlySearches: getInt(searchParams.get("minMonthlySearches")),
    maxMonthlySearches: getInt(searchParams.get("maxMonthlySearches")),
    minCompetitionIndex: getInt(searchParams.get("minCompetitionIndex")),
    maxCompetitionIndex: getInt(searchParams.get("maxCompetitionIndex")),
    minCpcHigh: getFloat(searchParams.get("minCpcHigh")),
    maxCpcHigh: getFloat(searchParams.get("maxCpcHigh")),
  };
  const sortParam = searchParams.get("sort");
  const sort: SortingState = sortParam ? JSON.parse(sortParam) : undefined;
  const page = getInt(searchParams.get("page"));
  const pageSize = getInt(searchParams.get("pageSize"));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const batch of getKeywordsStream(
          filters,
          sort,
          page,
          pageSize,
        )) {
          const data = `data: ${JSON.stringify(batch)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        // Send end signal
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Streaming error:", error);
        const errorData = `data: ${JSON.stringify({ error: "Stream failed" })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}
