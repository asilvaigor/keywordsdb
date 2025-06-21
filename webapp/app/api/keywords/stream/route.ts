import { getKeywordsStream } from "@/lib/keywords";
import type { SortingState } from "@tanstack/react-table";
import type { NextRequest } from "next/server";

function getInt(value: string | null): number | undefined {
  return value ? Number.parseInt(value) : undefined;
}

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
  const sortParams = searchParams.getAll("sortBy");
  const sort: SortingState = sortParams.map((param) => {
    const isDescending = param.startsWith("-");
    const columnId = isDescending ? param.slice(1) : param;
    return {
      id: columnId,
      desc: isDescending,
    };
  });
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
          try {
            const data = `data: ${JSON.stringify(batch)}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch {
            // Controller is closed, stop streaming
            console.log("Controller closed, stopping stream");
            break;
          }
        }

        // Send end signal
        try {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {
          // Controller already closed, ignore
        }
      } catch (error) {
        console.error("Streaming error:", error);
        try {
          const errorData = `data: ${JSON.stringify({ error: "Stream failed" })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        } catch {
          // Controller already closed, ignore
        }
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
