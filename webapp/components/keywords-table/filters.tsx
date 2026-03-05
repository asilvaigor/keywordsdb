"use no memo"; // https://github.com/shadcn-ui/ui/issues/3905

import type { Table } from "@tanstack/react-table";
import { Plus, Settings, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { KeywordFilters, KeywordRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DownloadModal } from "./download-modal";

const columnLabels: Record<string, string> = {
  volume_estimated_google: "Volume",
  competition_index: "Competition",
  cpc_high: "CPC ($)",
  is_adult: "Adult",
  volume_history_google: "Volume History",
  updated_at: "Last Updated",
};

type FilterOperator = "eq" | "gte" | "lte" | "between";
type FilterColumn =
  | "volume_estimated_google"
  | "competition_index"
  | "cpc_high";

interface DynamicFilter {
  id: string;
  column: FilterColumn;
  operator: FilterOperator;
  value1: string;
  value2: string;
  errors: {
    value1?: string;
    value2?: string;
  };
}

const columnOptions = [
  { value: "volume_estimated_google", label: "Volume" },
  { value: "competition_index", label: "Competition" },
  { value: "cpc_high", label: "CPC ($)" },
] as const;

const operatorOptions = [
  { value: "eq", label: "Equals" },
  { value: "gte", label: "Greater Than or Equal" },
  { value: "lte", label: "Less Than or Equal" },
  { value: "between", label: "Between" },
] as const;

export function Filters({
  table,
  totalRows,
  canDownload,
  isSample,
  email,
  handleDownload,
  isDownloadLoading,
  debouncedFilters,
}: {
  table: Table<KeywordRow>;
  totalRows?: number;
  canDownload: boolean;
  isSample: boolean;
  email?: string;
  handleDownload: (format: "parquet" | "csv") => void;
  isDownloadLoading: boolean;
  debouncedFilters: KeywordFilters;
}) {
  const [dynamicFilters, setDynamicFilters] = useState<DynamicFilter[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const adultFilterValue = table.getColumn("is_adult")?.getFilterValue() as
    | boolean
    | undefined;

  // Add validation function
  const validateFilter = (
    filter: DynamicFilter,
  ): { value1?: string; value2?: string } => {
    const errors: { value1?: string; value2?: string } = {};

    const val1 = Number.parseFloat(filter.value1);
    const val2 = Number.parseFloat(filter.value2);

    // Check for negative values
    if (filter.value1 && !Number.isNaN(val1) && val1 < 0) {
      errors.value1 = "Value cannot be negative";
    }

    if (filter.value2 && !Number.isNaN(val2) && val2 < 0) {
      errors.value2 = "Value cannot be negative";
    }

    // Check val1 <= val2 for between operator
    if (
      filter.operator === "between" &&
      filter.value1 &&
      filter.value2 &&
      !Number.isNaN(val1) &&
      !Number.isNaN(val2) &&
      val1 > val2
    ) {
      errors.value1 = "First value must be less than or equal to second value";
      errors.value2 =
        "Second value must be greater than or equal to first value";
    }

    return errors;
  };

  const addFilter = () => {
    const availableColumn = columnOptions.find(
      (opt) => !dynamicFilters.some((f) => f.column === opt.value),
    );
    if (!availableColumn) return;

    const newFilter: DynamicFilter = {
      id: Date.now().toString(),
      column: availableColumn.value,
      operator: "eq",
      value1: "",
      value2: "",
      errors: {},
    };
    setDynamicFilters([...dynamicFilters, newFilter]);
  };

  const removeFilter = (id: string) => {
    const filterToRemove = dynamicFilters.find((f) => f.id === id);
    if (filterToRemove && (filterToRemove.value1 || filterToRemove.value2)) {
      // Only clear the table filter if this filter had actually applied values
      const column = table.getColumn(filterToRemove.column);
      column?.setFilterValue(undefined);
    }

    setDynamicFilters(dynamicFilters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<DynamicFilter>) => {
    const updatedFilters = dynamicFilters.map((filter) => {
      if (filter.id === id) {
        const oldColumn = filter.column;
        const updatedFilter = { ...filter, ...updates };

        // If column changed, clear the old column's table filter
        if (updates.column && updates.column !== oldColumn) {
          const oldCol = table.getColumn(oldColumn);
          oldCol?.setFilterValue(undefined);
        }

        // When switching between lte and between, migrate the upper-bound value
        if (updates.operator && updates.operator !== filter.operator) {
          if (filter.operator === "lte" && updates.operator === "between") {
            updatedFilter.value2 = filter.value1;
            updatedFilter.value1 = "";
          } else if (
            filter.operator === "between" &&
            updates.operator === "lte"
          ) {
            updatedFilter.value1 = filter.value2;
            updatedFilter.value2 = "";
          }
        }

        // Validate the updated filter and update errors
        const errors = validateFilter(updatedFilter);
        return { ...updatedFilter, errors };
      }
      return filter;
    });
    setDynamicFilters(updatedFilters);

    // Apply the filter to the table only if valid
    const filter = updatedFilters.find((f) => f.id === id);
    if (filter && Object.keys(filter.errors).length === 0) {
      applyFilterToTable(filter);
    }
  };

  const applyFilterToTable = (filter: DynamicFilter) => {
    const column = table.getColumn(filter.column);
    if (!column) return;

    if (!filter.value1 && !filter.value2) {
      column.setFilterValue(undefined);
      return;
    }

    const val1 = Number.parseFloat(filter.value1);
    const val2 = Number.parseFloat(filter.value2);

    let value: { min?: number; max?: number } | null = null;
    switch (filter.operator) {
      case "eq":
        if (!Number.isNaN(val1)) {
          value = { min: val1, max: val1 };
        }
        break;
      case "gte":
        if (!Number.isNaN(val1)) {
          value = { min: val1 };
        }
        break;
      case "lte":
        if (!Number.isNaN(val1)) {
          value = { max: val1 };
        }
        break;
      case "between":
        if (!Number.isNaN(val1) && !Number.isNaN(val2)) {
          value = { min: val1, max: val2 };
        } else if (filter.value1 || filter.value2) {
          // Partial input (transition state) — leave the existing filter intact
          return;
        }
        break;
    }

    if (value) {
      column.setFilterValue(JSON.stringify(value));
    } else {
      column.setFilterValue(undefined);
    }
  };

  return (
    <div className="space-y-2 pb-4">
      <div className="flex flex-row gap-2">
        {/* Search filter */}
        <Input
          placeholder="Search keywords..."
          value={(table.getColumn("keyword")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("keyword")?.setFilterValue(event.target.value)
          }
          className="w-full"
          type="search"
        />

        {/* Add filter button */}
        <Button
          variant="outline"
          onClick={addFilter}
          disabled={dynamicFilters.length >= columnOptions.length}
          className="flex items-center gap-2"
          aria-label="Add filter"
        >
          <Plus />
          <span className="hidden sm:block">Add filter</span>
        </Button>

        {/* Download button */}
        <DownloadModal
          canDownload={canDownload}
          email={email}
          totalRows={totalRows}
          handleDownload={handleDownload}
          isDownloadLoading={isDownloadLoading}
          filters={debouncedFilters}
        />

        {/* Options button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSettingsOpen(true)}
          aria-label="Options"
        >
          <Settings />
        </Button>
      </div>

      {/* Options modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent
          className="sm:max-w-xs gap-0 p-0 overflow-hidden"
          aria-describedby={undefined}
        >
          <DialogHeader className="px-5 pt-5 pb-4 border-b">
            <DialogTitle>Options</DialogTitle>
          </DialogHeader>

          <div className="px-5 py-4 space-y-5">
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
                    adultFilterValue == null
                      ? "undefined"
                      : adultFilterValue
                        ? "true"
                        : "false"
                  }
                  onValueChange={(val) => {
                    const col = table.getColumn("is_adult");
                    if (val === "undefined") {
                      col?.setFilterValue(undefined);
                    } else {
                      col?.setFilterValue(val === "true");
                    }
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

            <Separator />

            {/* Column visibility */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Columns
              </p>
              <div className="-mx-2">
                {table
                  .getAllColumns()
                  .filter((col) => col.getCanHide())
                  .map((col) => (
                    <label
                      key={col.id}
                      htmlFor={`col-${col.id}`}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/60 cursor-pointer transition-colors"
                    >
                      <span className="text-sm">
                        {columnLabels[col.id] ?? col.id}
                      </span>
                      <Checkbox
                        id={`col-${col.id}`}
                        checked={col.getIsVisible()}
                        onCheckedChange={(checked) =>
                          col.toggleVisibility(!!checked)
                        }
                        className="rounded-sm"
                      />
                    </label>
                  ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dynamic filters */}
      {dynamicFilters.length > 0 && (
        <div className="space-y-2">
          {dynamicFilters.map((filter) => (
            <div
              key={filter.id}
              className="flex items-center gap-2 rounded-lg bg-muted/30 p-3"
            >
              {/* Column selector */}
              <Select
                value={filter.column}
                onValueChange={(value: FilterColumn) =>
                  updateFilter(filter.id, { column: value })
                }
              >
                <SelectTrigger
                  className="flex-1 min-w-0"
                  aria-label="Select column"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columnOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={
                        option.value !== filter.column &&
                        dynamicFilters.some((f) => f.column === option.value)
                      }
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Operator selector */}
              <Select
                value={filter.operator}
                onValueChange={(value: FilterOperator) =>
                  updateFilter(filter.id, { operator: value })
                }
              >
                <SelectTrigger
                  className="flex-1 min-w-0"
                  aria-label="Select operator"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operatorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Value input(s) */}
              <div className="flex-2 space-y-1 min-w-0">
                <Input
                  type="number"
                  placeholder="Value"
                  value={filter.value1}
                  onChange={(e) =>
                    updateFilter(filter.id, { value1: e.target.value })
                  }
                  className={cn(
                    "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]",
                    {
                      "border-destructive focus-visible:ring-destructive":
                        filter.errors.value1,
                    },
                  )}
                />
              </div>

              {filter.operator === "between" && (
                <>
                  <span className="text-sm text-muted-foreground shrink-0">
                    and
                  </span>
                  <div className="flex-2 space-y-1 min-w-0">
                    <Input
                      type="number"
                      placeholder="Value"
                      value={filter.value2}
                      onChange={(e) =>
                        updateFilter(filter.id, { value2: e.target.value })
                      }
                      className={cn(
                        "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]",
                        {
                          "border-destructive focus-visible:ring-destructive":
                            filter.errors.value2,
                        },
                      )}
                    />
                  </div>
                </>
              )}

              {/* Delete button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFilter(filter.id)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove filter"
              >
                <X />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
