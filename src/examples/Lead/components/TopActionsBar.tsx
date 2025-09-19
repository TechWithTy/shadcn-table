"use client";

import * as React from "react";
import { Button } from "../../../components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "../../../components/ui/dropdown-menu";
import type { Table } from "@tanstack/react-table";
import type { DemoRow } from "../types";
import { computeAvailableFields, getRowLeadCount } from "../utils/leadHelpers";
import {
	exportRowToCSV,
	exportRowsToExcel,
	exportSelectedRowsPerListAsZip,
	exportRowsToCSV,
	exportRowsToCSVZipPerList,
	exportNestedLeadsToExcelZipPerList,
	exportNestedLeadsToExcel,
	exportNestedLeadsToCSVZipPerList,
	exportNestedLeadsToCSV,
} from "../exports";
import type { SkipTraceInit } from "../utils/leadHelpers";

interface TopActionsBarProps {
	table: Table<DemoRow>;
	onOpenLeadModal?: (opts?: { initialListMode?: "select" | "create" }) => void;
	onOpenCreateList?: () => void;
	onOpenSkipTrace?: (init?: SkipTraceInit) => void;
	data: DemoRow[];
	getSelectedRows: () => DemoRow[];
	getAllRows: () => DemoRow[];
}

export function TopActionsBar({
	table,
	onOpenLeadModal,
	onOpenCreateList,
	onOpenSkipTrace,
	data,
	getSelectedRows,
	getAllRows,
}: TopActionsBarProps) {
	const selectedLen = table.getFilteredSelectedRowModel().rows.length;

	const openSkipTraceFromSelection = () => {
		const sourceRows = getSelectedRows();
		const lists = Array.from(new Set(sourceRows.map((r) => r.list)));
		const availableFields = computeAvailableFields(sourceRows);
		const availableLeadCount = sourceRows.reduce(
			(sum, r) => sum + getRowLeadCount(r),
			0,
		);
		const listCounts: Record<string, number> = sourceRows.reduce(
			(acc, r) => {
				acc[r.list] = (acc[r.list] ?? 0) + getRowLeadCount(r);
				return acc;
			},
			{} as Record<string, number>,
		);
		const availableLists = lists.map((name) => ({
			name,
			count: listCounts[name] ?? 0,
		}));

		// Debug logs preserved from original for parity
		console.log("[SkipTrace Debug] Selected rows:", sourceRows);
		console.log("[SkipTrace Debug] Lists:", lists);
		console.log("[SkipTrace Debug] Per-list counts:", listCounts);
		console.log("[SkipTrace Debug] Total leads:", availableLeadCount);

		onOpenSkipTrace?.({
			type: "list",
			availableListNames: lists,
			availableFields,
			availableLeadCount,
			listCounts,
			availableLists,
		});
	};

	return (
		<div className="ml-auto flex flex-wrap items-center gap-2">
			<span className="text-sm">{selectedLen} selected</span>
			<Button
				variant="outline"
				size="sm"
				type="button"
				onClick={() => table.resetRowSelection()}
			>
				Clear
			</Button>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="default" size="sm" type="button">
						Actions
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56">
					<DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
					<DropdownMenuSeparator />

					<DropdownMenuItem
						onSelect={() => onOpenLeadModal?.({ initialListMode: "select" })}
					>
						Add Lead
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() => onOpenLeadModal?.({ initialListMode: "create" })}
					>
						Create List
					</DropdownMenuItem>

					<DropdownMenuItem
						disabled={selectedLen === 0}
						onSelect={openSkipTraceFromSelection}
					>
						Add Lead List
					</DropdownMenuItem>

					<DropdownMenuItem
						disabled={selectedLen === 0}
						onSelect={openSkipTraceFromSelection}
					>
						Skip Trace
					</DropdownMenuItem>

					<DropdownMenuSeparator />

					<DropdownMenuSub>
						<DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
						<DropdownMenuSubContent className="w-64">
							<DropdownMenuLabel>Excel</DropdownMenuLabel>
							<DropdownMenuItem
								disabled={selectedLen === 0}
								onSelect={async () => {
									const rows = getSelectedRows();
									if (rows.length === 0) return;
									await exportNestedLeadsToExcelZipPerList(
										rows,
										"nested-selected-per-list",
									);
								}}
							>
								Excel Selected (ZIP per list)
							</DropdownMenuItem>

							<DropdownMenuItem
								onSelect={async () => {
									const rows = table
										.getFilteredRowModel()
										.rows.map((r) => r.original as DemoRow);
									if (rows.length === 0) return;
									const lists = new Set(rows.map((r) => r.list));
									if (lists.size > 1) {
										await exportNestedLeadsToExcelZipPerList(
											rows,
											"nested-visible-per-list",
										);
									} else {
										await exportNestedLeadsToExcel(rows, "nested-visible");
									}
								}}
							>
								Excel Visible
							</DropdownMenuItem>

							<DropdownMenuItem
								onSelect={async () => {
									const lists = new Set(data.map((r) => r.list));
									if (lists.size > 1) {
										await exportNestedLeadsToExcelZipPerList(
											data,
											"nested-all-per-list",
										);
									} else {
										await exportNestedLeadsToExcel(data, "nested-all");
									}
								}}
							>
								Excel All
							</DropdownMenuItem>

							<DropdownMenuSeparator />
							<DropdownMenuLabel>CSV</DropdownMenuLabel>

							<DropdownMenuItem
								disabled={selectedLen === 0}
								onSelect={async () => {
									const rows = getSelectedRows();
									if (rows.length === 0) return;
									await exportNestedLeadsToCSVZipPerList(
										rows,
										"nested-selected-csv",
									);
								}}
							>
								CSV Selected (ZIP per list)
							</DropdownMenuItem>

							<DropdownMenuItem
								onSelect={async () => {
									const rows = table
										.getFilteredRowModel()
										.rows.map((r) => r.original as DemoRow);
									if (rows.length === 0) return;
									const lists = new Set(rows.map((r) => r.list));
									if (lists.size > 1) {
										await exportNestedLeadsToCSVZipPerList(
											rows,
											"nested-visible-csv",
										);
									} else {
										exportNestedLeadsToCSV(rows, "nested-visible");
									}
								}}
							>
								CSV Visible
							</DropdownMenuItem>

							<DropdownMenuItem
								onSelect={async () => {
									const lists = new Set(data.map((r) => r.list));
									if (lists.size > 1) {
										await exportNestedLeadsToCSVZipPerList(
											data,
											"nested-all-csv",
										);
									} else {
										exportNestedLeadsToCSV(data, "nested-all");
									}
								}}
							>
								CSV All
							</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
