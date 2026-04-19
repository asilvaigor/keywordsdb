import type { CrawlData, CrawledPage } from "@/lib/seo-audit/types";

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "0.0.0.0",
  "metadata.google.internal",
]);

function isPrivateHost(hostname: string): boolean {
  if (BLOCKED_HOSTNAMES.has(hostname)) return true;
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
}

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB per page
const FETCH_TIMEOUT = 10_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; KeywordsDB-SEOAudit/1.0; +https://keywordsdb.com)";

export function validateUrl(url: string): { parsed?: URL; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { error: "Please enter a valid URL (e.g. https://example.com)" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { error: "URL must start with http:// or https://" };
  }

  if (isPrivateHost(parsed.hostname)) {
    return { error: "Cannot audit internal or private URLs" };
  }

  return { parsed };
}

async function fetchPage(url: string): Promise<CrawledPage | null> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_RESPONSE_SIZE) {
      return null;
    }

    const html = await response.text();
    if (html.length > MAX_RESPONSE_SIZE) return null;

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      url,
      finalUrl: response.url,
      html,
      status: response.status,
      headers,
      responseTimeMs: Date.now() - start,
      byteSize: new TextEncoder().encode(html).byteLength,
    };
  } catch {
    return null;
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function detectBotProtection(html: string): string | null {
  const lower = html.toLowerCase();
  if (
    lower.includes("vercel security checkpoint") ||
    lower.includes("verifying your browser")
  ) {
    return "Vercel Security Checkpoint";
  }
  if (
    lower.includes("ddos protection by cloudflare") ||
    lower.includes("cf-browser-verification") ||
    lower.includes("checking your browser before accessing")
  ) {
    return "Cloudflare Bot Protection";
  }
  return null;
}

/** Extract all same-domain links from HTML */
function extractInternalLinks(html: string, baseUrl: URL): string[] {
  const seen = new Set<string>();
  const linkRegex = /<a\s[^>]*href\s*=\s*["']([^"'#]+)/gi;
  let match: RegExpExecArray | null = linkRegex.exec(html);

  while (match !== null) {
    try {
      const resolved = new URL(match[1], baseUrl);
      // Same domain only, http(s) only, skip Cloudflare paths, strip hash/search for dedup
      if (
        resolved.hostname === baseUrl.hostname &&
        (resolved.protocol === "http:" || resolved.protocol === "https:") &&
        !resolved.pathname.startsWith("/cdn-cgi/")
      ) {
        // Normalize protocol to match base URL to avoid http/https duplicates
        resolved.protocol = baseUrl.protocol;
        resolved.hash = "";
        resolved.search = "";
        const normalized = resolved.href.replace(/\/+$/, "");
        seen.add(normalized);
      }
    } catch {
      // ignore malformed URLs
    }
    match = linkRegex.exec(html);
  }

  return [...seen];
}

export async function crawlSite(
  startUrl: string,
  maxPages: number,
  onProgress: (
    pagesScanned: number,
    totalPages: number,
    currentUrl: string,
  ) => void,
): Promise<CrawlData> {
  const parsed = new URL(startUrl);
  const domain = parsed.hostname;

  // BFS queue and visited set
  const queue: string[] = [startUrl.replace(/\/+$/, "")];
  const visited = new Set<string>();
  const pages: CrawledPage[] = [];

  // Estimate total pages (grows as we discover links)
  const discoveredLinks = new Set<string>(queue);

  while (queue.length > 0 && pages.length < maxPages) {
    const url = queue.shift();
    if (!url) continue;
    const normalizedUrl = url.replace(/\/+$/, "");
    if (visited.has(normalizedUrl)) continue;
    visited.add(normalizedUrl);

    onProgress(
      pages.length + 1,
      Math.min(Math.max(discoveredLinks.size, pages.length + 1), maxPages),
      url,
    );

    const page = await fetchPage(url);
    if (!page) continue;

    // Only process HTML pages
    const contentType = page.headers["content-type"] ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("xhtml")) {
      continue;
    }

    // Detect bot protection walls (e.g. Vercel, Cloudflare)
    const botProtection = detectBotProtection(page.html);
    if (botProtection) {
      // If the very first page is blocked, fail fast with a clear message
      if (pages.length === 0) {
        throw new Error(
          `This website is protected by ${botProtection} and is blocking the crawler. To allow auditing, please whitelist the crawler bot on your hosting/CDN settings. Crawler details: User-Agent "${USER_AGENT}".`,
        );
      }
      // Otherwise skip this individual blocked page
      continue;
    }

    // Deduplicate by finalUrl (different original URLs can redirect to the same page)
    const finalNormalized = page.finalUrl.replace(/\/+$/, "");
    if (pages.some((p) => p.finalUrl.replace(/\/+$/, "") === finalNormalized)) {
      continue;
    }

    pages.push(page);

    // Extract links for BFS
    const links = extractInternalLinks(page.html, new URL(page.finalUrl));
    for (const link of links) {
      const normalized = link.replace(/\/+$/, "");
      if (!visited.has(normalized) && !discoveredLinks.has(normalized)) {
        discoveredLinks.add(normalized);
        queue.push(normalized);
      }
    }
  }

  // Fetch robots.txt and sitemap.xml (outside page limit)
  const origin = parsed.origin;
  const [robotsTxt, sitemapXml] = await Promise.all([
    fetchText(`${origin}/robots.txt`),
    fetchText(`${origin}/sitemap.xml`),
  ]);

  return { pages, robotsTxt, sitemapXml, startUrl, domain };
}
