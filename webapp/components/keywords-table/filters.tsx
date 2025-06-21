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
import type { Table } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

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
    { value: "gte", label: "≥" },
    { value: "lte", label: "≤" },
    { value: "between", label: "Between" },
  ] as const;

  const addFilter = () => {
    const newFilter: DynamicFilter = {
      id: Date.now().toString(),
      column: "avg_monthly_searches",
      operator: "eq",
      value1: "",
      value2: "",
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
    const updatedFilters = dynamicFilters.map((filter) =>
      filter.id === id ? { ...filter, ...updates } : filter,
    );
    setDynamicFilters(updatedFilters);

    // Apply the filter to the table
    const filter = updatedFilters.find((f) => f.id === id);
    if (filter) {
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

    let value = undefined;
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
          className="max-w-sm"
        />
        {/* Add filter button */}
        <Button
          variant="outline"
          size="sm"
          onClick={addFilter}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
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
              <Input
                type="number"
                placeholder="Value"
                value={filter.value1}
                onChange={(e) =>
                  updateFilter(filter.id, { value1: e.target.value })
                }
                className="flex-2 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />

              {filter.operator === "between" && (
                <>
                  <span className="text-sm text-muted-foreground flex-shrink-0">
                    and
                  </span>
                  <Input
                    type="number"
                    placeholder="Value"
                    value={filter.value2}
                    onChange={(e) =>
                      updateFilter(filter.id, { value2: e.target.value })
                    }
                    className="flex-2 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                </>
              )}

              {/* Delete button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter(filter.id)}
                className="h-8 w-8 p-0 flex-shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
