"use no memo"; // https://github.com/shadcn-ui/ui/issues/3905

import type { CellContext, Column, ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Keyword, KeywordRow } from "@/lib/types";
import { formatLargeNumber } from "./utils";
import { VolumeHistoryCell } from "./volume-history";

const Header = ({ title }: { title: string }) => {
  return (
    <div className="text-sm font-medium text-muted-foreground">{title}</div>
  );
};

const SortableHeader = ({
  column,
  title,
}: {
  column: Column<Keyword>;
  title: string;
}) => {
  const sortDirection = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      onClick={() =>
        column.toggleSorting(sortDirection === false || sortDirection === "asc")
      }
      className="font-medium -ml-3 hover:bg-transparent group"
    >
      {title}
      {sortDirection === "asc" ? (
        <ArrowUp className="ml-1 h-4 w-4" />
      ) : sortDirection === "desc" ? (
        <ArrowDown className="ml-1 h-4 w-4" />
      ) : (
        <ArrowDown className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-30" />
      )}
    </Button>
  );
};

const columnsWithoutSkeleton: ColumnDef<Keyword>[] = [
  {
    accessorKey: "keyword",
    header: () => <Header title="Keyword" />,
    cell: ({ row }) => (
      <div className="truncate" title={row.getValue("keyword")}>
        {row.getValue("keyword")}
      </div>
    ),
    size: 270,
    enableResizing: false,
  },
  {
    accessorKey: "avg_monthly_searches",
    header: ({ column }) => <SortableHeader column={column} title="Volume" />,
    cell: ({ row }) => {
      const value = row.getValue("avg_monthly_searches") as number;
      return formatLargeNumber(value, false);
    },
    size: 150,
    enableResizing: false,
  },
  {
    accessorKey: "competition_index",
    header: ({ column }) => (
      <SortableHeader column={column} title="Competition" />
    ),
    cell: ({ row }) => row.getValue("competition_index") as number,
    size: 130,
    enableResizing: false,
  },
  {
    accessorKey: "cpc_high",
    header: ({ column }) => <SortableHeader column={column} title="CPC ($)" />,
    cell: ({ row }) => (row.getValue("cpc_high") as number).toFixed(2),
    size: 100,
    enableResizing: false,
  },
  {
    accessorKey: "volume_history",
    header: () => <Header title="Volume history" />,
    cell: ({ row }) => (
      <VolumeHistoryCell raw={row.getValue("volume_history") as string} />
    ),
    size: 150,
    enableResizing: false,
  },
  {
    accessorKey: "updated_at",
    header: () => <Header title="Last updated" />,
    cell: ({ row }) => row.getValue("updated_at") as string,
    size: 140,
    enableResizing: false,
  },
];

export const columns = columnsWithoutSkeleton.map((column) => ({
  ...column,
  cell: (info: CellContext<KeywordRow, unknown>) => {
    if (info.row.original && "showSkeleton" in info.row.original) {
      if (info.row.original.showSkeleton) {
        return (
          <Skeleton
            className="my-0.5 h-4"
            style={{ width: column.size ? 0.5 * column.size : undefined }}
          />
        );
      }
      return <div className="my-0.5 h-4" />;
    }
    if (info.row.original && typeof column.cell === "function") {
      return column.cell(info as CellContext<Keyword, unknown>);
    }
    return null;
  },
})) as ColumnDef<KeywordRow>[];
