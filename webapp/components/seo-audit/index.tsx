"use client";

import { CircleAlert, Globe, Loader2, Search } from "lucide-react";
import {
  CategorySection,
  IssuesView,
} from "@/components/seo-audit/audit-results";
import { AuditSummary } from "@/components/seo-audit/audit-summary";
import { useSeoAudit } from "@/components/seo-audit/use-seo-audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const { url, setUrl, result, progress, error, isRunning, handleSubmit } =
    useSeoAudit();

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
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <div className="relative flex-1">
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
        <Button type="submit" size="lg" disabled={isRunning || !url.trim()}>
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" data-icon="inline-start" />
          )}
          Audit
        </Button>
      </form>

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
        <div className="my-8 sm:my-6 animate-fade-in-up space-y-8">
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
