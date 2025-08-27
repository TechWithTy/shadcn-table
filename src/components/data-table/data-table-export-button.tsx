"use client";

import type { Table } from "@tanstack/react-table";
import { Download, FileArchive, FileDown, Rows } from "lucide-react";
import * as React from "react";

import { exportTableToCSV, exportTableToZipCSV } from "../../lib/export";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface DataTableExportButtonProps<TData>
  extends React.ComponentProps<typeof Button> {
  table: Table<TData>;
  filename?: string;
  excludeColumns?: (keyof TData | "select" | "actions")[];
}

export function DataTableExportButton<TData>({
  table,
  filename = "table",
  excludeColumns = [],
  className,
  ...props
}: DataTableExportButtonProps<TData>) {
  const onExportCsvPage = React.useCallback(() => {
    exportTableToCSV(table, {
      filename,
      excludeColumns,
      mode: "page",
    });
  }, [table, filename, excludeColumns]);

  const onExportCsvSelected = React.useCallback(() => {
    exportTableToCSV(table, {
      filename: `${filename}-selected`,
      excludeColumns,
      mode: "selected",
    });
  }, [table, filename, excludeColumns]);

  const onExportCsvAll = React.useCallback(() => {
    exportTableToCSV(table, {
      filename: `${filename}-all`,
      excludeColumns,
      mode: "all",
    });
  }, [table, filename, excludeColumns]);

  const onExportZipCsvAll = React.useCallback(async () => {
    await exportTableToZipCSV(table, {
      filename: `${filename}-csv`,
      excludeColumns,
      mode: "all",
      chunkSize: 5000,
      filePrefix: "rows",
    });
  }, [table, filename, excludeColumns]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className} {...props}>
          <Download />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export</DropdownMenuLabel>
        <DropdownMenuItem onClick={onExportCsvPage}>
          <Rows />
          CSV (Current Page)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportCsvSelected} disabled={table.getFilteredSelectedRowModel().rows.length === 0}>
          <FileDown />
          CSV (Selected Rows)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportCsvAll}>
          <FileDown />
          CSV (All Rows)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onExportZipCsvAll}>
          <FileArchive />
          ZIP of CSVs (All Rows)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
