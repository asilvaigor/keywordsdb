import { ChevronDown, ExternalLink, Gauge, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  LighthouseAuditDetails,
  LighthouseAuditItem,
  LighthouseCoreVital,
  LighthouseResult,
} from "@/lib/seo-audit/types";
import { cn } from "@/lib/utils";

/* ── Helpers ─────────────────────────────────────────────────────── */

const METRIC_INFO: Record<string, string> = {
  FCP: "First Contentful Paint — time until the browser renders the first bit of text or image. Measures perceived load speed.",
  LCP: "Largest Contentful Paint — time until the largest visible element loads. Google Core Web Vital; aim for under 2.5 s.",
  TBT: "Total Blocking Time — total time the main thread was blocked between FCP and TTI, preventing user input.",
  CLS: "Cumulative Layout Shift — measures unexpected layout shifts during load. Google Core Web Vital; aim for under 0.1.",
  "Speed Index":
    "Speed Index — how quickly content is visually populated during page load. Lower is better.",
  TTI: "Time to Interactive — time until the page is fully interactive and reliably responds to user input.",
};

function metricColor(score: number) {
  if (score >= 0.9) return "text-success";
  if (score >= 0.5) return "text-primary";
  return "text-destructive";
}

function metricBg(score: number) {
  if (score >= 0.9) return "bg-success/10 border-success/20";
  if (score >= 0.5) return "bg-primary/10 border-primary/20";
  return "bg-destructive/10 border-destructive/20";
}

function auditScoreColor(score: number | null) {
  if (score === null) return "text-muted-foreground";
  if (score >= 0.9) return "text-success";
  if (score >= 0.5) return "text-primary";
  return "text-destructive";
}

/* ── Details table ───────────────────────────────────────────────── */

function DetailsTable({ details }: { details: LighthouseAuditDetails }) {
  if (!details || details.rows.length === 0) return null;

  return (
    <div className="mt-3 overflow-x-auto rounded-md border">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b bg-muted/30">
            {details.headings.map((h) => (
              <th
                key={h}
                className="text-left px-3 py-1.5 text-muted-foreground font-medium whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {details.rows.map((row, i) => (
            <tr
              key={row[0] ?? String(i)}
              className="border-b last:border-0 hover:bg-muted/20"
            >
              {row.map((cell, j) => (
                <td
                  key={details.headings[j] ?? String(j)}
                  className="px-3 py-1.5 font-mono max-w-64 truncate"
                  title={cell}
                >
                  {cell || "–"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Metric card ─────────────────────────────────────────────────── */

function MetricCard({ vital }: { vital: LighthouseCoreVital }) {
  const info = METRIC_INFO[vital.label];

  return (
    <div
      className={cn(
        "rounded-lg border p-3 flex flex-col gap-1",
        metricBg(vital.score),
      )}
    >
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground font-medium">
          {vital.label}
        </span>
        {info && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground/50 shrink-0 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-56 text-xs">
                {info}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <span
        className={cn(
          "text-xl font-bold tabular-nums",
          metricColor(vital.score),
        )}
      >
        {vital.value}
      </span>
    </div>
  );
}

/* ── Audit row ───────────────────────────────────────────────────── */

function AuditRow({ item }: { item: LighthouseAuditItem }) {
  const [open, setOpen] = useState(false);
  const cleanDescription = item.description.replace(
    /\[([^\]]+)\]\([^)]+\)/g,
    "$1",
  );
  const hasExtra = !!(cleanDescription || item.details);

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
          hasExtra && "hover:bg-muted/30 cursor-pointer",
        )}
        onClick={() => hasExtra && setOpen(!open)}
        disabled={!hasExtra}
      >
        <span
          className={cn(
            "shrink-0 text-xs font-bold w-4 text-center",
            auditScoreColor(item.score),
          )}
        >
          {item.score !== null ? `${Math.round(item.score * 100)}` : "-"}
        </span>
        <span className="flex-1 text-sm font-medium">{item.title}</span>
        {item.displayValue && (
          <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
            {item.displayValue}
          </span>
        )}
        {hasExtra && (
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-0.5 transition-transform",
              open && "rotate-180",
            )}
          />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pl-13">
          <p className="text-sm text-muted-foreground">{cleanDescription}</p>
          <DetailsTable details={item.details ?? null} />
        </div>
      )}
    </div>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────── */

export function LighthouseViewSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Performance</h2>
        </div>
        <Skeleton className="h-3.5 w-44" />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <div key={i} className="rounded-lg border p-3 space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-2.5 w-10" />
          </div>
        ))}
      </div>

      {/* Opportunities block */}
      <div className="rounded-lg border bg-card">
        <div className="px-4 py-2.5 border-b space-y-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-52" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
            key={i}
            className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
          >
            <Skeleton className="h-5 w-8 shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main view ───────────────────────────────────────────────────── */

export function LighthouseView({ result }: { result: LighthouseResult }) {
  const metrics = [
    result.metrics.fcp,
    result.metrics.lcp,
    result.metrics.tbt,
    result.metrics.cls,
    result.metrics.si,
    result.metrics.tti,
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Performance</h2>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <ExternalLink className="h-3 w-3 shrink-0" />
          Powered by{" "}
          <Link
            href="https://pagespeed.web.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            Google PageSpeed Insights
          </Link>
        </p>
      </div>

      {/* Core metrics grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {metrics.map((m) => (
          <MetricCard key={m.label} vital={m} />
        ))}
      </div>

      {/* Opportunities */}
      {result.opportunities.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="px-4 py-2.5 border-b">
            <p className="text-sm font-semibold">Opportunities</p>
            <p className="text-xs text-muted-foreground">
              Potential improvements to load performance
            </p>
          </div>
          {result.opportunities.map((item) => (
            <AuditRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Diagnostics */}
      {result.diagnostics.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="px-4 py-2.5 border-b">
            <p className="text-sm font-semibold">Diagnostics</p>
            <p className="text-xs text-muted-foreground">
              Additional information about page performance
            </p>
          </div>
          {result.diagnostics.map((item) => (
            <AuditRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
