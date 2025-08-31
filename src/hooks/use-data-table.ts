"use client";

import {
  type ColumnFiltersState,
  type ColumnDef,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
  type Updater,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  type Parser,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  type UseQueryStateOptions,
  useQueryState,
  useQueryStates,
} from "nuqs";
import * as React from "react";

import { useDebouncedCallback } from "./use-debounced-callback";
import { getSortingStateParser } from "../lib/parsers";
import type { ExtendedColumnSort } from "../types/data-table";

const PAGE_KEY = "page";
const PER_PAGE_KEY = "perPage";
const SORT_KEY = "sort";
const ARRAY_SEPARATOR = ",";
const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;

interface UseDataTableProps<TData>
  extends Omit<
      TableOptions<TData>,
      | "state"
      | "pageCount"
      | "getCoreRowModel"
      | "manualFiltering"
      | "manualPagination"
      | "manualSorting"
    >,
    Required<Pick<TableOptions<TData>, "pageCount">> {
  initialState?: Omit<Partial<TableState>, "sorting"> & {
    sorting?: ExtendedColumnSort<TData>[];
  };
  history?: "push" | "replace";
  debounceMs?: number;
  throttleMs?: number;
  clearOnDefault?: boolean;
  enableAdvancedFilter?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  startTransition?: React.TransitionStartFunction;
}

// Build a global DNC column that attempts to read common opt-out flags on the row
function buildGlobalDncColumn<TData>(): ColumnDef<TData> {
  return {
    id: "globalDnc",
    header: "DNC",
    accessorFn: (row) => {
      const r = row as unknown as Record<string, unknown>;
      // Common flags across app types
      const v =
        (r["dncList"] as boolean | undefined) ??
        (r["dnc"] as boolean | number | undefined) ??
        (r["optedOut"] as boolean | undefined) ??
        (r["optOut"] as boolean | undefined) ??
        (r["doNotContact"] as boolean | undefined) ??
        (r["globalDnc"] as boolean | undefined) ??
        false;
      // If numeric (e.g., campaigns summary), treat >0 as true
      if (typeof v === "number") return v > 0;
      return Boolean(v);
    },
    cell: ({ getValue }) => (Boolean(getValue()) ? "Yes" : "No"),
    enableColumnFilter: true,
    filterFn: (row, id, value) => {
      const raw = row.getValue(id);
      const is = Boolean(raw);
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

// Build a companion column that shows the source/reason for DNC when applicable
function buildGlobalDncSourceColumn<TData>(): ColumnDef<TData> {
  return {
    id: "globalDncSource",
    header: "DNC Source",
    accessorFn: (row) => {
      const r = row as unknown as Record<string, unknown>;
      // Explicit source fields take precedence
      const explicit =
        (r["dncSource"] as string | undefined) ??
        (r["dnc_source"] as string | undefined) ??
        (r["unsubscribeSource"] as string | undefined) ??
        (r["source"] as string | undefined);
      if (explicit && typeof explicit === "string" && explicit.trim()) return explicit;

      // Canonical type, if provided
      const canonical =
        (r["dncSourceType"] as string | undefined) ??
        (r["dnc_source_type"] as string | undefined) ??
        (r["campaignType"] as string | undefined) ??
        (r["channel"] as string | undefined) ??
        (r["primaryType"] as string | undefined);
      if (canonical && typeof canonical === "string") {
        const c = canonical.toLowerCase();
        if (c.includes("text") || c === "sms") return "Text";
        if (c.includes("email")) return "Email";
        if (c.includes("call") || c.includes("voice")) return "Call";
        if (c.includes("dm") || c.includes("social")) return "DM";
      }

      // Heuristics based on common flags
      const dncList = Boolean(r["dncList"]);
      const dncNum = typeof r["dnc"] === "number" ? (r["dnc"] as number) : undefined;
      const optedOut = Boolean(r["optedOut"] ?? r["optOut"] ?? r["doNotContact"]);
      const emailOptOut = Boolean(
        r["emailOptOut"] || r["unsubscribed"] || r["unsub"] || (r["emailOptIn"] === false)
      );
      const callOptOut = Boolean(r["scaCall"] ?? r["sca_call"] ?? r["callOptOut"] ?? r["call_opt_out"]);
      const textOptOut = Boolean(
        r["smsOptOut"] || r["textOptOut"] || r["sms_opt_out"] || r["text_opt_out"] || (r["smsOptIn"] === false)
      );
      const manualPopIn = Boolean(
        r["manualDnc"] || r["manual_dnc"] || r["manuallyAddedToDnc"] || r["addedToDnc"]
      );

      if (textOptOut) return "Text Opt-out";
      if (emailOptOut) return "Email";
      if (callOptOut) return "Call";
      if (manualPopIn) return "Pop-in to DNC";
      if (dncList) return "Scrub List";
      if (typeof dncNum === "number" && dncNum > 0) {
        // Try to infer campaign type to be specific instead of generic "Campaign DNC"
        const keys = Object.keys(r);
        const hasAnyKey = (names: string[]) => names.some((n) => keys.includes(n));
        const isCallLike = hasAnyKey([
          "callInformation",
          "callType",
          "callerNumber",
          "endedReason",
        ]);
        const isDmLike = hasAnyKey(["platform", "actions"]);
        const isEmailLike = hasAnyKey([
          "subject",
          "from",
          "to",
          "email",
          "emailCampaignId",
        ]);
        const isTextLike = hasAnyKey([
          "smsOptOut",
          "smsOptIn",
          "textOptOut",
          "message",
          "messages",
        ]);

        // Prefer text/email/dm over call so not everything collapses to Call
        if (isTextLike) return "Text";
        if (isEmailLike) return "Email";
        if (isDmLike) return "DM";
        if (isCallLike) return "Call";
        return "";
      }
      if (optedOut) return "Text Opt-out";
      return "";
    },
    cell: ({ getValue }) => {
      const v = (getValue() as string) ?? "";
      return v && v.trim() ? v : "—";
    },
    enableColumnFilter: true,
    filterFn: (row, id, value) => {
      const raw = (row.getValue(id) as string) ?? "";
      if (!Array.isArray(value) || value.length === 0) return true;
      return value.includes(raw) || (raw === "" && value.includes("(empty)"));
    },
    meta: {
      label: "DNC Source",
      variant: "select",
      options: [
        { label: "Text Opt-out", value: "Text Opt-out" },
        { label: "Email", value: "Email" },
        { label: "Call", value: "Call" },
        { label: "DM", value: "DM" },
        { label: "Pop-in to DNC", value: "Pop-in to DNC" },
        { label: "Scrub List", value: "Scrub List" },
        { label: "(empty)", value: "(empty)" },
      ],
    },
    size: 130,
  } satisfies ColumnDef<TData>;
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const {
    columns: providedColumns,
    pageCount = -1,
    initialState,
    history = "replace",
    debounceMs = DEBOUNCE_MS,
    throttleMs = THROTTLE_MS,
    clearOnDefault = false,
    enableAdvancedFilter = false,
    scroll = false,
    shallow = true,
    startTransition,
    ...tableProps
  } = props;

  const queryStateOptions = React.useMemo<
    Omit<UseQueryStateOptions<string>, "parse">
  >(
    () => ({
      history,
      scroll,
      shallow,
      throttleMs,
      debounceMs,
      clearOnDefault,
      startTransition,
    }),
    [
      history,
      scroll,
      shallow,
      throttleMs,
      debounceMs,
      clearOnDefault,
      startTransition,
    ],
  );

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {},
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialState?.columnVisibility ?? {});

  const [page, setPage] = useQueryState(
    PAGE_KEY,
    parseAsInteger.withOptions(queryStateOptions).withDefault(1),
  );
  const [perPage, setPerPage] = useQueryState(
    PER_PAGE_KEY,
    parseAsInteger
      .withOptions(queryStateOptions)
      .withDefault(initialState?.pagination?.pageSize ?? 10),
  );

  const pagination: PaginationState = React.useMemo(() => {
    return {
      pageIndex: page - 1, // zero-based index -> one-based index
      pageSize: perPage,
    };
  }, [page, perPage]);

  const onPaginationChange = React.useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      if (typeof updaterOrValue === "function") {
        const newPagination = updaterOrValue(pagination);
        void setPage(newPagination.pageIndex + 1);
        void setPerPage(newPagination.pageSize);
      } else {
        void setPage(updaterOrValue.pageIndex + 1);
        void setPerPage(updaterOrValue.pageSize);
      }
    },
    [pagination, setPage, setPerPage],
  );

  // Augment columns with a global DNC column, unless caller already has one
  const columns = React.useMemo<ColumnDef<TData>[]>(() => {
    const hasDnc = (providedColumns ?? []).some(
      (c) => c.id === "globalDnc" || c.id === "dnc" || ("accessorKey" in (c as any) && (c as any).accessorKey === "dnc"),
    );
    const hasDncSource = (providedColumns ?? []).some(
      (c) => c.id === "globalDncSource" || ("accessorKey" in (c as any) && (c as any).accessorKey === "dncSource"),
    );

    // Always make sure DNC column exists; if user already has one, keep as-is but still consider injecting source next to it
    const dncCol = hasDnc ? undefined : buildGlobalDncColumn<TData>();
    const sourceCol = hasDncSource ? undefined : buildGlobalDncSourceColumn<TData>();

    let out = providedColumns.slice();
    const selectIdx = out.findIndex((c) => c.id === "select");
    let insertBaseIdx = selectIdx >= 0 ? selectIdx + 1 : 0;

    if (dncCol) {
      out.splice(insertBaseIdx, 0, dncCol);
      insertBaseIdx += 1;
    } else {
      // If DNC already exists, place source right after the existing DNC
      const existingDncIdx = out.findIndex(
        (c) => c.id === "globalDnc" || c.id === "dnc" || ((c as any).accessorKey === "dnc")
      );
      if (existingDncIdx >= 0) insertBaseIdx = existingDncIdx + 1;
    }

    if (sourceCol) {
      out.splice(insertBaseIdx, 0, sourceCol);
    }

    return out;
  }, [providedColumns]);

  const columnIds = React.useMemo(() => {
    return new Set(
      columns.map((column) => column.id).filter(Boolean) as string[],
    );
  }, [columns]);

  const [sorting, setSorting] = useQueryState(
    SORT_KEY,
    getSortingStateParser<TData>(columnIds)
      .withOptions(queryStateOptions)
      .withDefault(initialState?.sorting ?? []),
  );

  const onSortingChange = React.useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      if (typeof updaterOrValue === "function") {
        const newSorting = updaterOrValue(sorting);
        setSorting(newSorting as ExtendedColumnSort<TData>[]);
      } else {
        setSorting(updaterOrValue as ExtendedColumnSort<TData>[]);
      }
    },
    [sorting, setSorting],
  );

  const filterableColumns = React.useMemo(() => {
    if (enableAdvancedFilter) return [];

    return columns.filter((column) => column.enableColumnFilter);
  }, [columns, enableAdvancedFilter]);

  const filterParsers = React.useMemo(() => {
    if (enableAdvancedFilter) return {};

    return filterableColumns.reduce<
      Record<string, Parser<string> | Parser<string[]>>
    >((acc, column) => {
      if (column.meta?.options) {
        acc[column.id ?? ""] = parseAsArrayOf(
          parseAsString,
          ARRAY_SEPARATOR,
        ).withOptions(queryStateOptions);
      } else {
        acc[column.id ?? ""] = parseAsString.withOptions(queryStateOptions);
      }
      return acc;
    }, {});
  }, [filterableColumns, queryStateOptions, enableAdvancedFilter]);

  const [filterValues, setFilterValues] = useQueryStates(filterParsers);

  const debouncedSetFilterValues = useDebouncedCallback(
    (values: typeof filterValues) => {
      void setPage(1);
      void setFilterValues(values);
    },
    debounceMs,
  );

  const initialColumnFilters: ColumnFiltersState = React.useMemo(() => {
    if (enableAdvancedFilter) return [];

    return Object.entries(filterValues).reduce<ColumnFiltersState>(
      (filters, [key, value]) => {
        if (value !== null) {
          const processedValue = Array.isArray(value)
            ? value
            : typeof value === "string" && /[^a-zA-Z0-9]/.test(value)
              ? value.split(/[^a-zA-Z0-9]+/).filter(Boolean)
              : [value];

          filters.push({
            id: key,
            value: processedValue,
          });
        }
        return filters;
      },
      [],
    );
  }, [filterValues, enableAdvancedFilter]);

  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialColumnFilters);

  const onColumnFiltersChange = React.useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      if (enableAdvancedFilter) return;

      setColumnFilters((prev) => {
        const next =
          typeof updaterOrValue === "function"
            ? updaterOrValue(prev)
            : updaterOrValue;

        const filterUpdates = next.reduce<
          Record<string, string | string[] | null>
        >((acc, filter) => {
          if (filterableColumns.find((column) => column.id === filter.id)) {
            acc[filter.id] = filter.value as string | string[];
          }
          return acc;
        }, {});

        for (const prevFilter of prev) {
          if (!next.some((filter) => filter.id === prevFilter.id)) {
            filterUpdates[prevFilter.id] = null;
          }
        }

        debouncedSetFilterValues(filterUpdates);
        return next;
      });
    },
    [debouncedSetFilterValues, filterableColumns, enableAdvancedFilter],
  );

  // If consumer provided a custom columnOrder, insert globalDnc after 'select'
  const adjustedInitialState = React.useMemo(() => {
    if (!initialState?.columnOrder) return initialState;
    const order = initialState.columnOrder.slice();
    const has = order.includes("globalDnc");
    const hasSrc = order.includes("globalDncSource");
    const selectIdx = order.indexOf("select");
    let insertAt = selectIdx >= 0 ? selectIdx + 1 : 0;

    if (!has) {
      order.splice(insertAt, 0, "globalDnc");
      insertAt += 1;
    } else {
      // If DNC exists, ensure source is placed right after it when adding
      const dncIdx = order.indexOf("globalDnc");
      if (dncIdx >= 0) insertAt = dncIdx + 1;
    }

    if (!hasSrc) {
      order.splice(insertAt, 0, "globalDncSource");
    }

    return { ...initialState, columnOrder: order };
  }, [initialState]);

  const table = useReactTable({
    ...tableProps,
    columns,
    initialState: adjustedInitialState,
    pageCount,
    state: {
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    defaultColumn: {
      ...tableProps.defaultColumn,
      enableColumnFilter: false,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: true,
    manualSorting: false,
    manualFiltering: false,
  });

  return { table, shallow, debounceMs, throttleMs };
}
