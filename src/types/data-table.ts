import type { ColumnSort, Row, RowData } from "@tanstack/react-table";
import type { DataTableConfig } from "../config/data-table";
import type { FilterItemSchema } from "../lib/parsers";
import type { LucideIcon } from "lucide-react";

declare module "@tanstack/react-table" {
  // biome-ignore lint/correctness/noUnusedVariables: TValue is used in the ColumnMeta interface
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string;
    placeholder?: string;
    variant?: FilterVariant;
    options?: Option[];
    range?: [number, number];
    unit?: string;
    icon?: LucideIcon;
  }

  interface TableMeta<TData extends RowData> {
    onPause?: (row: TData) => void;
    onResume?: (row: TData) => void;
    onStop?: (row: TData) => void;
    getFeedback?: (row: TData) => unknown;
    onToggleFeedback?: (row: TData, sentiment: "up" | "down") => void;
    onFeedbackNoteChange?: (row: TData, note: string) => void;
  }
}

export interface Option {
  label: string;
  value: string;
  count?: number;
  icon?: LucideIcon;
}

export type FilterOperator = DataTableConfig["operators"][number];
export type FilterVariant = DataTableConfig["filterVariants"][number];
export type JoinOperator = DataTableConfig["joinOperators"][number];

export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, "id"> {
  id: Extract<keyof TData, string>;
}

export interface ExtendedColumnFilter<TData> extends FilterItemSchema {
  id: Extract<keyof TData, string>;
}

export interface DataTableRowAction<TData> {
  row: Row<TData>;
  variant: "update" | "delete";
}
