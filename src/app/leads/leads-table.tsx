"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/data-table/data-table";
import { DataTableAdvancedToolbar } from "../../components/data-table/data-table-advanced-toolbar";
import { DataTableExportButton } from "../../components/data-table/data-table-export-button";
import { DataTableSortList } from "../../components/data-table/data-table-sort-list";
import { DataTableRowModalCarousel } from "../../components/data-table/data-table-row-modal-carousel";
import { useDataTable } from "../../hooks/use-data-table";
import { useRowCarousel } from "../../hooks/use-row-carousel";
import type { Lead } from "./_lib/mock";
import { makeLeads } from "./_lib/mock";
import { getLeadColumns } from "./columns";

export function LeadsTable() {
  const data = React.useMemo<Lead[]>(() => makeLeads(200), []);
  const columns = React.useMemo<ColumnDef<Lead>[]>(() => getLeadColumns(), []);

  const { table } = useDataTable<Lead>({
    data,
    columns,
    pageCount: Math.ceil(data.length / 10),
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  });

  const carousel = useRowCarousel(table, { loop: true });

  // Example of multi-list Excel ZIP: statuses as separate files (each filtered by status)
  const excelZipItems = React.useMemo(() => {
    const statuses: Lead["status"][] = ["new", "contacted", "qualified", "lost"];
    return statuses.map((s) => ({
      table,
      filename: `leads-${s}`,
      excludeColumns: ["select", "actions"] as any,
      mode: "all" as const,
      sheetName: s,
    }));
  }, [table]);

  return (
    <>
      <DataTable
        table={table}
        onRowClick={(row) => carousel.openAt(row)}
      >
        <DataTableAdvancedToolbar table={table}>
          <DataTableSortList table={table} align="start" />
          <DataTableExportButton table={table} filename="leads" excelZipItems={excelZipItems} />
        </DataTableAdvancedToolbar>
      </DataTable>
      <DataTableRowModalCarousel
        table={table}
        open={carousel.open}
        onOpenChange={carousel.setOpen}
        index={carousel.index}
        setIndex={carousel.setIndex}
        rows={carousel.rows}
        onPrev={carousel.prev}
        onNext={carousel.next}
        title={(row) => row.original.name}
        description={(row) => `${row.original.email} • ${row.original.phone}`}
        render={(row) => (
          <div className="grid gap-2">
            <div className="text-sm"><strong>Status:</strong> {row.original.status}</div>
            <div className="text-sm"><strong>Score:</strong> {row.original.score}</div>
            <div className="text-sm"><strong>Nested:</strong> {row.original.nested?.length ?? 0} items</div>
            {row.original.nested && row.original.nested.length > 0 && (
              <div className="rounded-md border p-2">
                <div className="text-xs font-medium mb-1">Recent Notes</div>
                <ul className="space-y-1">
                  {row.original.nested.map((n) => (
                    <li key={n.id} className="text-xs text-muted-foreground">{n.note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      />
    </>
  );
}
