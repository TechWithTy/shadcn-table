"use client";

import type { Table } from "@tanstack/react-table";
import { Check, ChevronsUpDown, Settings2, GripVertical } from "lucide-react";
import * as React from "react";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { cn } from "../../lib/utils";
import { Sortable, SortableContent, SortableItem, SortableItemHandle } from "../ui/sortable";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const allColumns = table.getAllLeafColumns();
  const columns = React.useMemo(
    () => allColumns.filter((c) => c.getCanHide() && c.id !== "select"),
    [allColumns],
  );

  // Reorderable list state bound to current table order
  const currentOrder: string[] = React.useMemo(() => {
    const order = table.getState().columnOrder;
    return (order && order.length ? order : allColumns.map((c) => c.id)) as string[];
  }, [table, allColumns]);

  const reorderableIds = React.useMemo(() => new Set(columns.map((c) => c.id)), [columns]);
  const onlyReorderables = React.useMemo(
    () => currentOrder.filter((id) => reorderableIds.has(id)),
    [currentOrder, reorderableIds],
  );
  const [order, setOrder] = React.useState<string[]>(onlyReorderables);
  React.useEffect(() => setOrder(onlyReorderables), [onlyReorderables]);

  const applyOrder = React.useCallback(
    (next: string[]) => {
      const out: string[] = [...currentOrder];
      let idx = 0;
      for (let i = 0; i < out.length; i++) {
        const id = out[i];
        if (reorderableIds.has(id)) {
          const candidate = next[idx];
          out[i] = typeof candidate === "string" ? candidate : id;
          idx += 1;
        }
      }
      table.setColumnOrder(out);
    },
    [currentOrder, reorderableIds, table],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="Toggle columns"
          role="combobox"
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <Settings2 />
          View
          <ChevronsUpDown className="ml-auto opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-0">
        <div className="p-2">
          <Command>
            <CommandInput placeholder="Search columns..." />
            <CommandList>
              <CommandEmpty>No columns found.</CommandEmpty>
              <CommandGroup>
                {/* Sortable wrapper for reordering */}
                <Sortable value={order} onValueChange={setOrder} getItemValue={(id) => id}>
                  <SortableContent asChild>
                    <div>
                      {order.map((id) => {
                        const column = columns.find((c) => c.id === id);
                        if (!column) return null;
                        const label = column.columnDef.meta?.label ?? column.id;
                        return (
                          <SortableItem key={id} value={id} asChild>
                            <div className="flex items-center gap-2 rounded px-2 py-1">
                              <button
                                type="button"
                                className="flex-1 truncate text-left"
                                onClick={() => column.toggleVisibility(!column.getIsVisible())}
                              >
                                {label}
                              </button>
                              <Check className={cn("size-4", column.getIsVisible() ? "opacity-100" : "opacity-0")} />
                              <SortableItemHandle asChild>
                                <Button variant="ghost" size="icon" className="size-6">
                                  <GripVertical className="opacity-70" />
                                </Button>
                              </SortableItemHandle>
                            </div>
                          </SortableItem>
                        );
                      })}
                    </div>
                  </SortableContent>
                </Sortable>
              </CommandGroup>
            </CommandList>
          </Command>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOrder(onlyReorderables)}>Reset</Button>
            <Button size="sm" onClick={() => applyOrder(order)}>Apply</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
