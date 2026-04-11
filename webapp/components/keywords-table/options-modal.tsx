"use no memo"; // https://github.com/shadcn-ui/ui/issues/3905

import type { Table } from "@tanstack/react-table";
import { ArrowRight, Info, Loader2, Settings } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { billingPortal } from "@/lib/stripe/billing-portal";
import type { KeywordRow } from "@/lib/types";
import { Button } from "../ui/button";
import { HybridTooltip } from "../ui/hybrid-tooltip";
import { columnLabels } from "./columns";

const visibilityColumns: Record<string, string> = Object.entries(columnLabels)
  .filter(([id]) => id !== "keyword")
  .reduce(
    (acc, [id, col]) => {
      acc[id] = col.title as string;
      return acc;
    },
    {} as Record<string, string>,
  );

function OptionsModal({
  table,
  isSample,
  canAccessBingData,
  email,
}: {
  table: Table<KeywordRow>;
  isSample: boolean;
  canAccessBingData: boolean;
  email?: string;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isBillingPending, startBillingTransition] = useTransition();

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setSettingsOpen(true)}
        aria-label="Options"
      >
        <Settings />
      </Button>
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent
          className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          aria-describedby={undefined}
        >
          <DialogHeader className="pb-1 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="size-5 text-primary" />
              Options
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 overflow-y-auto flex-1 pr-1">
            {/* Adult content filter */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Filters
              </p>
              <div className="flex items-center justify-between gap-4">
                <div className="shrink-0">
                  <Label className="text-sm font-medium">Adult content</Label>
                  {isSample && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Not available in demo
                    </p>
                  )}
                </div>
                <Select
                  value={
                    table.getColumn("is_adult")?.getFilterValue() as string
                  }
                  onValueChange={(val) => {
                    const col = table.getColumn("is_adult");
                    col?.setFilterValue(val);
                  }}
                  disabled={isSample}
                >
                  <SelectTrigger
                    className="w-36"
                    aria-label="Adult content filter"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Exclude</SelectItem>
                    <SelectItem value="undefined">Include</SelectItem>
                    <SelectItem value="true">Show only adult</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Column visibility */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Columns
              </p>
              <div className="sm:grid sm:grid-cols-2">
                {table
                  .getAllColumns()
                  .filter(
                    (col) =>
                      col.getCanHide() &&
                      !(col.id === "volume_bing" && !canAccessBingData),
                  )
                  .map((col) => (
                    <label
                      key={col.id}
                      htmlFor={`col-${col.id}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        id={`col-${col.id}`}
                        checked={col.getIsVisible()}
                        onCheckedChange={(checked) =>
                          col.toggleVisibility(!!checked)
                        }
                        className="rounded-sm shrink-0"
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">
                          {visibilityColumns[col.id]}
                        </span>
                        {/** biome-ignore lint/a11y/noStaticElementInteractions: tooltip trigger */}
                        <span
                          onClick={(e) => e.preventDefault()}
                          onKeyDown={(e) => e.preventDefault()}
                        >
                          <HybridTooltip
                            content={
                              columnLabels[col.id as keyof typeof columnLabels]
                                .description
                            }
                          >
                            <span className="text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-default">
                              <Info className="h-3.5 w-3.5" />
                            </span>
                          </HybridTooltip>
                        </span>
                      </div>
                    </label>
                  ))}
              </div>
            </div>

            {/* Advanced columns (Max plan only) */}
            {!canAccessBingData && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                    Advanced Columns
                  </p>
                  <div className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-2.5 py-2">
                    <p className="text-xs text-muted-foreground">
                      Only available in Max plan
                    </p>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() =>
                        startBillingTransition(async () => {
                          const result = await billingPortal({
                            email: email ?? "",
                          });
                          if (result?.error) {
                            toast.error(result.error);
                          }
                        })
                      }
                    >
                      Upgrade
                      {isBillingPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <ArrowRight className="size-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="-mx-2 sm:grid sm:grid-cols-2">
                  {table
                    .getAllColumns()
                    .filter((col) => col.id === "volume_bing")
                    .map((col) => (
                      <label
                        key={col.id}
                        htmlFor={`col-advanced-${col.id}`}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground"
                      >
                        <Checkbox
                          id={`col-advanced-${col.id}`}
                          checked={false}
                          className="rounded-sm shrink-0"
                          disabled
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">
                            {visibilityColumns[col.id]}
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-muted-foreground/60 cursor-default">
                                <Info className="h-3.5 w-3.5" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="flex flex-row items-start gap-2 max-w-xs">
                              {
                                columnLabels[
                                  col.id as keyof typeof columnLabels
                                ].description
                              }
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default OptionsModal;
