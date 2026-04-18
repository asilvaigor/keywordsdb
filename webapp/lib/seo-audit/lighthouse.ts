import type {
  LighthouseAuditDetails,
  LighthouseAuditItem,
  LighthouseCoreVital,
  LighthouseError,
  LighthouseResult,
} from "@/lib/seo-audit/types";

const PSI_API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

/* ── PSI internal types ─────────────────────────────────────────── */

type PsiAuditDetailsHeading = {
  key: string;
  label: string;
  valueType?: string;
  subItemsHeading?: { key: string; valueType?: string };
};

type PsiAuditDetails = {
  type: string;
  headings?: PsiAuditDetailsHeading[];
  items?: Array<Record<string, unknown>>;
};

type PsiAudit = {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
  details?: PsiAuditDetails;
};

type PsiResponse = {
  error?: { message: string };
  lighthouseResult?: {
    categories?: {
      performance?: { score: number | null };
    };
    audits?: Record<string, PsiAudit>;
  };
};

/* ── Value formatters ───────────────────────────────────────────── */

function formatCellValue(val: unknown, valueType?: string): string {
  if (val === null || val === undefined) return "";

  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (obj.type === "node") {
      return (obj.nodeLabel as string) || (obj.snippet as string) || "";
    }
    if (obj.type === "source-location") {
      const u = obj.url as string;
      const line = obj.line as number | undefined;
      return line !== undefined ? `${u}:${line}` : u;
    }
    if (obj.type === "link") {
      return (obj.text as string) || (obj.url as string) || "";
    }
    return "";
  }

  const num =
    typeof val === "number"
      ? val
      : typeof val === "string"
        ? Number.parseFloat(val)
        : null;

  if (num !== null && !Number.isNaN(num)) {
    if (valueType === "bytes") {
      if (num >= 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
      if (num >= 1024) return `${Math.round(num / 1024)} KB`;
      return `${num} B`;
    }
    if (valueType === "ms" || valueType === "timespanMs") {
      return num >= 1000
        ? `${(num / 1000).toFixed(1)} s`
        : `${Math.round(num)} ms`;
    }
    if (valueType === "numeric") {
      return num % 1 === 0 ? String(num) : num.toFixed(2);
    }
  }

  return typeof val === "string" ? val : String(val);
}

function parseDetails(
  details: PsiAuditDetails | undefined,
): LighthouseAuditDetails {
  if (!details) return null;
  if (details.type !== "table" && details.type !== "opportunity") return null;

  const headings = (details.headings ?? []).filter((h) => h.key && h.label);
  const items = details.items ?? [];

  if (headings.length === 0 || items.length === 0) return null;

  const rows = items
    .slice(0, 15)
    .map((item) =>
      headings.map((h) => formatCellValue(item[h.key], h.valueType)),
    )
    .filter((row) => row.some((cell) => cell !== ""));

  if (rows.length === 0) return null;

  return { headings: headings.map((h) => h.label), rows };
}

/* ── Helpers ────────────────────────────────────────────────────── */

function metricVital(
  audits: Record<string, PsiAudit>,
  id: string,
  label: string,
): LighthouseCoreVital {
  const audit = audits[id];
  return {
    label,
    value: audit?.displayValue ?? "–",
    score: audit?.score ?? 0,
  };
}

function toItem(audit: PsiAudit): LighthouseAuditItem {
  return {
    id: audit.id,
    title: audit.title,
    description: audit.description,
    score: audit.score,
    displayValue: audit.displayValue,
    details: parseDetails(audit.details),
  };
}

/* ── Main export ────────────────────────────────────────────────── */

export async function fetchLighthouse(
  url: string,
  apiKey: string,
): Promise<LighthouseResult | LighthouseError> {
  const params = new URLSearchParams({
    url,
    strategy: "mobile",
    key: apiKey,
    category: "performance",
  });

  let json: PsiResponse;
  try {
    const res = await fetch(`${PSI_API}?${params}`, {
      signal: AbortSignal.timeout(60_000),
    });
    json = (await res.json()) as PsiResponse;
  } catch (err) {
    return {
      type: "lighthouse-error",
      error: err instanceof Error ? err.message : "Request failed",
    };
  }

  if (json.error) {
    return { type: "lighthouse-error", error: json.error.message };
  }

  const lr = json.lighthouseResult;
  if (!lr?.audits) {
    return { type: "lighthouse-error", error: "No Lighthouse data returned" };
  }

  const audits = lr.audits;
  const perfScore = lr.categories?.performance?.score;

  const OPPORTUNITY_IDS = [
    "render-blocking-resources",
    "unused-css-rules",
    "unused-javascript",
    "uses-optimized-images",
    "uses-webp-images",
    "uses-text-compression",
    "uses-responsive-images",
    "efficient-animated-content",
    "duplicated-javascript",
    "legacy-javascript",
  ];

  const DIAGNOSTIC_IDS = [
    "server-response-time",
    "redirects",
    "bootup-time",
    "mainthread-work-breakdown",
    "dom-size",
    "critical-request-chains",
    "network-requests",
    "third-party-summary",
    "third-party-facades",
    "largest-contentful-paint-element",
    "lcp-lazy-loaded",
    "layout-shift-elements",
    "uses-long-cache-ttl",
    "total-byte-weight",
    "no-document-write",
    "uses-passive-event-listeners",
  ];

  const opportunities: LighthouseAuditItem[] = OPPORTUNITY_IDS.flatMap((id) => {
    const audit = audits[id];
    return audit && audit.score !== null && audit.score < 0.9
      ? [toItem(audit)]
      : [];
  });

  const diagnostics: LighthouseAuditItem[] = DIAGNOSTIC_IDS.flatMap((id) => {
    const audit = audits[id];
    return audit && audit.score !== null && audit.score < 0.9
      ? [toItem(audit)]
      : [];
  });

  return {
    type: "lighthouse",
    performanceScore: Math.round((perfScore ?? 0) * 100),
    metrics: {
      fcp: metricVital(audits, "first-contentful-paint", "FCP"),
      lcp: metricVital(audits, "largest-contentful-paint", "LCP"),
      tbt: metricVital(audits, "total-blocking-time", "TBT"),
      cls: metricVital(audits, "cumulative-layout-shift", "CLS"),
      si: metricVital(audits, "speed-index", "Speed Index"),
      tti: metricVital(audits, "interactive", "TTI"),
    },
    opportunities,
    diagnostics,
  };
}
