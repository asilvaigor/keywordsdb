import type {
  AuditCheck,
  AuditCheckPage,
  CrawlData,
  PageExtraction,
} from "@/lib/seo-audit/types";

const LINK_CHECK_TIMEOUT = 5_000;
const MAX_EXTERNAL_CHECKS = 50;
const MAX_PAGES_PER_CHECK = 10;

/** Cloudflare infrastructure paths — not real pages, safe to ignore */
function isCloudflarePath(url: string): boolean {
  try {
    return new URL(url).pathname.startsWith("/cdn-cgi/");
  } catch {
    return url.includes("/cdn-cgi/");
  }
}

async function checkUrlStatus(url: string): Promise<number | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LINK_CHECK_TIMEOUT);
    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; KeywordsDB-SEOAudit/1.0; +https://keywordsdb.com)",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);
    return response.status;
  } catch {
    return null; // timeout or network error
  }
}

export async function checkLinks(
  allPages: { url: string; extraction: PageExtraction }[],
  crawlData: CrawlData,
): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];

  // 1. Broken links — check sampled external links + internal links that returned errors
  // Map external URL → set of pages that link to it
  const externalLinkSources = new Map<string, Set<string>>();
  for (const page of allPages) {
    for (const link of page.extraction.links.external) {
      const existing = externalLinkSources.get(link);
      if (existing) {
        existing.add(page.url);
      } else {
        externalLinkSources.set(link, new Set([page.url]));
      }
    }
  }

  // Map internal URL → set of pages that link to it
  const internalLinkSources = new Map<string, Set<string>>();
  for (const page of allPages) {
    for (const link of page.extraction.links.internal) {
      const normalized = link.replace(/\/+$/, "");
      const existingInternal = internalLinkSources.get(normalized);
      if (existingInternal) {
        existingInternal.add(page.url);
      } else {
        internalLinkSources.set(normalized, new Set([page.url]));
      }
    }
  }

  // Check crawled pages for HTTP error status codes (ignore Cloudflare paths)
  const brokenInternal = crawlData.pages.filter(
    (p) => p.status >= 400 && !isCloudflarePath(p.url),
  );

  // Sample external links (filter out Cloudflare paths)
  const externalSample = [...externalLinkSources.keys()]
    .filter((url) => !isCloudflarePath(url))
    .slice(0, MAX_EXTERNAL_CHECKS);
  const externalResults = await Promise.all(
    externalSample.map(async (url) => ({
      url,
      status: await checkUrlStatus(url),
    })),
  );
  // Exclude 401/403/429 — those mean access denied or bot-blocked, not a broken link
  const brokenExternal = externalResults.filter(
    (r) =>
      r.status !== null &&
      r.status >= 400 &&
      r.status !== 401 &&
      r.status !== 403 &&
      r.status !== 429,
  );

  const totalBroken = brokenInternal.length + brokenExternal.length;
  const status = totalBroken === 0 ? "pass" : "fail";

  // Build per-page details for broken links
  const brokenPages: AuditCheckPage[] =
    totalBroken > 0
      ? [
          ...brokenInternal.map((p) => {
            const normalized = p.url.replace(/\/+$/, "");
            const sources = internalLinkSources.get(normalized);
            const sourceList = sources?.size
              ? [...sources]
                  .slice(0, 3)
                  .map((s) => {
                    try {
                      const u = new URL(s);
                      return u.pathname === "/" ? u.hostname : u.pathname;
                    } catch {
                      return s;
                    }
                  })
                  .join(", ")
              : "";
            return {
              url: p.url,
              description: `HTTP ${p.status}${sourceList ? ` — linked from ${sourceList}` : ""}`,
            };
          }),
          ...brokenExternal.map((r) => {
            const sources = externalLinkSources.get(r.url);
            const sourceList = sources?.size
              ? [...sources]
                  .slice(0, 3)
                  .map((s) => {
                    try {
                      const u = new URL(s);
                      return u.pathname === "/" ? u.hostname : u.pathname;
                    } catch {
                      return s;
                    }
                  })
                  .join(", ")
              : "";
            return {
              url: r.url,
              description: `HTTP ${r.status}${sourceList ? ` — linked from ${sourceList}` : ""}`,
            };
          }),
        ].slice(0, MAX_PAGES_PER_CHECK)
      : [];

  checks.push({
    id: "links-broken",
    category: "links",
    title: "Broken links",
    status,
    description:
      totalBroken === 0
        ? `No broken links found (checked ${crawlData.pages.length} internal + ${externalSample.length} external URLs).`
        : `Found ${totalBroken} broken link${totalBroken > 1 ? "s" : ""} (${brokenInternal.length} internal, ${brokenExternal.length} external).`,
    pages: brokenPages.length > 0 ? brokenPages : undefined,
  });

  // 2. Internal links per page
  if (allPages.length > 0) {
    // Filter out Cloudflare infrastructure pages
    const relevantPages = allPages.filter((p) => !isCloudflarePath(p.url));
    const internalLinkCounts = relevantPages.map(
      (p) => p.extraction.links.internal.length,
    );
    const avg =
      internalLinkCounts.length > 0
        ? internalLinkCounts.reduce((a, b) => a + b, 0) /
          internalLinkCounts.length
        : 0;
    const pagesWithZero = internalLinkCounts.filter((c) => c === 0).length;

    const linkStatus = avg >= 3 && pagesWithZero === 0 ? "pass" : "fail";

    // Collect pages with zero internal links (ignore Cloudflare paths)
    const zeroLinkPages: AuditCheckPage[] = relevantPages
      .filter((p) => p.extraction.links.internal.length === 0)
      .slice(0, MAX_PAGES_PER_CHECK)
      .map((p) => ({
        url: p.url,
        description: "No internal links on this page",
      }));

    checks.push({
      id: "links-internal",
      category: "links",
      title: "Internal linking",
      status: linkStatus,
      description:
        linkStatus === "pass"
          ? `Good internal linking — average of ${avg.toFixed(1)} internal links per page across ${relevantPages.length} pages.`
          : pagesWithZero > 0
            ? `${pagesWithZero} page${pagesWithZero > 1 ? "s" : ""} ${pagesWithZero > 1 ? "have" : "has"} no internal links. Average of ${avg.toFixed(1)} links per page across ${relevantPages.length} pages. Improve interlinking for better crawlability.`
            : `Average of ${avg.toFixed(1)} internal links per page. Aim for at least 3 internal links per page.`,
      pages: zeroLinkPages.length > 0 ? zeroLinkPages : undefined,
    });
  }

  // 3. Orphan pages — pages not linked to by any other crawled page
  if (allPages.length > 1) {
    const allLinkedUrls = new Set<string>();
    for (const page of allPages) {
      for (const link of page.extraction.links.internal) {
        allLinkedUrls.add(link.replace(/\/+$/, ""));
      }
    }

    const orphans = allPages.filter(
      (p) =>
        p.url !== crawlData.startUrl.replace(/\/+$/, "") &&
        !allLinkedUrls.has(p.url.replace(/\/+$/, "")),
    );

    const orphanStatus = orphans.length === 0 ? "pass" : "fail";

    const orphanPages: AuditCheckPage[] = orphans
      .slice(0, MAX_PAGES_PER_CHECK)
      .map((p) => ({
        url: p.url,
        description: "Not linked from any other crawled page",
      }));

    checks.push({
      id: "links-orphans",
      category: "links",
      title: "Orphan pages",
      status: orphanStatus,
      description:
        orphans.length === 0
          ? `No orphan pages found among ${allPages.length} crawled pages — all pages are linked to.`
          : `Found ${orphans.length} orphan page${orphans.length > 1 ? "s" : ""} not linked from other crawled pages. These may be hard for search engines to discover.`,
      pages: orphanPages.length > 0 ? orphanPages : undefined,
    });
  }

  return checks;
}
