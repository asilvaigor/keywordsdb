"use no memo"; // https://github.com/shadcn-ui/ui/issues/3905

import type { CellContext, Column, ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HybridTooltip } from "@/components/ui/hybrid-tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Keyword, KeywordRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatLargeNumber } from "./utils";
import { VolumeHistoryCell } from "./volume-history";

function TruncatedCell({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: when page changes, check if the new text is truncated
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setIsTruncated(el.scrollWidth > el.offsetWidth);
  }, [text]);

  return (
    <HybridTooltip key={text} content={text} disabled={!isTruncated}>
      <div ref={ref} className="truncate">
        {text}
      </div>
    </HybridTooltip>
  );
}

function LargeNumberCell({ value }: { value: number }) {
  return (
    <HybridTooltip content={value.toLocaleString()} disabled={value <= 1e4}>
      <span>{formatLargeNumber(value, 1, 1e4)}</span>
    </HybridTooltip>
  );
}

function Header({ title, tooltip }: { title: string; tooltip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="text-sm font-medium text-muted-foreground w-fit">
          {title}
        </div>
      </TooltipTrigger>
      <TooltipContent className="flex flex-row items-start gap-2 max-w-xs">
        <Info className="h-4 w-4 shrink-0" />
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

export const columnLabels: Record<
  keyof Keyword,
  { title: string; description: string }
> = {
  keyword: {
    title: "Keyword",
    description: "The search term or phrase that users enter into Google",
  },
  volume_estimated_google: {
    title: "Volume",
    description:
      "Estimated Google volume - Average number of times users searched for this keyword per month over the past 12 months",
  },
  volume_google: {
    title: "Volume (Google)",
    description:
      "Reported Google volume - Volume reported by Google Keyword Planner. It often overestimates the actual search volume in the case of typos and keywords with other similar intent keywords (e.g. 'you tube' vs 'youtube') since Google Ads groups them together",
  },
  volume_bing: {
    title: "Volume (Bing)",
    description: "Reported Bing volume - Volume reported by Bing Ads API",
  },
  competition_index: {
    title: "Competition",
    description:
      "Competition level for this keyword in Google Ads, ranging from 0-100. Higher values indicate more advertisers bidding on this keyword",
  },
  cpc_high: {
    title: "CPC ($)",
    description:
      "Cost Per Click - the maximum amount advertisers on Google pay for a click on their ad for this keyword",
  },
  is_adult: {
    title: "Is Adult",
    description: "Whether this keyword is NSFW/adult content",
  },
  is_question: {
    title: "Is Question",
    description: "Whether this keyword is a question (e.g. 'how to tie a tie')",
  },
  is_comparison: {
    title: "Is Comparison",
    description:
      "Whether this keyword is a comparison (e.g. 'nike vs adidas') indicating high commercial intent",
  },
  is_branded: {
    title: "Is Branded",
    description:
      "Whether this keyword contains a brand name (e.g. 'nike shoes')",
  },
  intent: {
    title: "Intent",
    description:
      "The search intent behind this keyword, classified as one of: Informational (seeking information), Navigational (seeking a specific website), Transactional (seeking to make a purchase), Commercial Investigation (researching products/services before a purchase)",
  },
  entity_type: {
    title: "Entity Type",
    description:
      "The type of entity this keyword represents, such as a product, service, brand, or general topic",
  },
  saas_potential: {
    title: "SaaS Potential",
    description:
      "An estimate of the potential for this keyword to be associated with a successful SaaS business, based on factors like search intent, competition, and commercial viability",
  },
  volume_history_google: {
    title: "Volume history",
    description:
      "Historical search volume trend showing how search interest has changed over time",
  },
  updated_at: {
    title: "Last updated",
    description:
      "The date when this keyword data was last refreshed from Google",
  },
};

const columnsWithoutSkeleton: ColumnDef<Keyword>[] = [
  {
    accessorKey: "keyword",
    header: () => (
      <Header
        title={columnLabels.keyword.title}
        tooltip={columnLabels.keyword.description}
      />
    ),
    cell: ({ row }) => <TruncatedCell text={row.getValue("keyword")} />,
    size: 200,
    enableResizing: false,
    enableHiding: false,
  },
  {
    accessorKey: "volume_estimated_google",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        title={columnLabels.volume_estimated_google.title}
        tooltip={columnLabels.volume_estimated_google.description}
      />
    ),
    cell: ({ row }) => {
      const value = row.getValue("volume_estimated_google") as number;
      return <LargeNumberCell value={value} />;
    },
    size: 95,
    enableResizing: false,
  },
  {
    accessorKey: "volume_google",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        title={columnLabels.volume_google.title}
        tooltip={columnLabels.volume_google.description}
      />
    ),
    cell: ({ row }) => {
      const value = row.getValue("volume_google") as number | null | undefined;
      if (value == null || value === 0) {
        return <Badge variant="outline">Not available</Badge>;
      }
      return <LargeNumberCell value={value} />;
    },
    size: 152,
    enableResizing: false,
  },
  {
    accessorKey: "volume_bing",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        title={columnLabels.volume_bing.title}
        tooltip={columnLabels.volume_bing.description}
      />
    ),
    cell: ({ row }) => {
      const value = row.getValue("volume_bing") as number;
      if (value == null || value === -1) {
        return <Badge variant="outline">Not available</Badge>;
      }
      return <LargeNumberCell value={value} />;
    },
    size: 132,
    enableResizing: false,
  },
  {
    accessorKey: "competition_index",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        title={columnLabels.competition_index.title}
        tooltip={columnLabels.competition_index.description}
      />
    ),
    cell: ({ row }) => row.getValue("competition_index") as number,
    size: 128,
    enableResizing: false,
  },
  {
    accessorKey: "cpc_high",
    header: ({ column }) => (
      <SortableHeader
        column={column}
        title={columnLabels.cpc_high.title}
        tooltip={columnLabels.cpc_high.description}
      />
    ),
    cell: ({ row }) => (row.getValue("cpc_high") as number).toFixed(2),
    size: 97,
    enableResizing: false,
  },
  {
    accessorKey: "is_adult",
    header: () => (
      <Header
        title={columnLabels.is_adult.title}
        tooltip={columnLabels.is_adult.description}
      />
    ),
    cell: ({ row }) =>
      (row.getValue("is_adult") as boolean) ? (
        <Badge variant="destructive">Yes</Badge>
      ) : (
        <Badge variant="outline">No</Badge>
      ),
    size: 80,
    enableResizing: false,
  },
  {
    accessorKey: "is_question",
    header: () => (
      <Header
        title={columnLabels.is_question.title}
        tooltip={columnLabels.is_question.description}
      />
    ),
    cell: ({ row }) =>
      (row.getValue("is_question") as boolean) ? (
        <Badge className="bg-success/10 text-success">Yes</Badge>
      ) : (
        <Badge variant="destructive">No</Badge>
      ),
    size: 100,
    enableResizing: false,
  },
  {
    accessorKey: "is_comparison",
    header: () => (
      <Header
        title={columnLabels.is_comparison.title}
        tooltip={columnLabels.is_comparison.description}
      />
    ),
    cell: ({ row }) =>
      (row.getValue("is_comparison") as boolean) ? (
        <Badge className="bg-success/10 text-success">Yes</Badge>
      ) : (
        <Badge variant="destructive">No</Badge>
      ),
    size: 110,
    enableResizing: false,
  },
  {
    accessorKey: "is_branded",
    header: () => (
      <Header
        title={columnLabels.is_branded.title}
        tooltip={columnLabels.is_branded.description}
      />
    ),
    cell: ({ row }) =>
      (row.getValue("is_branded") as boolean) ? (
        <Badge className="bg-success/10 text-success">Yes</Badge>
      ) : (
        <Badge variant="destructive">No</Badge>
      ),
    size: 100,
    enableResizing: false,
  },
  {
    accessorKey: "intent",
    header: () => (
      <Header
        title={columnLabels.intent.title}
        tooltip={columnLabels.intent.description}
      />
    ),
    cell: ({ row }) => {
      const value = row.getValue("intent") as string;
      return (
        <Badge
          className={cn({
            "bg-orange/10 text-orange": value === "Informational",
            "bg-pink/10 text-pink": value === "Commercial",
            "bg-primary/10 text-primary": value === "Transactional",
            "bg-blue/10 text-blue": value === "Navigational",
          })}
        >
          {value}
        </Badge>
      );
    },
    size: 110,
    enableResizing: false,
  },
  {
    accessorKey: "entity_type",
    header: () => (
      <Header
        title={columnLabels.entity_type.title}
        tooltip={columnLabels.entity_type.description}
      />
    ),
    cell: ({ row }) => {
      const value = row.getValue("entity_type") as string;
      return <Badge variant="outline">{value}</Badge>;
    },
    size: 100,
    enableResizing: false,
  },
  {
    accessorKey: "saas_potential",
    header: () => (
      <Header
        title={columnLabels.saas_potential.title}
        tooltip={columnLabels.saas_potential.description}
      />
    ),
    cell: ({ row }) => {
      const value = row.getValue("saas_potential") as string;
      return (
        <Badge
          className={cn({
            "bg-destructive/10 text-destructive": value === "low",
            "bg-primary/10 text-primary": value === "medium",
            "bg-success/10 text-success": value === "high",
          })}
        >
          {value === "low"
            ? "Low"
            : value === "medium"
              ? "Medium"
              : value === "high"
                ? "High"
                : value}
        </Badge>
      );
    },
    size: 110,
    enableResizing: false,
  },
  {
    accessorKey: "volume_history_google",
    header: () => (
      <Header
        title={columnLabels.volume_history_google.title}
        tooltip={columnLabels.volume_history_google.description}
      />
    ),
    cell: ({ row }) => (
      <VolumeHistoryCell
        raw={row.getValue("volume_history_google") as string}
        ratio={
          (row.original.volume_google == null ||
          row.original.volume_google === 0
            ? 1
            : (row.getValue("volume_estimated_google") as number) /
              row.original.volume_google) as number
        }
      />
    ),
    size: 150,
    enableResizing: false,
  },
  {
    accessorKey: "updated_at",
    header: () => (
      <Header
        title={columnLabels.updated_at.title}
        tooltip={columnLabels.updated_at.description}
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
