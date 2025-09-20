"use client";

import type { ColumnDef } from "@tanstack/react-table";

// Global Transfer Agent column
export function buildGlobalTransferAgentColumn<TData>(): ColumnDef<TData> {
  return {
    id: "globalTransferAgentTitle",
    header: "Transfer Agent",
    accessorFn: (row) => {
      const r = row as unknown as Record<string, unknown>;
      const transfer = (r.transfer as { agentId?: string } | undefined) ?? undefined;
      const v =
        r.transferAgentTitle ??
        r.transferAgentName ??
        transfer?.agentId ??
        "";
      return typeof v === "string" ? v : String(v ?? "");
    },
    cell: ({ getValue }) => String(getValue() ?? ""), 
    enableColumnFilter: true,
    meta: { label: "Transfer Agent", variant: "text", placeholder: "Search transfer" },
    size: 180,
  } satisfies ColumnDef<TData>;
}
