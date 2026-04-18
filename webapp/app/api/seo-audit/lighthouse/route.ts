import type { NextRequest } from "next/server";
import { validateUrl } from "@/lib/seo-audit/crawl";
import { fetchLighthouse } from "@/lib/seo-audit/lighthouse";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return Response.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const { parsed, error } = validateUrl(url);
  if (error || !parsed) {
    return Response.json({ error }, { status: 400 });
  }

  const apiKey = process.env.PSI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { type: "lighthouse-error", error: "PSI_API_KEY not configured" },
      { status: 503 },
    );
  }

  const result = await fetchLighthouse(parsed.href, apiKey);
  return Response.json(result);
}
