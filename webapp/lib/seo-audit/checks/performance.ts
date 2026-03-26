import type { AuditCheck, CrawledPage } from "@/lib/seo-audit/types";

export function checkPerformance(pages: CrawledPage[]): AuditCheck[] {
  const checks: AuditCheck[] = [];

  if (pages.length === 0) return checks;

  // 1. Response time
  const avgResponseTime =
    pages.reduce((sum, p) => sum + p.responseTimeMs, 0) / pages.length;
  const responseStatus = avgResponseTime < 1000 ? "pass" : "fail";

  checks.push({
    id: "perf-response-time",
    category: "performance",
    title: "Response time",
    status: responseStatus,
    description:
      responseStatus === "pass"
        ? `Average server response time is ${Math.round(avgResponseTime)}ms — fast.`
        : `Average server response time is ${(avgResponseTime / 1000).toFixed(1)}s. Aim for under 1 second for optimal user experience.`,
    details: `Based on ${pages.length} page${pages.length > 1 ? "s" : ""} crawled`,
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

  checks.push({
    id: "perf-page-size",
    category: "performance",
    title: "Page size",
    status: sizeStatus,
    description:
      sizeStatus === "pass"
        ? `Average page size is ${sizeLabel} — within acceptable limits.`
        : `Average page size is ${sizeLabel}. Large pages can slow down loading. Aim for under 1 MB.`,
    details: `Based on ${pages.length} page${pages.length > 1 ? "s" : ""} crawled`,
  });

  return checks;
}
