"use client";

import { ArrowLeft, CircleAlert, Globe, Search, Square } from "lucide-react";
import {
  CategorySection,
  IssuesView,
} from "@/components/seo-audit/audit-results";
import { AuditSummary } from "@/components/seo-audit/audit-summary";
import { useSeoAudit } from "@/components/seo-audit/use-seo-audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AuditProgress } from "@/lib/seo-audit/types";
import { cn } from "@/lib/utils";
import LlmPromptSection from "./llm-prompt-section";

export function CrawlProgress({ progress }: { progress: AuditProgress }) {
  const pct = Math.round(
    (progress.pagesScanned / Math.max(progress.totalPages, 1)) * 100,
  );

  let displayUrl = progress.currentUrl;
  try {
    const u = new URL(progress.currentUrl);
    displayUrl = u.pathname === "/" ? u.hostname : `${u.hostname}${u.pathname}`;
  } catch {
    // keep as-is
  }

  return (
    <div className="mt-10 sm:mt-8 flex flex-col items-center gap-4 animate-fade-in-up">
      <div className="text-center space-y-2 w-full max-w-md">
        <p className="text-sm font-medium">
          Scanning page {progress.pagesScanned} of {progress.totalPages}...
        </p>
        <p className="text-xs text-muted-foreground truncate px-4">
          {displayUrl}
        </p>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function SeoAudit() {
  const {
    url,
    setUrl,
    maxPages,
    setMaxPages,
    result,
    progress,
    error,
    isRunning,
    handleSubmit,
    handleStop,
  } = useSeoAudit();

  const hasResults = result !== null;

  return (
    <section
      className={cn(
        "container max-w-3xl mx-auto px-6 sm:px-4 transition-all duration-500",
        hasResults
          ? "py-12 sm:py-8"
          : "flex flex-col justify-center min-h-[calc(100dvh-3.5rem)]",
      )}
    >
      {/* Hero — only shown before results */}
      {!hasResults && (
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-4 sm:mb-3">
            Free SEO Tool
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-8 sm:mb-3">
            SEO Audit Tool
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Enter any URL to get a comprehensive SEO audit. We&apos;ll crawl up
            to 1000 pages and run 20+ checks on meta tags, content, technical
            setup, links, and performance.
          </p>
        </div>
      )}

      {/* Search bar */}
      {!hasResults && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap gap-2 items-center"
        >
          <div className="relative flex-1 min-w-0">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter a URL (e.g. keywordsdb.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-10 pl-9 text-sm"
              disabled={isRunning}
            />
          </div>
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <Select
              value={String(maxPages)}
              onValueChange={(v) => setMaxPages(Number(v))}
              disabled={isRunning}
            >
              <SelectTrigger className="data-[size=default]:h-10 w-30">
                <SelectValue>{maxPages} pages</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {[25, 50, 100, 250, 500, 1000].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} pages
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isRunning ? (
              <Button
                key="stop"
                type="button"
                size="lg"
                variant="destructive"
                onClick={handleStop}
                className="h-10 flex-1 sm:flex-none"
              >
                <Square className="h-4 w-4" data-icon="inline-start" />
                Stop
              </Button>
            ) : (
              <Button
                key="audit"
                type="submit"
                size="lg"
                disabled={!url.trim()}
                className="h-10 flex-1 sm:flex-none"
              >
                <Search className="h-4 w-4" data-icon="inline-start" />
                Audit
              </Button>
            )}
          </div>
        </form>
      )}

      {/* Back button */}
      {hasResults && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 sm:mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Progress */}
      {isRunning && progress && !result && (
        <CrawlProgress progress={progress} />
      )}

      {/* Results */}
      {result && (
        <div className="mb-12 sm:mb-20 animate-fade-in-up space-y-8">
          {/* Summary */}
          <AuditSummary result={result} />

          {/* Issues */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <CircleAlert className="h-4.5 w-4.5 text-muted-foreground" />
              Issues
            </h2>
            <IssuesView result={result} />
          </div>

          {/* LLM Prompt */}
          <LlmPromptSection result={result} />

          {/* Detailed results by category */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">All Checks</h2>
            {result.categories.map((cat) => (
              <CategorySection key={cat.category} category={cat} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
