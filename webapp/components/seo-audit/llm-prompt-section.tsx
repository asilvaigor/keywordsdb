"use client";

import { CheckCircle2, Copy, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AuditResult } from "@/lib/seo-audit/types";

function generateLlmPrompt(result: AuditResult): string {
  const failedChecks = result.categories.flatMap((cat) =>
    cat.checks
      .filter((c) => c.status === "fail")
      .map((c) => ({
        title: c.title,
        category: cat.label,
        description: c.description,
        details: c.details,
        pages: c.pages,
      })),
  );

  if (failedChecks.length === 0) {
    return `# SEO Audit Results for ${result.url}\n\nAll checks passed with a score of ${result.score}/100. No issues to fix.`;
  }

  let prompt = `# SEO Audit Fix Request\n\n`;
  prompt += `I ran an SEO audit on **${result.url}** and it scored **${result.score}/100**.\n\n`;
  prompt += `Please help me fix the following **${failedChecks.length} issue${failedChecks.length > 1 ? "s" : ""}** found during the audit:\n\n`;

  for (let i = 0; i < failedChecks.length; i++) {
    const c = failedChecks[i];
    prompt += `## ${i + 1}. ${c.title} (${c.category})\n`;
    prompt += `${c.description}\n`;
    if (c.details) {
      const detailStr = Array.isArray(c.details)
        ? c.details.join("\n")
        : c.details;
      prompt += `\`\`\`\n${detailStr}\n\`\`\`\n`;
    }
    if (c.pages && c.pages.length > 0) {
      prompt += "\nAffected pages:\n";
      for (const page of c.pages) {
        prompt += `- ${page.url} — ${page.description}\n`;
      }
    }
    if (i < failedChecks.length - 1) {
      prompt += "\n";
    }
  }

  return prompt;
}

function LlmPromptSection({ result }: { result: AuditResult }) {
  const [copied, setCopied] = useState(false);
  const prompt = generateLlmPrompt(result);

  const issues = result.categories.flatMap((cat) =>
    cat.checks.filter((c) => c.status === "fail"),
  );
  if (issues.length === 0) return null;

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
