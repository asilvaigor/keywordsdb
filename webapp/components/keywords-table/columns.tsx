"use no memo"; // https://github.com/shadcn-ui/ui/issues/3905

import type { CellContext, Column, ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Keyword, KeywordRow } from "@/lib/types";
import { formatLargeNumber } from "./utils";
import { VolumeHistoryCell } from "./volume-history";

function Header({ title, tooltip }: { title: string; tooltip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="text-sm font-medium text-muted-foreground w-fit">
          {title}
        </div>
      </TooltipTrigger>
      <TooltipContent className="flex flex-row items-start gap-2 max-w-xs">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function SortableHeader({
  column,
  title,
  tooltip,
}: {
  column: Column<Keyword>;
  title: string;
  tooltip: string;
}) {
  const sortDirection = column.getIsSorted();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(
              sortDirection === false || sortDirection === "asc",
            )
          }
          className="font-medium -ml-3 hover:bg-transparent group w-fit"
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
      </TooltipTrigger>
      <TooltipContent className="flex flex-row items-start gap-2 max-w-xs">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

const columnsWithoutSkeleton: ColumnDef<Keyword>[] = [
  {
    accessorKey: "keyword",
    header: () => (
      <Header
        title="Keyword"
        tooltip="The search term or phrase that users enter into Google"
      />
    ),
    cell: ({ row }) => (
      <div className="truncate" title={row.getValue("keyword")}>
        {row.getValue("keyword")}
      </div>
    ),
    size: 270,
    enableResizing: false,
  },
  {
    accessorKey: "volume_estimated_google",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        title="Volume"
        tooltip="Estimated Google volume - Average number of times users searched for this keyword per month over the past 12 months"
      />
    ),
    cell: ({ row }) => {
      const value = row.getValue("volume_estimated_google") as number;
      return formatLargeNumber(value);
    },
    size: 150,
    enableResizing: false,
  },
  {
    accessorKey: "competition_index",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        title="Competition"
        tooltip="Competition level for this keyword in Google Ads, ranging from 0-100. Higher values indicate more advertisers bidding on this keyword"
      />
    ),
    cell: ({ row }) => row.getValue("competition_index") as number,
    size: 130,
    enableResizing: false,
  },
  {
    accessorKey: "cpc_high",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        title="CPC ($)"
        tooltip="Cost Per Click - the average amount advertisers pay for a click on their ad for this keyword"
      />
    ),
    cell: ({ row }) => (row.getValue("cpc_high") as number).toFixed(2),
    size: 100,
    enableResizing: false,
  },
  {
    accessorKey: "volume_history_google",
    header: () => (
      <Header
        title="Volume history"
        tooltip="Historical search volume trend showing how search interest has changed over time"
      />
    ),
    cell: ({ row }) => (
      <VolumeHistoryCell
        raw={row.getValue("volume_history_google") as string}
      />
    ),
    size: 150,
    enableResizing: false,
  },
  {
    accessorKey: "updated_at",
    header: () => (
      <Header
        title="Last updated"
        tooltip="The date when this keyword data was last refreshed from Google"
      />
    ),
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
