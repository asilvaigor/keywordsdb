import { Button } from "@/components/ui/button";
import type { Keyword } from "@/lib/types";
import type { Table } from "@tanstack/react-table";

interface PaginationProps {
  table: Table<Keyword>;
  totalRows?: number;
  pageIndex: number;
  pageSize: number;
}

function formatLargeNumber(num: number): string {
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(1)}B`;
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(1)}M`;
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(1)}k`;
  }
  return num.toString();
}

export function Pagination({
  table,
  totalRows,
  pageIndex,
  pageSize,
}: PaginationProps) {
  return (
    <div className="flex items-center py-4 justify-between sm:justify-end sm:gap-8">
      {totalRows && (
        <div className="text-sm text-muted-foreground">
          {pageIndex * pageSize + 1} -{" "}
          {Math.min((pageIndex + 1) * pageSize, totalRows)} of{" "}
          {formatLargeNumber(totalRows)}
        </div>
      )}
      <div className="space-x-2">
        <Button
          variant="outline"
          size="sm"
          onMouseDown={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onMouseDown={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
