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
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import type {
  AuditCategoryResult,
  AuditCheck,
  AuditCheckPage,
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
  if (status === "warn")
    return (
      <TriangleAlert className={cn("h-4 w-4 text-yellow-500", className)} />
    );
  return <CircleAlert className={cn("h-4 w-4 text-red-500", className)} />;
}

function statusCountBadge(checks: AuditCheck[], status: AuditStatus) {
  const count = checks.filter((c) => c.status === status).length;
  if (count === 0) return null;
  const colors = {
    pass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warn: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
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

/** Per-page details list — shows each affected page with its description */
function PagesDetails({ pages }: { pages: AuditCheckPage[] }) {
  const MAX_VISIBLE = 10;
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? pages : pages.slice(0, MAX_VISIBLE);
  const remaining = pages.length - MAX_VISIBLE;

  return (
    <div className="mt-3 space-y-1.5">
      {visible.map((page) => {
        let shortUrl = page.url;
        try {
          const u = new URL(page.url);
          shortUrl =
            u.pathname === "/" ? u.hostname : `${u.hostname}${u.pathname}`;
        } catch {
          // keep as-is
        }
        return (
          <div
            key={`${page.url}-${page.description}`}
            className="rounded-md border px-3 py-2"
          >
            <div className="grid grid-cols-[auto_1fr] gap-x-2 items-start">
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              <span className="text-sm font-mono break-all">{shortUrl}</span>
              <div />
              <p className="text-xs text-muted-foreground mt-0.5">
                {page.description}
              </p>
            </div>
          </div>
        );
      })}
      {!showAll && remaining > 0 && (
        <button
          type="button"
          className="text-xs text-primary hover:underline cursor-pointer pl-1"
          onClick={() => setShowAll(true)}
        >
          Show {remaining} more…
        </button>
      )}
    </div>
  );
}

/** Route to the right detail renderer based on check data */
function CheckDetails({ check }: { check: AuditCheck }) {
  return (
    <>
      {check.details && <DefaultDetails details={check.details} />}
      {check.pages && check.pages.length > 0 && (
        <PagesDetails pages={check.pages} />
      )}
    </>
  );
}

/* ── Collapsible check row ──────────────────────────────────────── */

function CheckRow({
  check,
  categoryLabel,
}: {
  check: AuditCheck;
  categoryLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasExtra = !!(
    check.description ||
    check.details ||
    (check.pages && check.pages.length > 0)
  );

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
        {categoryLabel && (
          <span className="text-xs text-muted-foreground/60">
            {categoryLabel}
          </span>
        )}
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
        <div className="px-4 pb-3 pt-2 pl-11">
          <p className="text-sm text-muted-foreground">{check.description}</p>
          <CheckDetails check={check} />
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
          {statusCountBadge(category.checks, "warn")}
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
  const errors = result.categories.flatMap((cat) =>
    cat.checks
      .filter((c) => c.status === "fail")
      .map((c) => ({ check: c, categoryLabel: cat.label })),
  );
  const warnings = result.categories.flatMap((cat) =>
    cat.checks
      .filter((c) => c.status === "warn")
      .map((c) => ({ check: c, categoryLabel: cat.label })),
  );

  if (errors.length === 0 && warnings.length === 0) {
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
    <div className="space-y-3">
      {errors.length > 0 && (
        <div className="rounded-lg border bg-card">
          {errors.map(({ check, categoryLabel }) => (
            <CheckRow
              key={check.id}
              check={check}
              categoryLabel={categoryLabel}
            />
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="rounded-lg border bg-card">
          {warnings.map(({ check, categoryLabel }) => (
            <CheckRow
              key={check.id}
              check={check}
              categoryLabel={categoryLabel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
