"use no memo"; // https://github.com/shadcn-ui/ui/issues/3905

import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { KeywordRow } from "@/lib/types";
import { formatLargeNumber } from "./utils";

interface PaginationProps {
  table: Table<KeywordRow>;
  totalRows?: number;
  isTotalRowsLoading?: boolean;
  totalRowsError?: Error;
  pageIndex: number;
  pageSize: number;
}

export function Pagination({
  table,
  totalRows,
  isTotalRowsLoading,
  pageIndex,
  pageSize,
}: PaginationProps) {
  return (
    <div className="flex items-center pt-4 justify-between sm:justify-end sm:gap-8">
      {isTotalRowsLoading ? (
        <Skeleton className="h-4 w-28" />
      ) : totalRows && totalRows > 0 ? (
        <div className="text-sm text-muted-foreground">
          {pageIndex * pageSize + 1} -{" "}
          {Math.min((pageIndex + 1) * pageSize, totalRows)} of{" "}
          {formatLargeNumber(totalRows)}
        </div>
      ) : null}
      <div className="space-x-2">
        <Button
          variant="outline"
          onMouseDown={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          onMouseDown={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
