import {
  CheckCircle2,
  CircleAlert,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { AuditResult, LighthouseResult } from "@/lib/seo-audit/types";
import { cn } from "@/lib/utils";

// Half-circle arc: center (60,66), radius 52 → path length = π*52
const HALF_CIRC = Math.PI * 52;

function scoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-primary";
  return "text-destructive";
}

function ScoreGauge({
  score,
  label,
  subtitle,
  loading = false,
  unavailable = false,
  gradientId,
}: {
  score: number;
  label: string;
  subtitle?: string;
  loading?: boolean;
  unavailable?: boolean;
  gradientId: string;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (loading || unavailable) return;
    const duration = 1000;
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [score, loading, unavailable]);

  const dashOffset = HALF_CIRC * (1 - animatedScore / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/*
          viewBox 0 0 120 72: center at (60,66), radius 52.
          Arc M 8,66 A 52,52 0 0,1 112,66 → upper semicircle (dome).
          strokeWidth 8 → stroke bottom at y≈70, within viewBox.
        */}
        <svg
          role="img"
          aria-label={`${label}: ${
            loading
              ? "loading"
              : unavailable
                ? "unavailable"
                : `${animatedScore} out of 100`
          }`}
          viewBox="0 0 120 72"
          width={120}
          height={72}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-destructive)" />
              <stop offset="50%" stopColor="var(--color-primary)" />
              <stop offset="100%" stopColor="var(--color-success)" />
            </linearGradient>
          </defs>
          {/* Track */}
          <path
            d="M 8,66 A 52,52 0 0,1 112,66"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className="stroke-muted"
          />
          {/* Filled arc */}
          {!loading && !unavailable && (
            <path
              d="M 8,66 A 52,52 0 0,1 112,66"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={HALF_CIRC}
              strokeDashoffset={dashOffset}
              stroke={`url(#${gradientId})`}
            />
          )}
        </svg>
        {/* Score — sits in the open pocket of the arch */}
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          {loading ? (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin mb-3" />
          ) : unavailable ? (
            <span className="text-base font-bold text-muted-foreground/40">
              –
            </span>
          ) : (
            <div className="flex items-baseline gap-0.5">
              <span
                className={cn(
                  "text-lg font-bold tabular-nums",
                  scoreColor(score),
                )}
              >
                {animatedScore}
              </span>
              <span className="text-[9px] text-muted-foreground">/100</span>
            </div>
          )}
        </div>
      </div>
      <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase leading-none">
        {label}
      </p>
      <p className="text-[10px] text-muted-foreground/60 leading-tight mt-0.5 text-center">
        {loading ? "Running…" : unavailable ? "Unavailable" : (subtitle ?? " ")}
      </p>
    </div>
  );
}

export function AuditSummary({
  result,
  lighthouse,
  lighthouseLoading,
}: {
  result: AuditResult;
  lighthouse: LighthouseResult | null;
  lighthouseLoading: boolean;
}) {
  const passed = result.categories.reduce(
    (n, c) => n + c.checks.filter((ch) => ch.status === "pass").length,
    0,
  );
  const errors = result.categories.reduce(
    (n, c) => n + c.checks.filter((ch) => ch.status === "fail").length,
    0,
  );
  const warnings = result.categories.reduce(
    (n, c) => n + c.checks.filter((ch) => ch.status === "warn").length,
    0,
  );

  let displayUrl = result.url;
  try {
    const u = new URL(result.url);
    displayUrl = u.hostname + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    // keep as-is
  }

  return (
    <div className="space-y-4">
      {/* URL info + score gauges side by side */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 pt-1">
          <p className="text-sm text-muted-foreground">Audit results for</p>
          <p className="font-semibold truncate">{displayUrl}</p>
          <p className="text-sm text-muted-foreground">
            {result.pagesCrawled} page{result.pagesCrawled > 1 ? "s" : ""}{" "}
            crawled in {(result.crawlTimeMs / 1000).toFixed(1)}s
          </p>
        </div>
        <div className="flex items-start gap-6 shrink-0">
          <ScoreGauge
            score={result.score}
            label="SEO Score"
            subtitle="meta · content · links"
            gradientId="seo-gauge-gradient"
          />
          <ScoreGauge
            score={lighthouse?.performanceScore ?? 0}
            label="Performance"
            subtitle="via Lighthouse"
            loading={lighthouseLoading}
            unavailable={!lighthouse && !lighthouseLoading}
            gradientId="perf-gauge-gradient"
          />
        </div>
      </div>

      {/* Error / warning / passed counts */}
      <div className="flex items-center rounded-lg border bg-background py-3 divide-x">
        <div className="flex-1 flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1.5">
            <CircleAlert className="h-3.5 w-3.5 text-destructive" />
            <span className="text-lg font-bold tabular-nums text-destructive">
              {errors}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {errors === 1 ? "Error" : "Errors"}
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1.5">
            <TriangleAlert className="h-3.5 w-3.5 text-primary" />
            <span className="text-lg font-bold tabular-nums text-primary">
              {warnings}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {warnings === 1 ? "Warning" : "Warnings"}
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span className="text-lg font-bold tabular-nums text-success">
              {passed}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Passed</span>
        </div>
      </div>
    </div>
  );
}
