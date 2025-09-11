"use client";

import type { Column, Table } from "@tanstack/react-table";
import { SlidersHorizontal, X } from "lucide-react";
import * as React from "react";

import { DataTableDateFilter } from "./data-table-date-filter";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableSliderFilter } from "./data-table-slider-filter";
import { DataTableViewOptions } from "./data-table-view-options";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface DataTableToolbarProps<TData> extends React.ComponentProps<"div"> {
	table: Table<TData>;
	showFilters?: boolean;
	showViewOptions?: boolean;
	viewPosition?: "row1" | "row2";
}

export function DataTableToolbar<TData>({
	table,
	children,
	className,
	showFilters = true,
	showViewOptions = true,
	viewPosition = "row2",
	...props
}: DataTableToolbarProps<TData>) {
	const isFiltered = table.getState().columnFilters.length > 0;

	const columns = React.useMemo(
		() => table.getAllColumns().filter((column) => column.getCanFilter()),
		[table],
	);

	const onReset = React.useCallback(() => {
		table.resetColumnFilters();
	}, [table]);

	return (
		<div
			role="toolbar"
			aria-orientation="horizontal"
			className={cn("flex w-full flex-col gap-2 p-1", className)}
			{...props}
		>
			{/* Row 1: main actions (children) and optional Clear Filters button */}
			<div className="flex w-full items-center justify-between gap-2">
				<div className="flex flex-1 flex-wrap items-center gap-2">
					{children}
				</div>
				<div className="flex items-center gap-2">
					{showFilters && isFiltered && (
						<Button
							type="button"
							aria-label="Clear all filters"
							variant="outline"
							size="sm"
							className="h-8"
							onClick={onReset}
						>
							<X className="mr-1 h-3 w-3" /> Clear
						</Button>
					)}
					{showViewOptions && viewPosition === "row1" && (
						<DataTableViewOptions table={table} />
					)}
				</div>
			</div>

			{/* Row 2: Filters popover and View options (optional) aligned to the right */}
			{(showFilters || (showViewOptions && viewPosition === "row2")) && (
				<div className="flex w-full items-center justify-end gap-2">
					{showFilters && (
						<Popover>
							<PopoverTrigger asChild>
								<Button type="button" variant="outline" size="sm">
									<SlidersHorizontal className="mr-2 h-4 w-4" />
									Filters
								</Button>
							</PopoverTrigger>
							<PopoverContent align="end" className="w-80 p-3">
								<div className="flex flex-col gap-3">
									<div className="flex items-center justify-between">
										<h4 className="font-medium text-sm">Filters</h4>
										{isFiltered && (
											<Button
												type="button"
												aria-label="Reset filters"
												variant="ghost"
												size="sm"
												className="h-7 px-2 text-xs"
												onClick={onReset}
											>
												<X className="mr-1 h-3 w-3" />
												Reset
											</Button>
										)}
									</div>
									<div className="grid gap-3">
										{columns.map((column) => (
											<DataTableToolbarFilter key={column.id} column={column} />
										))}
									</div>
								</div>
							</PopoverContent>
						</Popover>
					)}
					{showViewOptions && viewPosition === "row2" && (
						<DataTableViewOptions table={table} />
					)}
				</div>
			)}
		</div>
	);
}

interface DataTableToolbarFilterProps<TData> {
	column: Column<TData>;
}

function DataTableToolbarFilter<TData>({
	column,
}: DataTableToolbarFilterProps<TData>) {
	{
		const columnMeta = column.columnDef.meta;

		const onFilterRender = React.useCallback(() => {
			if (!columnMeta?.variant) return null;

			switch (columnMeta.variant) {
				case "text":
					return (
						<Input
							placeholder={columnMeta.placeholder ?? columnMeta.label}
							value={(column.getFilterValue() as string) ?? ""}
							onChange={(event) => column.setFilterValue(event.target.value)}
							className="h-8 w-40 lg:w-56"
						/>
					);

				case "number":
					return (
						<div className="relative">
							<Input
								type="number"
								inputMode="numeric"
								placeholder={columnMeta.placeholder ?? columnMeta.label}
								value={(column.getFilterValue() as string) ?? ""}
								onChange={(event) => column.setFilterValue(event.target.value)}
								className={cn("h-8 w-[120px]", columnMeta.unit && "pr-8")}
							/>
							{columnMeta.unit && (
								<span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-muted-foreground text-sm">
									{columnMeta.unit}
								</span>
							)}
						</div>
					);

				case "range":
					return (
						<DataTableSliderFilter
							column={column}
							title={columnMeta.label ?? column.id}
						/>
					);

				case "date":
				case "dateRange":
					return (
						<DataTableDateFilter
							column={column}
							title={columnMeta.label ?? column.id}
							multiple={columnMeta.variant === "dateRange"}
						/>
					);

				case "select":
				case "multiSelect":
					return (
						<DataTableFacetedFilter
							column={column}
							title={columnMeta.label ?? column.id}
							options={columnMeta.options ?? []}
							multiple={columnMeta.variant === "multiSelect"}
						/>
					);

				default:
					return null;
			}
		}, [column, columnMeta]);

		return onFilterRender();
	}
}
