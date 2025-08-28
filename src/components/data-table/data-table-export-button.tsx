"use client";

import type { Table } from "@tanstack/react-table";
import { Download, FileArchive, FileDown, Rows } from "lucide-react";
import * as React from "react";

import { exportTableToCSV, exportTableToExcel, exportTablesToZipExcel, exportTableToZipCSV } from "../../lib/export";
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
  // Optional: provide multiple tables to export as ZIP of Excels
  excelZipItems?: Array<{
    table: Table<TData>;
    filename: string;
    excludeColumns?: (keyof TData | "select" | "actions")[];
    mode?: "page" | "selected" | "all";
    sheetName?: string;
  }>;
}

export function DataTableExportButton<TData>({
  table,
  filename = "table",
  excludeColumns = [],
  excelZipItems,
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

  const onExportExcelAll = React.useCallback(async () => {
    await exportTableToExcel(table, {
      filename: `${filename}-all`,
      excludeColumns,
      mode: "all",
      sheetName: "Leads",
    });
  }, [table, filename, excludeColumns]);

  const onExportExcelSelected = React.useCallback(async () => {
    await exportTableToExcel(table, {
      filename: `${filename}-selected`,
      excludeColumns,
      mode: "selected",
      sheetName: "Leads",
    });
  }, [table, filename, excludeColumns]);

  const onExportExcelPage = React.useCallback(async () => {
    await exportTableToExcel(table, {
      filename: `${filename}-page`,
      excludeColumns,
      mode: "page",
      sheetName: "Leads",
    });
  }, [table, filename, excludeColumns]);

  const onExportZipExcels = React.useCallback(async () => {
    if (!excelZipItems || excelZipItems.length === 0) return;
    await exportTablesToZipExcel(excelZipItems, `${filename}-excel`);
  }, [excelZipItems, filename]);

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
        <DropdownMenuItem onClick={onExportExcelPage}>
          <FileDown />
          Excel (Current Page)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportExcelSelected} disabled={table.getFilteredSelectedRowModel().rows.length === 0}>
          <FileDown />
          Excel (Selected Rows)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportExcelAll}>
          <FileDown />
          Excel (All Rows)
        </DropdownMenuItem>
        {excelZipItems && excelZipItems.length > 0 && (
          <DropdownMenuItem onClick={onExportZipExcels}>
            <FileArchive />
            ZIP of Excels
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onExportZipCsvAll}>
          <FileArchive />
          ZIP of CSVs (All Rows)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
