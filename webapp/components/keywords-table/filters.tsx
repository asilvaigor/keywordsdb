import type { Table } from "@tanstack/react-table";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KeywordRow } from "@/lib/types";

interface Props {
  table: Table<KeywordRow>;
}

type FilterOperator = "eq" | "gte" | "lte" | "between";
type FilterColumn = "avg_monthly_searches" | "competition_index" | "cpc_high";

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

export function Filters({ table }: Props) {
  const [dynamicFilters, setDynamicFilters] = useState<DynamicFilter[]>([]);

  const columnOptions = [
    { value: "avg_monthly_searches", label: "Volume" },
    { value: "competition_index", label: "Competition" },
    { value: "cpc_high", label: "CPC ($)" },
  ] as const;

  const operatorOptions = [
    { value: "eq", label: "Equals" },
    { value: "gte", label: "Greater Than or Equal" },
    { value: "lte", label: "Less Than or Equal" },
    { value: "between", label: "Between" },
  ] as const;

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
    const newFilter: DynamicFilter = {
      id: Date.now().toString(),
      column: "avg_monthly_searches",
      operator: "eq",
      value1: "",
      value2: "",
      errors: {},
    };
    setDynamicFilters([...dynamicFilters, newFilter]);
  };

  const removeFilter = (id: string) => {
    const filterToRemove = dynamicFilters.find((f) => f.id === id);
    if (filterToRemove) {
      // Clear the filter from the table
      const column = table.getColumn(filterToRemove.column);
      column?.setFilterValue(undefined);
    }

    setDynamicFilters(dynamicFilters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<DynamicFilter>) => {
    const updatedFilters = dynamicFilters.map((filter) => {
      if (filter.id === id) {
        const updatedFilter = { ...filter, ...updates };
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
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-2">
        {/* Search filter */}
        <Input
          placeholder="Search keywords..."
          value={(table.getColumn("keyword")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("keyword")?.setFilterValue(event.target.value)
          }
          className="max-w-full"
        />
        {/* Add filter button */}
        <Button
          variant="outline"
          onClick={addFilter}
          className="flex items-center gap-2"
        >
          <Plus />
          Add filter
        </Button>
      </div>

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
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columnOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
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
                <SelectTrigger className="flex-1">
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
              <div className="flex-2 space-y-1">
                <Input
                  type="number"
                  placeholder="Value"
                  value={filter.value1}
                  onChange={(e) =>
                    updateFilter(filter.id, { value1: e.target.value })
                  }
                  className={`[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${filter.errors.value1 ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </div>

              {filter.operator === "between" && (
                <>
                  <span className="text-sm text-muted-foreground shrink-0">
                    and
                  </span>
                  <div className="flex-2 space-y-1">
                    <Input
                      type="number"
                      placeholder="Value"
                      value={filter.value2}
                      onChange={(e) =>
                        updateFilter(filter.id, { value2: e.target.value })
                      }
                      className={`[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${filter.errors.value2 ? "border-destructive focus-visible:ring-destructive" : ""}`}
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
