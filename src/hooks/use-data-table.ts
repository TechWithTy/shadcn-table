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
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { ExtendedColumnSort } from "../types/data-table";

import { useNuqsIntegration } from "./data-table/use-nuqs-integration";
import { useFilterHandling } from "./data-table/use-filter-handling";
import { useGlobalColumns } from "./data-table/use-global-columns";
import { useAdjustedInitialState } from "./data-table/use-adjusted-initial-state";

export interface UseDataTableProps<TData>
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
  // Allows consumers to opt-out of injected global columns or be selective
  disableGlobalColumns?:
    | boolean
    | Partial<{
        dnc: boolean;
        dncSource: boolean;
        script: boolean;
        agent: boolean;
        transfer: boolean;
        goal: boolean;
        timing: boolean;
      }>;
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
	const {
		columns: providedColumns,
		pageCount = -1,
		initialState,
		history = "replace",
		debounceMs = 300,
		throttleMs = 50,
		clearOnDefault = false,
		enableAdvancedFilter = false,
		scroll = false,
		shallow = true,
		startTransition,
		disableGlobalColumns,
		...tableProps
	} = props;

	const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
		initialState?.rowSelection ?? {},
	);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>(initialState?.columnVisibility ?? {});

	// Use global columns utility
	const columns = useGlobalColumns<TData>({
		providedColumns,
		disableGlobalColumns,
		tableProps,
	});

	const columnIds = React.useMemo(() => {
		return new Set(
			columns.map((column) => column.id).filter(Boolean) as string[],
		);
	}, [columns]);

	// Use nuqs integration utility
	const {
		page,
		setPage,
		perPage,
		setPerPage,
		pagination,
		onPaginationChange,
		sorting,
		setSorting,
		onSortingChange,
		queryStateOptions,
	} = useNuqsIntegration<TData>({
		history,
		debounceMs,
		throttleMs,
		clearOnDefault,
		scroll,
		shallow,
		startTransition,
		initialState,
		columnIds,
	});

	const filterableColumns = React.useMemo(() => {
		if (enableAdvancedFilter) return [];

		return columns.filter((column) => column.enableColumnFilter);
	}, [columns, enableAdvancedFilter]);

	// Use filter handling utility
	const {
		columnFilters,
		setColumnFilters,
		onColumnFiltersChange,
		initialColumnFilters,
	} = useFilterHandling<TData>({
		enableAdvancedFilter,
		filterableColumns,
		queryStateOptions,
		setPage,
		debounceMs,
	});

	// Use adjusted initial state utility
	const adjustedInitialState = useAdjustedInitialState({
		initialState,
		disableGlobalColumns,
	});

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
