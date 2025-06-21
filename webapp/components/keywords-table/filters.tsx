import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KeywordRow } from "@/lib/types";
import type { Table } from "@tanstack/react-table";
import { useState } from "react";

interface Props {
  table: Table<KeywordRow>;
}

type FilterOperator = "eq" | "gte" | "lte" | "between";

interface NumberFilter {
  operator: FilterOperator;
  value1: string;
  value2: string;
}

export function Filters({ table }: Props) {
  const [avgMonthlySearchesFilter, setAvgMonthlySearchesFilter] =
    useState<NumberFilter>({
      operator: "eq",
      value1: "",
      value2: "",
    });

  const [competitionIndexFilter, setCompetitionIndexFilter] =
    useState<NumberFilter>({
      operator: "eq",
      value1: "",
      value2: "",
    });

  const [cpcHighFilter, setCpcHighFilter] = useState<NumberFilter>({
    operator: "eq",
    value1: "",
    value2: "",
  });

  const applyNumberFilter = (columnId: string, filter: NumberFilter) => {
    const column = table.getColumn(columnId);
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
        value = { min: val1, max: val1 };
        break;
      case "gte":
        value = { min: val1 };
        break;
      case "lte":
        value = { max: val1 };
        break;
      case "between":
        value = { min: val1, max: val2 };
        break;
    }
    column.setFilterValue(JSON.stringify(value));
  };

  const updateFilter = (
    columnId: string,
    filter: NumberFilter,
    setFilter: (filter: NumberFilter) => void,
    updates: Partial<NumberFilter>,
  ) => {
    const newFilter = { ...filter, ...updates };
    setFilter(newFilter);
    applyNumberFilter(columnId, newFilter);
  };

  const renderNumberFilter = (
    label: string,
    columnId: string,
    filter: NumberFilter,
    setFilter: (filter: NumberFilter) => void,
  ) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <Select
          value={filter.operator}
          onValueChange={(value: FilterOperator) =>
            updateFilter(columnId, filter, setFilter, { operator: value })
          }
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="eq">Equals</SelectItem>
            <SelectItem value="gte">≥</SelectItem>
            <SelectItem value="lte">≤</SelectItem>
            <SelectItem value="between">Between</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="Value"
          value={filter.value1}
          onChange={(e) =>
            updateFilter(columnId, filter, setFilter, {
              value1: e.target.value,
            })
          }
          className="w-24"
        />

        {filter.operator === "between" && (
          <>
            <span className="text-sm text-muted-foreground">and</span>
            <Input
              type="number"
              placeholder="Value"
              value={filter.value2}
              onChange={(e) =>
                updateFilter(columnId, filter, setFilter, {
                  value2: e.target.value,
                })
              }
              className="w-24"
            />
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 py-4">
      {/* Search filter */}
      <div>
        <Input
          placeholder="Search keywords..."
          value={(table.getColumn("keyword")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("keyword")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

      {/* Number filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderNumberFilter(
          "Volume",
          "avg_monthly_searches",
          avgMonthlySearchesFilter,
          setAvgMonthlySearchesFilter,
        )}

        {renderNumberFilter(
          "Competition",
          "competition_index",
          competitionIndexFilter,
          setCompetitionIndexFilter,
        )}

        {renderNumberFilter(
          "CPC ($)",
          "cpc_high",
          cpcHighFilter,
          setCpcHighFilter,
        )}
      </div>
    </div>
  );
}
