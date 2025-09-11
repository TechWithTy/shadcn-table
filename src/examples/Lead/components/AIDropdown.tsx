"use client";

import * as React from "react";
import { Wand2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import type { Table } from "@tanstack/react-table";
import type { DemoRow } from "../types";

interface AIDropdownProps {
  table: Table<DemoRow>;
  setAiOpen: (open: boolean) => void;
  setAiRows: (rows: DemoRow[]) => void;
  getSelectedRows: () => DemoRow[];
  getAllRows: () => DemoRow[];
}

export function AIDropdown({
  table,
  setAiOpen,
  setAiRows,
  getSelectedRows,
  getAllRows,
}: AIDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="sm" className="bg-purple-600 text-white hover:bg-purple-700">
          <Wand2 className="mr-1 h-4 w-4" /> AI
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Run AI on</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={table.getFilteredSelectedRowModel().rows.length === 0}
          onSelect={() => {
            const rows = getSelectedRows();
            if (rows.length === 0) return;
            setAiRows(rows);
            setAiOpen(true);
          }}
        >
          Use Selected ({table.getFilteredSelectedRowModel().rows.length})
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            const rows = getAllRows();
            setAiRows(rows);
            setAiOpen(true);
          }}
        >
          Use All ({table.getFilteredRowModel().rows.length})
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
