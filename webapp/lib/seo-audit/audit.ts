import { checkContent } from "@/lib/seo-audit/checks/content";
import { checkLinks } from "@/lib/seo-audit/checks/links";
import { checkMeta } from "@/lib/seo-audit/checks/meta";
import { checkPerformance } from "@/lib/seo-audit/checks/performance";
import { checkTechnical } from "@/lib/seo-audit/checks/technical";
import { crawlSite } from "@/lib/seo-audit/crawl";
import { extractPage } from "@/lib/seo-audit/extract";
import {
  buildCategoryResult,
  calculateOverallScore,
} from "@/lib/seo-audit/score";
import type { AuditResult } from "@/lib/seo-audit/types";

export async function runAudit(
  url: string,
  maxPages: number,
  onProgress: (
    pagesScanned: number,
    totalPages: number,
    currentUrl: string,
  ) => void,
): Promise<AuditResult> {
  const start = Date.now();

  // Phase 1: Crawl
  const crawlData = await crawlSite(url, maxPages, onProgress);

  if (crawlData.pages.length === 0) {
    throw new Error(
      "Could not fetch any pages from this site. Please check the URL and try again.",
    );
  }

  // Phase 2: Extract data from all crawled pages
  const allPages = crawlData.pages.map((page) => ({
    url: page.finalUrl,
    extraction: extractPage(page.html, page.finalUrl),
  }));

  const primaryPage = allPages[0].extraction;
  const primaryUrl = allPages[0].url;

  // Phase 3: Run all checks
  const metaChecks = await checkMeta(primaryPage, primaryUrl, allPages);
  const contentChecks = checkContent(allPages);
  const technicalChecks = checkTechnical(allPages, crawlData);
  const linkChecks = await checkLinks(allPages, crawlData);
  const perfChecks = checkPerformance(crawlData.pages);

  // Phase 4: Build category results and overall score
  const categories = [
    buildCategoryResult("meta", "Meta Tags", metaChecks),
    buildCategoryResult("content", "Content", contentChecks),
    buildCategoryResult("technical", "Technical", technicalChecks),
    buildCategoryResult("links", "Links", linkChecks),
    buildCategoryResult("performance", "Performance", perfChecks),
  ];

  const weights = {
    meta: 0.3,
    content: 0.1,
    technical: 0.25,
    links: 0.25,
    performance: 0.1,
  } as const;

  const score = calculateOverallScore(categories, weights);

  return {
    type: "result",
    url,
    score,
    categories,
    pagesCrawled: crawlData.pages.length,
    crawlTimeMs: Date.now() - start,
  };
}
