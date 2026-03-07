"use client";

import {
  AlertTriangleIcon,
  Download,
  FileArchive,
  FileSpreadsheet,
} from "lucide-react";
import { useEffect, useState } from "react";
import UpgradeModal from "@/components/paywall/upgrade-modal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { KeywordFilters } from "@/lib/types";
import { cn } from "@/lib/utils";

type Format = "parquet" | "csv";

const CSV_MAX_ROWS = 1_000_000;
const PARQUET_ROWS_PER_FILE = 500_000;
const CSV_ROWS_PER_FILE = 100_000;

// Rough bytes-per-row estimates (tune these later)
const BYTES_PER_ROW_PARQUET = 26;
const BYTES_PER_ROW_CSV = 100;

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`;
  return `${(bytes / 1_000).toFixed(0)} KB`;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function fileCount(totalRows: number, format: Format): number {
  const perFile =
    format === "parquet" ? PARQUET_ROWS_PER_FILE : CSV_ROWS_PER_FILE;
  return Math.ceil(totalRows / perFile);
}

function estimatedSize(totalRows: number, format: Format): string {
  const factor =
    format === "parquet" ? BYTES_PER_ROW_PARQUET : BYTES_PER_ROW_CSV;
  return formatBytes(totalRows * factor);
}

export function DownloadModal({
  canDownload,
  email,
  totalRows,
  handleDownload,
  isDownloadLoading,
  filters,
}: {
  canDownload: boolean;
  email?: string;
  totalRows?: number;
  handleDownload: (format: Format) => void;
  isDownloadLoading: boolean;
  filters: KeywordFilters;
}) {
  const [open, setOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [format, setFormat] = useState<Format>("parquet");

  const csvDisabled = totalRows != null && totalRows > CSV_MAX_ROWS;
  const isRowsLoading = totalRows == null;
  const files = totalRows != null ? fileCount(totalRows, format) : undefined;
  const size = totalRows != null ? estimatedSize(totalRows, format) : undefined;
  const hasFilters = Object.values(filters).some((v) => v != null);

  // Auto-switch away from csv if it becomes disabled
  useEffect(() => {
    if (csvDisabled && format === "csv") setFormat("parquet");
  }, [csvDisabled, format]);

  function onConfirm() {
    setOpen(false);
    handleDownload(format);
  }

  return (
    <>
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        email={email}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <span className="inline-flex">
          <Button
            variant="default"
            onClick={() => (canDownload ? setOpen(true) : setUpgradeOpen(true))}
            className="flex items-center gap-2 w-full"
            disabled={isDownloadLoading}
            aria-label="Export"
          >
            <Download />
            <span className="hidden sm:block">Export</span>
          </Button>
        </span>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="size-5 text-primary" />
              Export Keywords
            </DialogTitle>
            <DialogDescription>
              Choose a format and confirm your download.
            </DialogDescription>
          </DialogHeader>

          {/* Format selection */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Format
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat("parquet")}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all",
                  format === "parquet"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/30",
                )}
              >
                <FileArchive
                  className={cn(
                    "size-5",
                    format === "parquet"
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                />
                <span className="text-sm font-medium">Parquet</span>
                <span className="text-[10px] text-muted-foreground">
                  Compact &amp; fast
                </span>
              </button>

              <button
                type="button"
                onClick={() => !csvDisabled && setFormat("csv")}
                disabled={csvDisabled}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all",
                  csvDisabled && "opacity-50 cursor-not-allowed",
                  format === "csv" && !csvDisabled
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/30",
                  csvDisabled && "hover:border-border hover:bg-transparent",
                )}
              >
                <FileSpreadsheet
                  className={cn(
                    "size-5",
                    format === "csv" && !csvDisabled
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                />
                <span className="text-sm font-medium">CSV</span>
                {csvDisabled ? (
                  <span className="text-[10px] text-destructive">
                    Max 1M rows
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    Universal
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Summary stats */}
          <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rows</span>
              {isRowsLoading ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                <span className="font-medium">{formatNumber(totalRows)}</span>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated Files</span>
              {isRowsLoading ? (
                <Skeleton className="h-4 w-12" />
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">~{files}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    .{format}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated size</span>
              {isRowsLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <span className="font-medium">~{size}</span>
              )}
            </div>
          </div>

          {/* Too many rows warning */}
          {totalRows && totalRows > 20_000_000 && hasFilters && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
              <AlertTriangleIcon />
              <AlertTitle>WOW! That's a lot of files.</AlertTitle>
              <AlertDescription>
                This could take a really long time. Consider removing all the
                filters to download the whole dataset, where the files are
                already ready for download.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={isRowsLoading} onClick={onConfirm}>
              <Download className="mr-1.5" />
              Download{" "}
              {!isRowsLoading && files != null && files > 1
                ? `~${files} files`
                : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
