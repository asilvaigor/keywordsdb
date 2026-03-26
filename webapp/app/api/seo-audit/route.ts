import type { NextRequest } from "next/server";
import { MAX_PAGES, runAudit } from "@/lib/seo-audit/audit";
import { validateUrl } from "@/lib/seo-audit/crawl";
import type { AuditError, AuditProgress } from "@/lib/seo-audit/types";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return Response.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const { parsed, error } = validateUrl(url);
  if (error || !parsed) {
    return Response.json({ error }, { status: 400 });
  }

  const maxPagesParam = request.nextUrl.searchParams.get("maxPages");
  const maxPages = maxPagesParam
    ? Math.max(
        1,
        Math.min(Number.parseInt(maxPagesParam, 10) || MAX_PAGES, MAX_PAGES),
      )
    : MAX_PAGES;

  const abortController = new AbortController();
  request.signal.addEventListener("abort", () => abortController.abort());

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // Controller closed
        }
      };

      try {
        const result = await runAudit(
          parsed.href,
          (pagesScanned, totalPages, currentUrl) => {
            const progress: AuditProgress = {
              type: "progress",
              pagesScanned,
              totalPages,
              currentUrl,
            };
            enqueue(JSON.stringify(progress));
          },
          maxPages,
          abortController.signal,
        );

        enqueue(JSON.stringify(result));
      } catch (err) {
        const auditError: AuditError = {
          type: "error",
          error:
            err instanceof Error
              ? err.message
              : "An unexpected error occurred during the audit.",
        };
        enqueue(JSON.stringify(auditError));
      }

      try {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch {
        // Already closed
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
