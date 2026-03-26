import { CheckCircle2, CircleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { AuditResult } from "@/lib/seo-audit/types";
import { cn } from "@/lib/utils";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 50) return "text-yellow-500";
  return "text-red-500";
}

function scoreStroke(score: number) {
  if (score >= 80) return "stroke-emerald-500";
  if (score >= 50) return "stroke-yellow-500";
  return "stroke-red-500";
}

function scoreTrack(score: number) {
  if (score >= 80) return "stroke-emerald-500/15";
  if (score >= 50) return "stroke-yellow-500/15";
  return "stroke-red-500/15";
}

function scoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Great";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Work";
  return "Poor";
}

function ScoreRing({
  score,
  size = 180,
  className,
}: {
  score: number;
  size?: number;
  className?: string;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Animate from 0 to score
    const duration = 1000;
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - (1 - progress) ** 3;
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [score]);

  const offset = CIRCUMFERENCE - (animatedScore / 100) * CIRCUMFERENCE;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          role="img"
          aria-label={`SEO Score: ${animatedScore} out of 100`}
          viewBox="0 0 120 120"
          width={size}
          height={size}
          className="-rotate-90"
        >
          {/* Track */}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            className={scoreTrack(score)}
          />
          {/* Progress arc */}
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className={cn(
              scoreStroke(score),
              "transition-[stroke-dashoffset] duration-1000",
            )}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn("text-4xl font-bold tabular-nums", scoreColor(score))}
          >
            {animatedScore}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            / 100
          </span>
        </div>
      </div>
      <span className={cn("text-sm font-semibold", scoreColor(score))}>
        {scoreLabel(score)}
      </span>
    </div>
  );
}

export function AuditSummary({ result }: { result: AuditResult }) {
  const totalChecks = result.categories.reduce(
    (n, c) => n + c.checks.length,
    0,
  );
  const passed = result.categories.reduce(
    (n, c) => n + c.checks.filter((ch) => ch.status === "pass").length,
    0,
  );
  const issues = totalChecks - passed;

  let displayUrl = result.url;
  try {
    const u = new URL(result.url);
    displayUrl = u.hostname + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    // keep as-is
  }

  return (
    <div className="flex flex-row items-center gap-4 sm:gap-8 w-full">
      {/* Score ring */}
      <div className="shrink-0">
        <ScoreRing score={result.score} size={110} className="sm:hidden" />
        <ScoreRing score={result.score} size={160} className="hidden sm:flex" />
      </div>

      {/* URL info + stats cards stacked */}
      <div className="flex-1 min-w-0 flex flex-col gap-3 sm:gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Audit results for</p>
          <p className="font-semibold truncate">{displayUrl}</p>
          <p className="text-xs text-muted-foreground">
            {result.pagesCrawled} page{result.pagesCrawled > 1 ? "s" : ""}{" "}
            crawled in {(result.crawlTimeMs / 1000).toFixed(1)}s
          </p>
        </div>

        {/* Stats cards */}
        <div className="flex gap-3">
          <Card
            size="sm"
            className="h-20 sm:h-24 justify-center flex-1 overflow-hidden"
          >
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="rounded-full sm:bg-red-500/10 sm:p-2">
                  <CircleAlert className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums leading-tight">
                    {issues}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {issues === 1 ? "Issue" : "Issues"}
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex mt-2.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-500 transition-all duration-700"
                  style={{
                    width: `${totalChecks > 0 ? (issues / totalChecks) * 100 : 0}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <Card
            size="sm"
            className="h-20 sm:h-24 justify-center flex-1 overflow-hidden"
          >
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="rounded-full sm:bg-emerald-500/10 sm:p-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums leading-tight">
                    {passed}
                  </p>
                  <p className="text-xs text-muted-foreground">Passed</p>
                </div>
              </div>
              <div className="hidden sm:flex mt-2.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{
                    width: `${totalChecks > 0 ? (passed / totalChecks) * 100 : 0}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
