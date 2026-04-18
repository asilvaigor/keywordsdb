import type {
  AuditCategory,
  AuditCategoryResult,
  AuditCheck,
  AuditStatus,
} from "@/lib/seo-audit/types";

const STATUS_SCORE: Record<AuditStatus, number> = {
  pass: 1,
  warn: 0.5,
  fail: 0,
};

export function calculateCategoryScore(checks: AuditCheck[]): number {
  if (checks.length === 0) return 100;
  const total = checks.reduce((sum, c) => sum + STATUS_SCORE[c.status], 0);
  return Math.round((total / checks.length) * 100);
}

export function calculateOverallScore(
  categories: AuditCategoryResult[],
  weights: Record<AuditCategory, number>,
): number {
  let weighted = 0;
  let totalWeight = 0;

  for (const cat of categories) {
    const w = weights[cat.category] ?? 0;
    weighted += cat.score * w;
    totalWeight += w;
  }

  return totalWeight > 0 ? Math.round(weighted / totalWeight) : 0;
}

export function buildCategoryResult(
  category: AuditCategory,
  label: string,
  checks: AuditCheck[],
): AuditCategoryResult {
  return {
    category,
    label,
    score: calculateCategoryScore(checks),
    checks,
  };
}
