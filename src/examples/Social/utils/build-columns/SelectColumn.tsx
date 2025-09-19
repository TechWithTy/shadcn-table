import type * as React from "react";
import type { ColumnDef, Table } from "@tanstack/react-table";
import { Checkbox } from "../../../../components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import type { SocialRow } from "./types";

interface SelectColumnHeaderProps {
  table: Table<SocialRow>;
}

export const SelectColumnHeader = ({ table }: SelectColumnHeaderProps) => (
  <div className="flex items-center gap-2 pl-2">
    <div className="grid h-5 w-5 place-items-center">
      <Checkbox
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value: CheckedState) =>
          table.toggleAllPageRowsSelected(!!value)
        }
        aria-label="Select all"
        className="grid h-4 w-4 place-items-center leading-none"
      />
    </div>
    <span className="select-none text-muted-foreground text-xs">
      Select
    </span>
  </div>
);

interface SelectColumnCellProps {
  row: { getIsSelected: () => boolean; toggleSelected: (value: boolean) => void };
}

export const SelectColumnCell = ({ row }: SelectColumnCellProps) => (
  <div className="grid h-10 place-items-center">
    <Checkbox
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      checked={row.getIsSelected()}
      onCheckedChange={(value: CheckedState) =>
        row.toggleSelected(!!value)
      }
      aria-label="Select row"
      className="grid h-4 w-4 place-items-center leading-none"
    />
  </div>
);

export const selectColumn: ColumnDef<SocialRow> = {
  id: "select",
  header: ({ table }) => <SelectColumnHeader table={table} />,
  cell: ({ row }) => <SelectColumnCell row={row} />,
  enableSorting: false,
  enableHiding: false,
  size: 48,
};
