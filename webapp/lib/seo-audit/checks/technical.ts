import type {
  AuditCheck,
  CrawlData,
  PageExtraction,
} from "@/lib/seo-audit/types";

export function checkTechnical(
  primaryPage: PageExtraction,
  crawlData: CrawlData,
): AuditCheck[] {
  const checks: AuditCheck[] = [];

  // 1. HTTPS
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

  // 2. robots.txt
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

  // 3. sitemap.xml
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

  // 4. Structured data
  const { jsonLd, microdata } = primaryPage.structuredData;
  checks.push({
    id: "tech-structured-data",
    category: "technical",
    title: "Structured data",
    status: jsonLd || microdata ? "pass" : "fail",
    description:
      jsonLd || microdata
        ? `Structured data found: ${[jsonLd && "JSON-LD", microdata && "Microdata"].filter(Boolean).join(", ")}. This can enhance search result appearance with rich snippets.`
        : "No structured data (JSON-LD or Microdata) found. Adding structured data can improve how your page appears in search results.",
  });

  // 5. HTML5 Doctype
  checks.push({
    id: "tech-doctype",
    category: "technical",
    title: "HTML5 Doctype",
    status: primaryPage.meta.doctype ? "pass" : "fail",
    description: primaryPage.meta.doctype
      ? "Page uses the HTML5 doctype declaration."
      : "Missing or non-HTML5 doctype. Use <!DOCTYPE html> as the first line of your HTML.",
  });

  // 6. Character encoding
  const charset = primaryPage.meta.charset;
  checks.push({
    id: "tech-charset",
    category: "technical",
    title: "Character encoding",
    status: charset === "UTF-8" ? "pass" : "fail",
    description:
      charset === "UTF-8"
        ? "Character encoding is set to UTF-8."
        : charset
          ? `Character encoding is set to ${charset}. UTF-8 is the recommended standard.`
          : 'No character encoding declared. Add <meta charset="UTF-8"> to avoid rendering issues.',
  });

  return checks;
}
