import type { NextRequest } from "next/server";
import { runAudit } from "@/lib/seo-audit/audit";
import { validateUrl } from "@/lib/seo-audit/crawl";
import type { AuditError, AuditProgress } from "@/lib/seo-audit/types";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const maxPages = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get("maxPages") ?? 1000), 1),
    1000,
  );

  if (!url) {
    return Response.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const { parsed, error } = validateUrl(url);
  if (error || !parsed) {
    return Response.json({ error }, { status: 400 });
  }

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
          maxPages,
          (pagesScanned, totalPages, currentUrl) => {
            const progress: AuditProgress = {
              type: "progress",
              pagesScanned,
              totalPages,
              currentUrl,
            };
            enqueue(JSON.stringify(progress));
          },
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
