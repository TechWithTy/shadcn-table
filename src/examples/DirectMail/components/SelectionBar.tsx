"use client";
import * as React from "react";
import type { Table } from "@tanstack/react-table";
import type { CallCampaign } from "../../../../../../types/_dashboard/campaign";
import { Button } from "../../../components/ui/button";
import { AIMenu } from "./AIMenu";
import { DataTableExportButton } from "../../../components/data-table/data-table-export-button";

export function SelectionBar<T extends CallCampaign>(props: {
  table: Table<T>;
  onUseSelected: () => void;
  onUseAll: () => void;
  filename: string;
}) {
  const { table, onUseAll, onUseSelected, filename } = props;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const allCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{selectedCount} selected</span>
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() => table.resetRowSelection()}
      >
        Clear
      </Button>
      <AIMenu
        selectedCount={selectedCount}
        allCount={allCount}
        onUseSelected={onUseSelected}
        onUseAll={onUseAll}
      />
      <DataTableExportButton table={table} filename={filename} excludeColumns={["select"]} />
    </div>
  );
}
