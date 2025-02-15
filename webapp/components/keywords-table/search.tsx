import { Input } from "@/components/ui/input";
import type { Keyword } from "@/lib/types";
import type { Table } from "@tanstack/react-table";

interface SearchProps {
  table: Table<Keyword>;
}

export function Search({ table }: SearchProps) {
  return (
    <div className="flex items-center py-4">
      <Input
        placeholder="Search"
        value={(table.getColumn("keyword")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("keyword")?.setFilterValue(event.target.value)
        }
        className="max-w-sm"
      />
    </div>
  );
}
