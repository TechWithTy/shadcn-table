"use client";

import type { ColumnDef } from "@tanstack/react-table";

// Global Goal column (truncated)
function truncate(s: string, max = 40) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function buildGlobalGoalColumn<TData>(): ColumnDef<TData> {
  return {
    id: "globalCampaignGoal",
    header: "Goal",
    accessorFn: (row) => {
      const r = row as unknown as Record<string, unknown>;
      const v = r.goal ?? r.campaignGoal ?? "";
      return typeof v === "string" ? v : "";
    },
    cell: ({ getValue }) => {
      const v = String(getValue() ?? "");
      return truncate(v, 60);
    },
    enableColumnFilter: true,
    meta: { label: "Goal", variant: "text", placeholder: "Search goal" },
    size: 220,
  } satisfies ColumnDef<TData>;
}
