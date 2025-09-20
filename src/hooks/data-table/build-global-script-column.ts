"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import * as React from "react";

// Global Script title column
export function buildGlobalScriptColumn<TData>(): ColumnDef<TData> {
  return {
    id: "globalSalesScriptTitle",
    header: "Script",
    accessorFn: (row) => {
      const r = row as unknown as Record<string, unknown>;
      // Prefer explicit script name fields first; fall back to aiScript if names are unavailable
      const v =
        r.scriptTitle ??
        r.scriptName ??
        r.script ??
        r.aiScript ??
        "";
      return typeof v === "string" ? v : "";
    },
    cell: ({ getValue, row }) => {
      const label = String(getValue() ?? "").trim();
      if (!label) return "—";

      const r = row.original as Record<string, unknown>;
      const rawStatus = (r.scriptStatus ?? r.scriptState ?? r.script_state ?? r.aiScriptStatus) as
        | string
        | undefined;
      const status = typeof rawStatus === "string" ? rawStatus.toLowerCase() : undefined;
      let chip = "I"; // Default to Active/In-use
      let title = "Active";
      if (status?.startsWith("draft") || status === "d") {
        chip = "D";
        title = "Draft";
      } else if (status?.startsWith("archiv") || status === "a") {
        chip = "A";
        title = "Archived";
      } else if (status?.startsWith("active") || status?.startsWith("in-use") || status === "i") {
        chip = "I";
        title = "Active";
      }

      const children: React.ReactNode[] = [];
      children.push(
        React.createElement(Badge, { key: "name", variant: "secondary" }, label),
      );
      children.push(
        React.createElement(
          Badge,
          { key: "status", variant: "outline", className: "ml-1", title },
          chip,
        ),
      );

      return React.createElement("div", { className: "flex items-center" }, ...children);
    },
    enableColumnFilter: true,
    meta: { label: "Script", variant: "text", placeholder: "Search script" },
    size: 160,
  } satisfies ColumnDef<TData>;
}
