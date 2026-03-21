"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  FileText,
  Globe,
  Loader2,
  Search,
} from "lucide-react";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { analyzePage } from "@/lib/density-checker/actions";
import type { DensityResponse } from "@/lib/density-checker/types";
import { cn } from "@/lib/utils";

type SortKey = "count" | "density" | "term";
type SortDir = "asc" | "desc";
type NgramFilter = 0 | 1 | 2 | 3;

const NGRAM_TABS: { label: string; value: NgramFilter }[] = [
  { label: "All", value: 0 },
  { label: "1-word", value: 1 },
  { label: "2-word", value: 2 },
  { label: "3-word", value: 3 },
];

const MAX_ROWS = 100;

function SortIcon({
  col,
  sortKey,
  sortDir,
}: {
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
}) {
  if (sortKey !== col)
    return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
  return sortDir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 text-primary" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 text-primary" />
  );
}

export default function DensityChecker() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState<DensityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [ngramFilter, setNgramFilter] = useState<NgramFilter>(0);
  const [sortKey, setSortKey] = useState<SortKey>("count");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const hasResults = data !== null;

  const handleSubmit = useCallback(
    (e: React.SubmitEvent) => {
      e.preventDefault();
      const trimmed = url.trim();
      if (!trimmed) return;

      const finalUrl =
        trimmed.startsWith("http://") || trimmed.startsWith("https://")
          ? trimmed
          : `https://${trimmed}`;

      setError(null);

      startTransition(async () => {
        const result = await analyzePage(finalUrl);
        if (result.error) {
          setError(result.error);
        } else if (result.data) {
          setData(result.data);
          setNgramFilter(0);
          setSortKey("count");
          setSortDir("desc");
        }
      });
    },
    [url],
  );

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "term" ? "asc" : "desc");
      }
    },
    [sortKey],
  );

  const filteredResults = useMemo(() => {
    if (!data) return [];

    let results = [...data.results];

    if (ngramFilter > 0) {
      results = results.filter((r) => r.words === ngramFilter);
    }

    results.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "term") return dir * a.term.localeCompare(b.term);
      return dir * (a[sortKey] - b[sortKey]);
    });

    return results.slice(0, MAX_ROWS);
  }, [data, ngramFilter, sortKey, sortDir]);

  return (
    <section
      className={cn(
        "container max-w-2xl mx-auto px-6 sm:px-4 transition-all duration-500",
        hasResults
          ? "py-12 sm:py-8"
          : "flex flex-col justify-center min-h-[calc(100dvh-3.5rem)]",
      )}
    >
      {/* Header — centered hero pre-results, compact top-left post-results */}
      {hasResults ? (
        <h1 className="text-center font-medium text-muted-foreground mb-6">
          Keyword Density Checker
        </h1>
      ) : (
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-4 sm:mb-3">
            Free SEO Tool
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-8 sm:mb-3">
            Keyword Density Checker
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Analyze any webpage to discover the most frequently used words and
            terms. Great for on-page SEO audits and content optimization.
          </p>
        </div>
      )}

      {/* Search bar — narrower & centered when no results */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter a URL (e.g. keywordsdb.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-10 pl-9 text-sm"
            disabled={isPending}
          />
        </div>
        <Button type="submit" size="lg" disabled={isPending || !url.trim()}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" data-icon="inline-start" />
          )}
          Analyze
        </Button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-6 sm:mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div
          className={cn(
            "mt-10 sm:mt-6 animate-fade-in-up transition-opacity duration-200",
            isPending ? "opacity-50 pointer-events-none" : "",
          )}
        >
          {/* Stats + n-gram tabs row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 sm:gap-12 mb-6 sm:mb-4 min-w-0">
            <div className="flex items-center gap-3 text-sm text-muted-foreground min-w-0">
              {data.title && (
                <span className="flex items-center gap-1.5 min-w-0">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{data.title}</span>
                </span>
              )}
              <span className="text-nowrap tabular-nums font-medium text-foreground shrink-0">
                {data.totalWords.toLocaleString()} words
              </span>
            </div>

            <div className="flex gap-1 shrink-0">
              {NGRAM_TABS.map((tab) => (
                <Button
                  key={tab.value}
                  variant={ngramFilter === tab.value ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setNgramFilter(tab.value)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Results table */}
          {filteredResults.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                        onClick={() => handleSort("term")}
                      >
                        Term
                        <SortIcon
                          col="term"
                          sortKey={sortKey}
                          sortDir={sortDir}
                        />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors ml-auto cursor-pointer"
                        onClick={() => handleSort("count")}
                      >
                        Count
                        <SortIcon
                          col="count"
                          sortKey={sortKey}
                          sortDir={sortDir}
                        />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors ml-auto cursor-pointer"
                        onClick={() => handleSort("density")}
                      >
                        Density
                        <SortIcon
                          col="density"
                          sortKey={sortKey}
                          sortDir={sortDir}
                        />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((row, i) => (
                    <TableRow key={row.term}>
                      <TableCell className="text-center text-muted-foreground tabular-nums">
                        {i + 1}
                      </TableCell>
                      <TableCell className="font-medium">{row.term}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.count}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.density.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No terms found for this filter.
            </p>
          )}

          <p className="text-xs text-muted-foreground text-center mt-6 sm:mt-4">
            Showing top {filteredResults.length} results. Common stop words
            (the, is, and, etc.) are excluded. Only terms appearing 2+ times are
            shown.
          </p>
        </div>
      )}
    </section>
  );
}
