"use client";

import { CheckCircle2, Copy, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AuditResult, LighthouseResult } from "@/lib/seo-audit/types";

type CheckEntry = {
  title: string;
  category: string;
  description: string;
  details?: string | string[];
  pages?: { url: string; description: string }[];
};

function collectChecks(
  result: AuditResult,
  status: "fail" | "warn",
): CheckEntry[] {
  return result.categories.flatMap((cat) =>
    cat.checks
      .filter((c) => c.status === status)
      .map((c) => ({
        title: c.title,
        category: cat.label,
        description: c.description,
        details: c.details,
        pages: c.pages,
      })),
  );
}

function formatChecks(checks: CheckEntry[]): string {
  return checks
    .map((c, i) => {
      let entry = `### ${i + 1}. ${c.title} (${c.category})\n`;
      entry += `${c.description}\n`;
      if (c.details) {
        const detailStr = Array.isArray(c.details)
          ? c.details.join("\n")
          : c.details;
        entry += `\`\`\`\n${detailStr}\n\`\`\`\n`;
      }
      if (c.pages && c.pages.length > 0) {
        entry += "\nAffected pages:\n";
        for (const page of c.pages) {
          entry += `- ${page.url} — ${page.description}\n`;
        }
      }
      return entry;
    })
    .join("\n");
}

function generateLlmPrompt(
  result: AuditResult,
  lighthouse: LighthouseResult | null,
): string {
  const failedChecks = collectChecks(result, "fail");
  const warningChecks = collectChecks(result, "warn");

  if (failedChecks.length === 0 && warningChecks.length === 0 && !lighthouse) {
    return `# SEO Audit Results for ${result.url}\n\nAll checks passed with a score of ${result.score}/100. No issues to fix.`;
  }

  let prompt = `# SEO Audit Fix Request\n\n`;
  prompt += `I ran an SEO audit on **${result.url}** and it scored **${result.score}/100**.\n\n`;

  if (failedChecks.length > 0 || warningChecks.length > 0) {
    prompt += `Please help me fix the following **${failedChecks.length} issue${failedChecks.length > 1 ? "s" : ""}** and **${warningChecks.length} warning${warningChecks.length > 1 ? "s" : ""}** found during the audit:\n\n`;

    if (failedChecks.length > 0) {
      prompt += `## SEO Issues\n\n${formatChecks(failedChecks)}`;
    }

    if (warningChecks.length > 0) {
      prompt += `\n## SEO Warnings\n\n${formatChecks(warningChecks)}`;
    }
  }

  if (lighthouse) {
    prompt += `\n## Performance (Lighthouse — mobile)\n\n`;
    prompt += `Overall performance score: **${lighthouse.performanceScore}/100**\n\n`;
    prompt += `### Core Metrics\n`;
    const m = lighthouse.metrics;
    prompt += `| Metric | Value |\n|---|---|\n`;
    for (const metric of [m.fcp, m.lcp, m.tbt, m.cls, m.si, m.tti]) {
      prompt += `| ${metric.label} | ${metric.value} |\n`;
    }

    if (lighthouse.opportunities.length > 0) {
      prompt += `\n### Opportunities\n\n`;
      for (const item of lighthouse.opportunities) {
        prompt += `**${item.title}**`;
        if (item.displayValue) prompt += ` — ${item.displayValue}`;
        prompt += `\n${item.description.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")}\n`;
        if (item.details && item.details.rows.length > 0) {
          prompt += `| ${item.details.headings.join(" | ")} |\n`;
          prompt += `| ${item.details.headings.map(() => "---").join(" | ")} |\n`;
          for (const row of item.details.rows) {
            prompt += `| ${row.join(" | ")} |\n`;
          }
        }
        prompt += "\n";
      }
    }

    if (lighthouse.diagnostics.length > 0) {
      prompt += `\n### Diagnostics\n\n`;
      for (const item of lighthouse.diagnostics) {
        prompt += `**${item.title}**`;
        if (item.displayValue) prompt += ` — ${item.displayValue}`;
        prompt += `\n${item.description.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")}\n`;
        if (item.details && item.details.rows.length > 0) {
          prompt += `| ${item.details.headings.join(" | ")} |\n`;
          prompt += `| ${item.details.headings.map(() => "---").join(" | ")} |\n`;
          for (const row of item.details.rows) {
            prompt += `| ${row.join(" | ")} |\n`;
          }
        }
        prompt += "\n";
      }
    }
  }

  return prompt;
}

function LlmPromptSection({
  result,
  lighthouse,
}: {
  result: AuditResult;
  lighthouse: LighthouseResult | null;
}) {
  const [copied, setCopied] = useState(false);
  const prompt = generateLlmPrompt(result, lighthouse);

  const issues = result.categories.flatMap((cat) =>
    cat.checks.filter((c) => c.status === "fail"),
  );
  const warnings = result.categories.flatMap((cat) =>
    cat.checks.filter((c) => c.status === "warn"),
  );
  if (issues.length === 0 && warnings.length === 0 && !lighthouse) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Sparkles className="h-4.5 w-4.5 text-muted-foreground" />
        Fix with AI
      </h2>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Copy this prompt and paste it into your favourite AI assistant to
              get step-by-step fixes for all the issues found.
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <Button variant="default" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div>
          <pre className="p-4 text-sm font-mono leading-relaxed whitespace-pre-wrap wrap-break-word max-h-80 overflow-y-auto text-muted-foreground bg-black">
            {prompt}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default LlmPromptSection;
