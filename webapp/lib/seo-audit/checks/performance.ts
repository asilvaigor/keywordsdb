import type {
  AuditCheck,
  AuditCheckPage,
  CrawledPage,
} from "@/lib/seo-audit/types";

const MAX_PAGES_PER_CHECK = 10;

export function checkPerformance(pages: CrawledPage[]): AuditCheck[] {
  const checks: AuditCheck[] = [];

  if (pages.length === 0) return checks;

  // 1. Response time
  const avgResponseTime =
    pages.reduce((sum, p) => sum + p.responseTimeMs, 0) / pages.length;
  const responseStatus = avgResponseTime < 1000 ? "pass" : "fail";

  const slowPages: AuditCheckPage[] = pages
    .filter((p) => p.responseTimeMs >= 1000)
    .sort((a, b) => b.responseTimeMs - a.responseTimeMs)
    .slice(0, MAX_PAGES_PER_CHECK)
    .map((p) => ({
      url: p.finalUrl,
      description: `${(p.responseTimeMs / 1000).toFixed(1)}s response time`,
    }));

  checks.push({
    id: "perf-response-time",
    category: "performance",
    title: "Response time",
    status: responseStatus,
    description:
      responseStatus === "pass"
        ? `Average server response time is ${Math.round(avgResponseTime)}ms across ${pages.length} page${pages.length > 1 ? "s" : ""} — fast.`
        : `Average server response time is ${(avgResponseTime / 1000).toFixed(1)}s across ${pages.length} page${pages.length > 1 ? "s" : ""}. Aim for under 1 second.`,
    pages: slowPages.length > 0 ? slowPages : undefined,
  });

  // 2. Page size
  const avgSize = pages.reduce((sum, p) => sum + p.byteSize, 0) / pages.length;
  const avgSizeKB = avgSize / 1024;
  const avgSizeMB = avgSize / (1024 * 1024);
  const sizeStatus = avgSize < 1024 * 1024 ? "pass" : "fail";

  const sizeLabel =
    avgSizeMB >= 1
      ? `${avgSizeMB.toFixed(1)} MB`
      : `${Math.round(avgSizeKB)} KB`;

  const largePages: AuditCheckPage[] = pages
    .filter((p) => p.byteSize >= 1024 * 1024)
    .sort((a, b) => b.byteSize - a.byteSize)
    .slice(0, MAX_PAGES_PER_CHECK)
    .map((p) => {
      const mb = p.byteSize / (1024 * 1024);
      const kb = p.byteSize / 1024;
      const label = mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(kb)} KB`;
      return { url: p.finalUrl, description: `Page size: ${label}` };
    });

  checks.push({
    id: "perf-page-size",
    category: "performance",
    title: "Page size",
    status: sizeStatus,
    description:
      sizeStatus === "pass"
        ? `Average page size is ${sizeLabel} across ${pages.length} page${pages.length > 1 ? "s" : ""} — within acceptable limits.`
        : `Average page size is ${sizeLabel} across ${pages.length} page${pages.length > 1 ? "s" : ""}. Large pages can slow down loading. Aim for under 1 MB.`,
    pages: largePages.length > 0 ? largePages : undefined,
  });

  return checks;
}
