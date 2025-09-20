"use client";

import type { ColumnDef } from "@tanstack/react-table";

// Build a global DNC column that attempts to read common opt-out flags on the row
export function buildGlobalDncColumn<TData>(): ColumnDef<TData> {
  return {
    id: "globalDnc",
    header: "DNC",
    accessorFn: (row) => {
      const r = row as unknown as Record<string, unknown>;
      // Common flags across app types
      const v =
        r.dncList ??
        r.dnc ??
        r.optedOut ??
        r.optOut ??
        r.doNotContact ??
        r.globalDnc ??
        false;
      // If numeric (e.g., campaigns summary), treat >0 as true
      if (typeof v === "number") return v > 0;
      return Boolean(v);
    },
    cell: ({ getValue, row }) => {
      // Prefer numeric count when present on the raw row
      const r = row.original as Record<string, unknown>;
      if (typeof r.dnc === "number") {
        const n = r.dnc as number;
        return n > 0 ? String(n) : "0";
      }
      return getValue() ? "Yes" : "No";
    },
    enableColumnFilter: true,
    filterFn: (row, id, value) => {
      const raw = row.getValue(id);
      const is = !!raw;
      if (!Array.isArray(value)) return true;
      // value expected to be ["true"] or ["false"] or both
      const v = is ? "true" : "false";
      return value.includes(v);
    },
    meta: {
      label: "DNC",
      variant: "select",
      options: [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
      ],
    },
    size: 70,
  } satisfies ColumnDef<TData>;
}
