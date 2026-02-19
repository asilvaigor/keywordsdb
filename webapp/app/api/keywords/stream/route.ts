import type { NextRequest } from "next/server";
import { getKeywordsStream } from "@/lib/keywords/keywords";
import { parseSearchParams } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const { filters, sorting, page, pageSize, isSample } =
    parseSearchParams(searchParams);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const batch of getKeywordsStream(
          filters,
          sorting,
          page,
          pageSize,
          isSample,
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
