"use client";

import * as React from "react";
import type { Row, Table } from "@tanstack/react-table";

export function useRowCarousel<TData>(table: Table<TData>, opts?: { loop?: boolean }) {
  const loop = opts?.loop ?? true;
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState<number>(0);

  const rows = table.getRowModel().rows as Row<TData>[];
  const count = rows.length;

  const next = React.useCallback(() => {
    if (count === 0) return;
    setIndex((i) => {
      const ni = i + 1;
      return ni >= count ? (loop ? 0 : count - 1) : ni;
    });
  }, [count, loop]);

  const prev = React.useCallback(() => {
    if (count === 0) return;
    setIndex((i) => {
      const pi = i - 1;
      return pi < 0 ? (loop ? count - 1 : 0) : pi;
    });
  }, [count, loop]);

  const openAt = React.useCallback((row: Row<TData>) => {
    // Use the provided row's position in the current row model directly
    const i = typeof row.index === "number" ? row.index : rows.findIndex((r) => r.id === row.id);
    setIndex(i >= 0 ? i : 0);
    setOpen(true);
  }, [rows]);

  return { open, setOpen, index, setIndex, rows, next, prev, openAt } as const;
}
