import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  FileText,
  Gauge,
  Link2,
  Shield,
  Tag,
} from "lucide-react";
import { useState } from "react";
import type {
  AuditCategoryResult,
  AuditCheck,
  AuditResult,
  AuditStatus,
} from "@/lib/seo-audit/types";
import { cn } from "@/lib/utils";

/* ── Status helpers ─────────────────────────────────────────────── */

function StatusIcon({
  status,
  className,
}: {
  status: AuditStatus;
  className?: string;
}) {
  if (status === "pass")
    return (
      <CheckCircle2 className={cn("h-4 w-4 text-emerald-500", className)} />
    );
  return <CircleAlert className={cn("h-4 w-4 text-red-500", className)} />;
}

function statusCountBadge(checks: AuditCheck[], status: AuditStatus) {
  const count = checks.filter((c) => c.status === status).length;
  if (count === 0) return null;
  const colors = {
    pass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    fail: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        colors[status],
      )}
    >
      {count}
    </span>
  );
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  meta: <Tag className="h-4 w-4" />,
  content: <FileText className="h-4 w-4" />,
  technical: <Shield className="h-4 w-4" />,
  links: <Link2 className="h-4 w-4" />,
  performance: <Gauge className="h-4 w-4" />,
};

/* ── Details renderers ──────────────────────────────────────────── */

function DefaultDetails({ details }: { details: string | string[] }) {
  if (Array.isArray(details)) {
    return (
      <ul className="mt-2 space-y-1">
        {details.map((item) => (
          <li
            key={item}
            className="text-sm text-muted-foreground font-mono break-all pl-3 border-l-2 border-muted"
          >
            {item}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="text-sm text-muted-foreground/80 mt-1 font-mono break-all">
      {details}
    </p>
  );
}

/** Broken links — show each link with its status code and source page */
function BrokenLinksDetails({ check }: { check: AuditCheck }) {
  if (!check.details || !Array.isArray(check.details)) return null;

  return (
    <div className="mt-3 space-y-2">
      {check.details.map((item) => {
        // Items are like "https://example.com/page (404) | https://example.com/about"
        const [linkPart, sourcesPart] = item.split(" | ");
        const match = linkPart.match(/^(.+?)\s*\((\d+)\)$/);
        const url = match ? match[1] : linkPart;
        const status = match ? match[2] : null;
        const sourcePages = sourcesPart ? sourcesPart.split(", ") : [];

        return (
          <div
            key={item}
            className="rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <span className="text-sm break-all flex-1">{url}</span>
              {status && (
                <span className="shrink-0 rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-semibold text-red-500 tabular-nums">
                  {status}
                </span>
              )}
            </div>
            {sourcePages.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1 ml-5.5">
                Found on{" "}
                {sourcePages.map((src, i) => {
                  let short = src;
                  try {
                    const u = new URL(src);
                    short = u.pathname === "/" ? u.hostname : u.pathname;
                  } catch {
                    // keep as-is
                  }
                  return (
                    <span key={src}>
                      {i > 0 && ", "}
                      <span className="font-mono">{short}</span>
                    </span>
                  );
                })}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Internal linking — structured stats + list of zero-link pages */
function InternalLinkingDetails({ check }: { check: AuditCheck }) {
  const pages =
    check.details && Array.isArray(check.details) ? check.details : [];

  return (
    <div className="mt-3 space-y-3">
      <p className="text-sm text-muted-foreground">{check.description}</p>
      {pages.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {pages.length === 1 ? "Page" : "Pages"} with no internal links
          </p>
          <div className="space-y-1.5">
            {pages.map((url) => (
              <div
                key={url}
                className="flex items-center gap-2 rounded-md border px-3 py-2"
              >
                <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm break-all">{url}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Route to the right detail renderer based on check ID */
function CheckDetails({
  check,
  showDescription,
}: {
  check: AuditCheck;
  showDescription?: boolean;
}) {
  if (check.id === "links-broken") return <BrokenLinksDetails check={check} />;
  if (check.id === "links-internal")
    return <InternalLinkingDetails check={check} />;

  return (
    <>
      {showDescription && check.description && (
        <p className="text-sm text-muted-foreground">{check.description}</p>
      )}
      {check.details && <DefaultDetails details={check.details} />}
    </>
  );
}

/* ── Collapsible check row ──────────────────────────────────────── */

function CheckRow({ check }: { check: AuditCheck }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasExtra = !!(check.description || check.details);

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
          hasExtra && "hover:bg-muted/30 cursor-pointer",
        )}
        onClick={() => hasExtra && setIsOpen(!isOpen)}
        disabled={!hasExtra}
      >
        <StatusIcon status={check.status} className="shrink-0" />
        <span className="text-sm font-medium flex-1">{check.title}</span>
        {hasExtra && (
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground/50 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-3 pl-11">
          {check.id === "links-broken" || check.id === "links-internal" ? (
            <CheckDetails check={check} />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {check.description}
              </p>
              {check.details && <CheckDetails check={check} />}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Category accordion ─────────────────────────────────────────── */

export function CategorySection({
  category,
}: {
  category: AuditCategoryResult;
}) {
  const [isOpen, setIsOpen] = useState(
    category.checks.some((c) => c.status !== "pass"),
  );

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <span className="text-muted-foreground shrink-0">
          {CATEGORY_ICONS[category.category]}
        </span>
        <span className="font-medium flex-1">{category.label}</span>
        <div className="flex items-center gap-2">
          {statusCountBadge(category.checks, "pass")}
          {statusCountBadge(category.checks, "fail")}
        </div>
      </button>

      {isOpen && (
        <div className="border-t">
          {category.checks.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Issues view ────────────────────────────────────────────────── */

export function IssuesView({ result }: { result: AuditResult }) {
  const issues = result.categories.flatMap((cat) =>
    cat.checks
      .filter((c) => c.status !== "pass")
      .map((c) => ({ ...c, categoryLabel: cat.label })),
  );

  if (issues.length === 0) {
    return (
      <div className="rounded-lg border bg-card px-4 py-6 text-center">
        <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
        <p className="text-sm font-medium">No issues found!</p>
        <p className="text-sm text-muted-foreground mt-1">
          All checks passed. Your site is in great shape.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card divide-y">
      {issues.map((issue) => (
        <div key={issue.id} className="px-4 py-3">
          <div className="flex items-start gap-3">
            <StatusIcon status={issue.status} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{issue.title}</span>
                <span className="text-xs text-muted-foreground/60">
                  {issue.categoryLabel}
                </span>
              </div>
              {issue.id === "links-broken" || issue.id === "links-internal" ? (
                <CheckDetails check={issue} />
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {issue.description}
                  </p>
                  {issue.details && <CheckDetails check={issue} />}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
