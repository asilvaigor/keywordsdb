import type {
  AuditCheck,
  AuditCheckPage,
  CrawlData,
  PageExtraction,
} from "@/lib/seo-audit/types";

const MAX_PAGES_PER_CHECK = 10;

export function checkTechnical(
  allPages: { url: string; extraction: PageExtraction }[],
  crawlData: CrawlData,
): AuditCheck[] {
  const checks: AuditCheck[] = [];

  // 1. HTTPS — site-level check
  const usesHttps = crawlData.startUrl.startsWith("https://");
  const primaryPage0 = crawlData.pages[0];
  const redirectedToHttps = primaryPage0
    ? primaryPage0.finalUrl.startsWith("https://")
    : false;

  checks.push({
    id: "tech-https",
    category: "technical",
    title: "HTTPS",
    status: usesHttps ? "pass" : "fail",
    description: usesHttps
      ? "Site is served over HTTPS."
      : redirectedToHttps
        ? "Site redirects from HTTP to HTTPS. Consider using HTTPS URLs directly."
        : "Site is not using HTTPS. This is essential for security and SEO rankings.",
  });

  // 2. robots.txt — site-level check
  if (crawlData.robotsTxt) {
    const txt = crawlData.robotsTxt.toLowerCase();
    const hasDisallowAll =
      /disallow:\s*\/\s*$/m.test(txt) && /user-agent:\s*\*/m.test(txt);
    const allowsGooglebot =
      !hasDisallowAll ||
      (/user-agent:\s*googlebot/i.test(txt) &&
        !/user-agent:\s*googlebot[\s\S]*?disallow:\s*\/\s*$/m.test(txt));

    checks.push({
      id: "tech-robots",
      category: "technical",
      title: "robots.txt",
      status: allowsGooglebot && !hasDisallowAll ? "pass" : "fail",
      description:
        allowsGooglebot && !hasDisallowAll
          ? "robots.txt is present and allows search engine crawling."
          : hasDisallowAll
            ? "robots.txt blocks all crawlers with 'Disallow: /'. This prevents search engines from indexing the site."
            : "robots.txt is present but may restrict some bots. Verify that major search engines can crawl the site.",
    });
  } else {
    checks.push({
      id: "tech-robots",
      category: "technical",
      title: "robots.txt",
      status: "fail",
      description:
        "No robots.txt file found. While not required, having one helps communicate crawling preferences to search engines.",
    });
  }

  // 3. sitemap.xml — site-level check
  if (crawlData.sitemapXml) {
    const isValid =
      crawlData.sitemapXml.includes("<urlset") ||
      crawlData.sitemapXml.includes("<sitemapindex");
    checks.push({
      id: "tech-sitemap",
      category: "technical",
      title: "XML Sitemap",
      status: isValid ? "pass" : "fail",
      description: isValid
        ? "sitemap.xml is present and contains valid XML structure."
        : "sitemap.xml exists but doesn't appear to be a valid XML sitemap.",
    });
  } else {
    checks.push({
      id: "tech-sitemap",
      category: "technical",
      title: "XML Sitemap",
      status: "fail",
      description:
        "No sitemap.xml found at the site root. An XML sitemap helps search engines discover and index all your pages.",
    });
  }

  // 4. Structured data — check all pages
  {
    const failing: AuditCheckPage[] = allPages
      .filter(
        (p) =>
          !p.extraction.structuredData.jsonLd &&
          !p.extraction.structuredData.microdata,
      )
      .slice(0, MAX_PAGES_PER_CHECK)
      .map((p) => ({
        url: p.url,
        description: "No JSON-LD or Microdata found",
      }));

    checks.push({
      id: "tech-structured-data",
      category: "technical",
      title: "Structured data",
      status: failing.length === 0 ? "pass" : "fail",
      description:
        failing.length === 0
          ? `All pages have structured data (JSON-LD or Microdata) for rich search snippets.`
          : `${failing.length} page${failing.length > 1 ? "s" : ""} missing structured data. Adding JSON-LD or Microdata can improve how pages appear in search results.`,
      pages: failing.length > 0 ? failing : undefined,
    });
  }

  // 5. HTML5 Doctype — check all pages
  {
    const failing: AuditCheckPage[] = allPages
      .filter((p) => !p.extraction.meta.doctype)
      .slice(0, MAX_PAGES_PER_CHECK)
      .map((p) => ({
        url: p.url,
        description: "Missing or non-HTML5 doctype",
      }));

    checks.push({
      id: "tech-doctype",
      category: "technical",
      title: "HTML5 Doctype",
      status: failing.length === 0 ? "pass" : "fail",
      description:
        failing.length === 0
          ? `All pages use the HTML5 doctype declaration.`
          : `${failing.length} page${failing.length > 1 ? "s" : ""} missing HTML5 doctype. Use <!DOCTYPE html> as the first line of your HTML.`,
      pages: failing.length > 0 ? failing : undefined,
    });
  }

  // 6. Character encoding — check all pages
  {
    const failing: AuditCheckPage[] = allPages
      .filter((p) => p.extraction.meta.charset !== "UTF-8")
      .slice(0, MAX_PAGES_PER_CHECK)
      .map((p) => ({
        url: p.url,
        description: p.extraction.meta.charset
          ? `Charset: ${p.extraction.meta.charset} (should be UTF-8)`
          : "No charset declared",
      }));

    checks.push({
      id: "tech-charset",
      category: "technical",
      title: "Character encoding",
      status: failing.length === 0 ? "pass" : "fail",
      description:
        failing.length === 0
          ? `All pages have UTF-8 character encoding.`
          : `${failing.length} page${failing.length > 1 ? "s" : ""} not using UTF-8 encoding. UTF-8 is the recommended standard.`,
      pages: failing.length > 0 ? failing : undefined,
    });
  }

  return checks;
}
