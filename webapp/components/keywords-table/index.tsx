"use client";
"use no memo"; // https://github.com/shadcn-ui/ui/issues/3905

import { flexRender } from "@tanstack/react-table";
import { AlertOctagon, LoaderCircle, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { columns } from "./columns";
import { Filters } from "./filters";
import { Pagination } from "./pagination";
import { useKeywordsTable } from "./use-keywords-table";

const PAGE_SIZE = 10;

export function KeywordsTable({
  isSample = false,
  isMaxPlan = false,
  email,
}: {
  isSample?: boolean;
  isMaxPlan?: boolean;
  email?: string;
}) {
  const {
    table,
    progress,
    isLoading,
    isTotalRowsLoading,
    isDbReady,
    error,
    totalRows,
    pageIndex,
    pageSize,
    handleDownload,
    isDownloadLoading,
    debouncedFilters,
  } = useKeywordsTable({ defaultPageSize: PAGE_SIZE, isSample });

  return (
    <div className="flex flex-col justify-center h-full">
      <Filters
        table={table}
        isSample={isSample}
        isMaxPlan={isMaxPlan}
        email={email}
        totalRows={totalRows}
        handleDownload={handleDownload}
        isDownloadLoading={isDownloadLoading}
        debouncedFilters={debouncedFilters}
      />
      <div className="rounded-md border relative">
        {progress != null && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted rounded-t-md overflow-hidden z-20">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
        {!isDbReady && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-xs z-10 flex items-center justify-center rounded-md">
            <div className="text-center space-y-2">
              <LoaderCircle className="animate-spin h-8 w-8 text-primary mx-auto" />
              <p className="text-lg font-medium">Spinning up our servers</p>
              <p className="text-sm text-muted-foreground">
                This might take a minute...
              </p>
            </div>
          </div>
        )}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{
                      minWidth: header.column.getSize(),
                      maxWidth: header.column.getSize(),
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="min-h-100">
            {error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-[369.5px] bg-muted/5"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <AlertOctagon className="h-6 w-6 text-destructive" />
                    <p className="font-medium">Something went wrong</p>
                    <p className="text-sm">
                      Failed to load keywords. Please try again later.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : totalRows === 0 && !isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-[369.5px] bg-muted/5"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Search className="h-6 w-6" />
                    <p className="font-medium">No results found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{
                        minWidth: cell.column.getSize(),
                        maxWidth: cell.column.getSize(),
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        table={table}
        totalRows={totalRows}
        isTotalRowsLoading={isTotalRowsLoading}
        pageIndex={pageIndex}
        pageSize={pageSize}
      />
    </div>
  );
}
