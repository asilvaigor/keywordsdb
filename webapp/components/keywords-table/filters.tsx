"use no memo"; // https://github.com/shadcn-ui/ui/issues/3905

import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ListFilterPlus, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KeywordFilters, KeywordRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { columnLabels } from "./columns";
import { DownloadModal } from "./download-modal";
import OptionsModal from "./options-modal";

type FilterOperator = "eq" | "gte" | "lte" | "between";
type FilterColumnType = "numeric" | "boolean" | "categorical";
type FilterColumn =
  | "volume_estimated_google"
  | "volume_google"
  | "volume_bing"
  | "competition_index"
  | "cpc_high"
  | "is_question"
  | "is_comparison"
  | "is_branded"
  | "intent"
  | "entity_type"
  | "saas_potential";

interface DynamicFilter {
  id: string;
  column: FilterColumn;
  operator: FilterOperator;
  value1: string;
  value2: string;
}

const intentOptions = [
  { value: "informational", label: "Informational" },
  { value: "navigational", label: "Navigational" },
  { value: "transactional", label: "Transactional" },
  { value: "commercial", label: "Commercial" },
];
const entityTypeOptions = [
  { value: "person", label: "Person" },
  { value: "event", label: "Event" },
  { value: "location", label: "Location" },
  { value: "company", label: "Company" },
  { value: "product", label: "Product" },
  { value: "other", label: "Other" },
];
const saasPotentialOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
const booleanOptions = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

const filterColumns: {
  value: FilterColumn;
  label: string;
  type: FilterColumnType;
  options?: { value: string; label: string }[];
}[] = [
  {
    value: "volume_estimated_google",
    label: columnLabels.volume_estimated_google.title,
    type: "numeric",
  },
  {
    value: "volume_google",
    label: columnLabels.volume_google.title,
    type: "numeric",
  },
  {
    value: "volume_bing",
    label: columnLabels.volume_bing.title,
    type: "numeric",
  },
  {
    value: "competition_index",
    label: columnLabels.competition_index.title,
    type: "numeric",
  },
  { value: "cpc_high", label: columnLabels.cpc_high.title, type: "numeric" },
  {
    value: "is_question",
    label: columnLabels.is_question.title,
    type: "boolean",
    options: booleanOptions,
  },
  {
    value: "is_comparison",
    label: columnLabels.is_comparison.title,
    type: "boolean",
    options: booleanOptions,
  },
  {
    value: "is_branded",
    label: columnLabels.is_branded.title,
    type: "boolean",
    options: booleanOptions,
  },
  {
    value: "intent",
    label: columnLabels.intent.title,
    type: "categorical",
    options: intentOptions,
  },
  {
    value: "entity_type",
    label: columnLabels.entity_type.title,
    type: "categorical",
    options: entityTypeOptions,
  },
  {
    value: "saas_potential",
    label: columnLabels.saas_potential.title,
    type: "categorical",
    options: saasPotentialOptions,
  },
];

const operatorLabels: Record<FilterOperator, string> = {
  eq: "=",
  gte: "≥",
  lte: "≤",
  between: "between",
};

const operatorOptions = [
  { value: "eq", label: "Equals" },
  { value: "gte", label: "Greater Than or Equal" },
  { value: "lte", label: "Less Than or Equal" },
  { value: "between", label: "Between" },
] as const;

function getColumnMeta(column: FilterColumn) {
  return filterColumns.find((c) => c.value === column);
}

function formatFilterLabel(filter: DynamicFilter): string {
  const col = getColumnMeta(filter.column);
  const label = col?.label ?? filter.column;
  if (col?.type === "boolean") {
    const opt = col.options?.find((o) => o.value === filter.value1);
    return `${label}: ${opt?.label ?? filter.value1}`;
  }
  if (col?.type === "categorical") {
    const opt = col.options?.find((o) => o.value === filter.value1);
    return `${label}: ${opt?.label ?? filter.value1}`;
  }
  if (filter.operator === "between") {
    return `${label}: ${filter.value1}–${filter.value2}`;
  }
  return `${label} ${operatorLabels[filter.operator]} ${filter.value1}`;
}

function validateFilter(filter: DynamicFilter): {
  value1?: string;
  value2?: string;
} {
  const col = getColumnMeta(filter.column);
  if (col?.type === "boolean" || col?.type === "categorical") return {};

  const errors: { value1?: string; value2?: string } = {};
  const val1 = Number.parseFloat(filter.value1);
  const val2 = Number.parseFloat(filter.value2);

  if (filter.value1 && !Number.isNaN(val1) && val1 < 0) {
    errors.value1 = "Value cannot be negative";
  }
  if (filter.value2 && !Number.isNaN(val2) && val2 < 0) {
    errors.value2 = "Value cannot be negative";
  }
  if (
    filter.operator === "between" &&
    filter.value1 &&
    filter.value2 &&
    !Number.isNaN(val1) &&
    !Number.isNaN(val2) &&
    val1 > val2
  ) {
    errors.value1 = "Min must be ≤ max";
    errors.value2 = "Max must be ≥ min";
  }
  return errors;
}

function buildDynamicFilters(defaultFilters?: KeywordFilters): DynamicFilter[] {
  if (!defaultFilters) {
    return [];
  }

  return Object.entries(defaultFilters).reduce<DynamicFilter[]>(
    (acc, [key, value]) => {
      if (value == null || key === "keyword" || key === "is_adult") {
        return acc;
      }

      const column = key as FilterColumn;
      const meta = getColumnMeta(column);
      if (!meta) {
        return acc;
      }

      if (meta.type === "numeric" && typeof value === "object") {
        const { min, max } = value as { min?: number; max?: number };
        if (min == null && max == null) {
          return acc;
        }

        if (min != null && max != null) {
          acc.push({
            id: `default-${column}`,
            column,
            operator: min === max ? "eq" : "between",
            value1: `${min}`,
            value2: min === max ? "" : `${max}`,
          });
          return acc;
        }

        acc.push({
          id: `default-${column}`,
          column,
          operator: min != null ? "gte" : "lte",
          value1: `${min ?? max}`,
          value2: "",
        });
        return acc;
      }

      acc.push({
        id: `default-${column}`,
        column,
        operator: "eq",
        value1: value.toString(),
        value2: "",
      });
      return acc;
    },
    [],
  );
}

function FilterPopoverContent({
  initial,
  visibleColumns,
  onApply,
}: {
  initial?: DynamicFilter;
  visibleColumns: FilterColumn[];
  onApply: (filter: DynamicFilter) => void;
}) {
  const [view, setView] = useState<"columns" | "form">(
    initial ? "form" : "columns",
  );
  const defaultColumn =
    initial?.column ?? visibleColumns[0] ?? "volume_estimated_google";
  const [column, setColumn] = useState<FilterColumn>(defaultColumn);
  const [operator, setOperator] = useState<FilterOperator>(
    initial?.operator ?? "gte",
  );
  const [value1, setValue1] = useState(initial?.value1 ?? "");
  const [value2, setValue2] = useState(initial?.value2 ?? "");

  const colMeta = getColumnMeta(column);
  const colType = colMeta?.type ?? "numeric";

  const draft: DynamicFilter = {
    id: initial?.id ?? "",
    column,
    operator,
    value1,
    value2,
  };
  const errors = validateFilter(draft);
  const hasErrors = Object.keys(errors).length > 0;
  const isEmpty =
    colType === "numeric"
      ? !value1 && (operator !== "between" || !value2)
      : !value1;

  if (view === "columns") {
    return (
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground px-2">
          Filter by
        </span>
        <div className="flex flex-col mt-1">
          {filterColumns
            .filter(
              (opt) =>
                opt.value !== "volume_bing" ||
                visibleColumns.includes(opt.value),
            )
            .map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-left"
                onClick={() => {
                  setColumn(opt.value);
                  setValue1("");
                  setValue2("");
                  setOperator("gte");
                  setView("form");
                }}
              >
                {opt.label}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-1">
      <div className="flex items-center gap-1 -ml-1">
        <button
          type="button"
          onClick={() => setView("columns")}
          className="rounded-sm p-1 hover:bg-accent"
          aria-label="Back to column selection"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">{colMeta?.label}</span>
      </div>

      {colType === "numeric" && (
        <>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Operator
            </span>
            <Select
              value={operator}
              onValueChange={(v: FilterOperator) => {
                if (operator === "lte" && v === "between") {
                  setValue2(value1);
                  setValue1("");
                } else if (operator === "between" && v === "lte") {
                  setValue1(value2);
                  setValue2("");
                }
                setOperator(v);
              }}
            >
              <SelectTrigger className="w-full" aria-label="Select operator">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operatorOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {operator === "between" ? "Min value" : "Value"}
            </span>
            <Input
              type="number"
              placeholder="Value"
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              className={cn(
                "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]",
                {
                  "border-destructive focus-visible:ring-destructive":
                    errors.value1,
                },
              )}
            />
            {errors.value1 && (
              <p className="text-xs text-destructive">{errors.value1}</p>
            )}
          </div>

          {operator === "between" && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Max value
              </span>
              <Input
                type="number"
                placeholder="Value"
                value={value2}
                onChange={(e) => setValue2(e.target.value)}
                className={cn(
                  "[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]",
                  {
                    "border-destructive focus-visible:ring-destructive":
                      errors.value2,
                  },
                )}
              />
              {errors.value2 && (
                <p className="text-xs text-destructive">{errors.value2}</p>
              )}
            </div>
          )}
        </>
      )}

      {(colType === "boolean" || colType === "categorical") &&
        colMeta?.options && (
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Value
            </span>
            <RadioGroup
              value={value1}
              onValueChange={(v) => setValue1(v)}
              className="mt-1"
            >
              {colMeta.options.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem
                    id={`filter-${opt.value}`}
                    value={opt.value}
                  />
                  <Label
                    className="cursor-pointer"
                    htmlFor={`filter-${opt.value}`}
                  >
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

      <Button
        className="w-full"
        size="sm"
        disabled={hasErrors || isEmpty}
        onClick={() => onApply(draft)}
      >
        Apply
      </Button>
    </div>
  );
}

function applyFilterToTable(table: Table<KeywordRow>, filter: DynamicFilter) {
  const column = table.getColumn(filter.column);
  if (!column) return;

  if (!filter.value1 && !filter.value2) {
    column.setFilterValue(undefined);
    return;
  }

  const colMeta = getColumnMeta(filter.column);

  if (colMeta?.type === "boolean" || colMeta?.type === "categorical") {
    column.setFilterValue(filter.value1);
    return;
  }

  const val1 = Number.parseFloat(filter.value1);
  const val2 = Number.parseFloat(filter.value2);

  let value: { min?: number; max?: number } | null = null;
  switch (filter.operator) {
    case "eq":
      if (!Number.isNaN(val1)) value = { min: val1, max: val1 };
      break;
    case "gte":
      if (!Number.isNaN(val1)) value = { min: val1 };
      break;
    case "lte":
      if (!Number.isNaN(val1)) value = { max: val1 };
      break;
    case "between":
      if (!Number.isNaN(val1) && !Number.isNaN(val2))
        value = { min: val1, max: val2 };
      break;
  }

  if (value) {
    column.setFilterValue(JSON.stringify(value));
  } else {
    column.setFilterValue(undefined);
  }
}

export function Filters({
  table,
  totalRows,
  isMaxPlan,
  isSample,
  email,
  handleDownload,
  isDownloadLoading,
  debouncedFilters,
  defaultFilters,
}: {
  table: Table<KeywordRow>;
  totalRows?: number;
  isMaxPlan: boolean;
  isSample: boolean;
  email?: string;
  handleDownload: (format: "parquet" | "csv") => void;
  isDownloadLoading: boolean;
  debouncedFilters: KeywordFilters;
  defaultFilters?: KeywordFilters;
}) {
  const [dynamicFilters, setDynamicFilters] = useState<DynamicFilter[]>(() =>
    buildDynamicFilters(defaultFilters),
  );
  const [addPopoverOpen, setAddPopoverOpen] = useState(false);
  const [editPopoverId, setEditPopoverId] = useState<string | null>(null);

  const visibleFilterColumns = filterColumns
    .map((c) => c.value)
    .filter((v) => table.getColumn(v)?.getIsVisible());

  const upsertFilter = (draft: DynamicFilter) => {
    // Replace existing filter on the same column, or add new
    const existing = dynamicFilters.find((f) => f.column === draft.column);
    let updated: DynamicFilter[];
    if (existing) {
      // Clear old column table filter if column changed
      if (draft.column !== existing.column) {
        table.getColumn(existing.column)?.setFilterValue(undefined);
      }
      updated = dynamicFilters.map((f) =>
        f.column === draft.column ? { ...draft, id: existing.id } : f,
      );
    } else {
      updated = [...dynamicFilters, { ...draft, id: Date.now().toString() }];
    }
    setDynamicFilters(updated);

    const applied = updated.find((f) => f.column === draft.column);
    if (applied) applyFilterToTable(table, applied);

    setAddPopoverOpen(false);
    setEditPopoverId(null);
  };

  const removeFilter = (id: string) => {
    const f = dynamicFilters.find((f) => f.id === id);
    if (f) table.getColumn(f.column)?.setFilterValue(undefined);
    setDynamicFilters(dynamicFilters.filter((f) => f.id !== id));
    setEditPopoverId(null);
  };

  return (
    <div className="space-y-2.5 pb-4">
      <div className="flex flex-row gap-2">
        {/* Search filter */}
        <Input
          id="keyword-filter"
          placeholder="Search keywords..."
          value={(table.getColumn("keyword")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("keyword")?.setFilterValue(event.target.value)
          }
          className="w-full"
          type="search"
        />

        {/* Add filter button */}
        <Popover open={addPopoverOpen} onOpenChange={setAddPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              aria-label="Add filter"
            >
              <ListFilterPlus />
              <span className="hidden sm:block">Add filter</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <FilterPopoverContent
              visibleColumns={visibleFilterColumns}
              onApply={upsertFilter}
            />
          </PopoverContent>
        </Popover>

        {/* Download button */}
        <DownloadModal
          canDownload={isSample || isMaxPlan}
          email={email}
          totalRows={totalRows}
          handleDownload={handleDownload}
          isDownloadLoading={isDownloadLoading}
          filters={debouncedFilters}
        />

        {/* Options button */}
        <OptionsModal
          table={table}
          isSample={isSample}
          canAccessBingData={isSample || isMaxPlan}
          email={email}
        />
      </div>

      {/* Active filter badges */}
      {dynamicFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {dynamicFilters.map((filter) => (
            <Popover
              key={filter.id}
              open={editPopoverId === filter.id}
              onOpenChange={(open) => setEditPopoverId(open ? filter.id : null)}
            >
              <PopoverTrigger asChild>
                <Badge
                  variant="secondary"
                  className="cursor-pointer select-none gap-1.5 pr-1 text-sm h-7"
                >
                  {formatFilterLabel(filter)}
                  <button
                    type="button"
                    aria-label="Remove filter"
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFilter(filter.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <FilterPopoverContent
                  initial={filter}
                  visibleColumns={visibleFilterColumns}
                  onApply={upsertFilter}
                />
              </PopoverContent>
            </Popover>
          ))}
        </div>
      )}
    </div>
  );
}
