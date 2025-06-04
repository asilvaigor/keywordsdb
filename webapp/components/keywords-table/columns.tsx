import { Button } from "@/components/ui/button";
import type { Keyword } from "@/lib/types";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { formatLargeNumber } from "./utils";

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

export const columns: ColumnDef<Keyword>[] = [
  {
    accessorKey: "keyword",
    header: ({ column }) => <SortableHeader column={column} title="Keyword" />,
    cell: ({ row }) => (
      <div className="truncate" title={row.getValue("keyword")}>
        {row.getValue("keyword")}
      </div>
    ),
    size: 270,
  },
  {
    accessorKey: "avg_monthly_searches",
    header: ({ column }) => <SortableHeader column={column} title="Volume" />,
    cell: ({ row }) => {
      const value = row.getValue("avg_monthly_searches") as number;
      return formatLargeNumber(value, false);
    },
    size: 150,
  },
  {
    accessorKey: "competition_index",
    header: ({ column }) => (
      <SortableHeader column={column} title="Competition" />
    ),
    size: 140,
  },
  {
    accessorKey: "cpc_high",
    header: ({ column }) => <SortableHeader column={column} title="CPC ($)" />,
    cell: ({ row }) => (row.getValue("cpc_high") as number).toFixed(2),
    size: 90,
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => (
      <SortableHeader column={column} title="Last updated" />
    ),
    size: 150,
  },
];
