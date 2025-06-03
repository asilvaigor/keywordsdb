"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { flexRender } from "@tanstack/react-table";
import { AlertOctagon } from "lucide-react";
import { columns } from "./columns";
import { Pagination } from "./pagination";
import { Search } from "./search";
import { useKeywordsTable } from "./use-keywords-table";

export function KeywordsTable() {
  const { table, error, totalRows, pageIndex, pageSize } = useKeywordsTable();

  return (
    <div className="flex flex-col justify-center max-w-xs sm:max-w-fit mx-auto h-full">
      <Search table={table} />
      <div className="rounded-md border">
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
          <TableBody className="min-h-[400px]">
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
            ) : table.getRowModel().rows?.length ? (
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
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-[370px] bg-muted/5"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <p>No results.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination
        table={table}
        totalRows={totalRows}
        pageIndex={pageIndex}
        pageSize={pageSize}
      />
    </div>
  );
}
