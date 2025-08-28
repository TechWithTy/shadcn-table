"use client";

import * as React from "react";
import type { Row, Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

export interface DataTableRowModalCarouselProps<TData> {
  table: Table<TData>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  index: number;
  setIndex: (i: number) => void;
  rows: Row<TData>[];
  onPrev: () => void;
  onNext: () => void;
  title?: (row: Row<TData>, index: number) => React.ReactNode;
  description?: (row: Row<TData>, index: number) => React.ReactNode;
  render: (row: Row<TData>, index: number) => React.ReactNode;
  actions?: (row: Row<TData>, index: number) => React.ReactNode;
}

export function DataTableRowModalCarousel<TData>(props: DataTableRowModalCarouselProps<TData>) {
  const { open, onOpenChange, rows, index, onPrev, onNext, title, description, render, actions } = props;
  const row = rows[index];

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onNext, onPrev]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl md:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {row && title ? title(row, index) : `Row ${index + 1} of ${rows.length}`}
          </DialogTitle>
          {row && description ? (
            <DialogDescription>{description(row, index)}</DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="grid gap-3 text-sm leading-6">
          {row ? (
            render(row, index)
          ) : (
            <div className="text-muted-foreground">No row</div>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPrev}
            aria-label="Previous"
            className="gap-1.5"
          >
            <ChevronLeft />
            Prev
          </Button>
          <div className="flex items-center gap-3">
            {row && actions ? (
              <div className="flex items-center gap-2">
                {actions(row, index)}
              </div>
            ) : null}
            <div className="text-muted-foreground text-xs sm:text-sm">
              {rows.length > 0 ? `${index + 1} / ${rows.length}` : "0 / 0"}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNext}
            aria-label="Next"
            className="gap-1.5"
          >
            <ChevronRight />
            Next
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
