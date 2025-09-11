"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { ChevronsUpDown, GripVertical, PanelsTopLeft } from "lucide-react";

import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "../ui/sortable";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "../ui/command";
import { cn } from "../../lib/utils";

interface DataTableColumnOrderProps<TData> extends React.ComponentProps<typeof PopoverContent> {
  table: Table<TData>;
}

export function DataTableColumnOrder<TData>({ table, ...props }: DataTableColumnOrderProps<TData>) {
  const [open, setOpen] = React.useState(false);

  const allColumns = table.getAllLeafColumns();
  // Exclude selection and fixed action columns from reordering
  const reorderable = React.useMemo(
    () =>
      allColumns
        .filter((c) => c.getCanHide() && c.id !== "select" && c.id !== "actions")
        .map((c) => ({ id: c.id, label: String(c.columnDef.meta?.label ?? c.id) })),
    [allColumns],
  );

  const currentOrder = table.getState().columnOrder?.length
    ? table.getState().columnOrder
    : allColumns.map((c) => c.id);

  // Keep non-reorderable at their positions, just manage order among reorderables
  const reorderableIds = new Set(reorderable.map((r) => r.id));
  const onlyReorderables = currentOrder.filter((id) => reorderableIds.has(id));

  const [order, setOrder] = React.useState<string[]>(onlyReorderables);

  React.useEffect(() => {
    setOrder(onlyReorderables);
  }, [onlyReorderables.join(",")]);

  const applyOrder = (next: string[]) => {
    // Build full order by merging back non-reorderables in original relative positions
    const full: string[] = [];
    const nextSet = new Set(next);
    for (const id of currentOrder) {
      if (!reorderableIds.has(id)) full.push(id);
    }
    // Insert reorderables keeping their new order relative to each other, but maintain overall sequence:
    // We place reorderables in the sequence: select, then any non-reorderables encountered until the first reorderable, then reorderables, etc.
    // Simpler: start from currentOrder and replace reorderable ids in iteration order with items from next
    const out = [...currentOrder];
    let idx = 0;
    for (let i = 0; i < out.length; i++) {
      if (reorderableIds.has(out[i])) {
        out[i] = next[idx++] ?? out[i];
      }
    }
    table.setColumnOrder(out);
  };

  const [query, setQuery] = React.useState("");
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reorderable;
    return reorderable.filter((c) => c.label.toLowerCase().includes(q));
  }, [reorderable, query]);

  return (
    <Sortable value={order} onValueChange={(v) => setOrder(v)} getItemValue={(id) => id}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <PanelsTopLeft className="mr-1 h-4 w-4" /> Columns
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-full max-w-[var(--radix-popover-content-available-width)] origin-[var(--radix-popover-content-transform-origin)] flex-col gap-3.5 p-4 sm:min-w-[360px]" align="end" {...props}>
          <div className="flex items-center justify-between">
            <h4 className="font-medium leading-none">Column order</h4>
          </div>
          <Command>
            <CommandInput value={query} onValueChange={setQuery} placeholder="Search columns..." />
            <CommandList className="hidden" />
          </Command>
          <SortableContent asChild>
            <ul className="flex max-h-[300px] flex-col gap-2 overflow-y-auto p-1">
              {filtered.map((c) => (
                <SortableItem key={c.id} value={c.id} asChild>
                  <li className="flex items-center gap-2 rounded border bg-card p-2">
                    <span className="truncate">{c.label}</span>
                    <span className="ml-auto opacity-60">{c.id}</span>
                    <SortableItemHandle asChild>
                      <Button variant="outline" size="icon" className="size-8 shrink-0 rounded">
                        <GripVertical />
                      </Button>
                    </SortableItemHandle>
                  </li>
                </SortableItem>
              ))}
            </ul>
          </SortableContent>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOrder(onlyReorderables);
                applyOrder(onlyReorderables);
              }}
            >
              Reset
            </Button>
            <Button size="sm" onClick={() => applyOrder(order)}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <SortableOverlay>
        <div className="flex items-center gap-2">
          <div className="h-8 w-[180px] rounded-sm bg-primary/10" />
          <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
        </div>
      </SortableOverlay>
    </Sortable>
  );
}
