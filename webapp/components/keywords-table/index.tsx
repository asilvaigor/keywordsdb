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
import { AlertOctagon, Search } from "lucide-react";
import { columns } from "./columns";
import { Pagination } from "./pagination";
import { Search as SearchComponent } from "./search";
import { useKeywordsTable } from "./use-keywords-table";
import { LoaderCircle } from "lucide-react";
import useClickhouseReady from "./use-clickhouse-ready";

const PAGE_SIZE = 10;

export function KeywordsTable() {
	const {
		table,
		isLoading,
		isLoadingSlow,
		error,
		totalRows,
		isTotalRowsLoading,
		totalRowsError,
		pageIndex,
		pageSize,
	} = useKeywordsTable(PAGE_SIZE);
  const isClickhouseReady = useClickhouseReady();

	return (
		<div className="flex flex-col justify-center max-w-xs sm:max-w-fit mx-auto h-full">
			<SearchComponent table={table} />
			<div className="rounded-md border relative">
				{!isClickhouseReady && isLoadingSlow && (
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
				totalRowsError={totalRowsError}
				pageIndex={pageIndex}
				pageSize={pageSize}
			/>
		</div>
	);
}
