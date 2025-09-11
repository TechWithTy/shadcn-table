"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";

import { DataTableColumnHeader } from "../../components/data-table/data-table-column-header";
import { Checkbox } from "../../components/ui/checkbox";
import { Button } from "../../components/ui/button";
import type { DemoRow } from "./types";
import { exportSingleRowToExcel } from "./exports";

export const leadColumns: ColumnDef<DemoRow>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<div className="flex items-center gap-2 pl-2">
				<div className="grid h-5 w-5 place-items-center">
					<Checkbox
						onClick={(e) => e.stopPropagation()}
						checked={
							table.getIsAllPageRowsSelected() ||
							(table.getIsSomePageRowsSelected() && "indeterminate")
						}
						onCheckedChange={(value) =>
							table.toggleAllPageRowsSelected(!!value)
						}
						aria-label="Select all"
						className="grid h-4 w-4 place-items-center leading-none"
					/>
				</div>
				<span className="select-none text-muted-foreground text-xs">
					Select
				</span>
			</div>
		),
		cell: ({ row }) => (
			<div className="grid h-10 place-items-center">
				<Checkbox
					onClick={(e) => e.stopPropagation()}
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
					className="grid h-4 w-4 place-items-center leading-none"
				/>
			</div>
		),
		enableSorting: false,
		enableHiding: false,
		size: 48,
	},
	{
		accessorKey: "list",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="List" />
		),
		meta: { label: "List", variant: "text", placeholder: "Search list" },
	},
	{
		id: "uploadDate",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Upload Date" />
		),
		// Use a numeric accessor for consistent sorting and range filtering
		accessorFn: (row: DemoRow) => {
			const t = new Date(String(row.uploadDate)).getTime();
			return Number.isNaN(t) ? 0 : t;
		},
		cell: ({ getValue }) => {
			const raw = getValue();
			const d = new Date(typeof raw === "number" ? raw : String(raw));
			return (
				<span className="tabular-nums">
					{Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString()}
				</span>
			);
		},
		meta: { label: "Upload Date", variant: "dateRange" },
	},
	{
		accessorKey: "records",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Records" />
		),
		sortingFn: "alphanumeric",
		cell: ({ getValue }) => (
			<span className="tabular-nums">{String(getValue())}</span>
		),
		meta: { label: "Records", variant: "range" },
	},
	{
		accessorKey: "phone",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Phone" />
		),
		sortingFn: "alphanumeric",
		cell: ({ getValue }) => (
			<span className="tabular-nums">{String(getValue())}</span>
		),
		meta: { label: "Phone", variant: "range" },
	},
	{
		accessorKey: "emails",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Direct Mail" />
		),
		sortingFn: "alphanumeric",
		cell: ({ getValue }) => (
			<span className="tabular-nums">{String(getValue())}</span>
		),
		meta: { label: "Direct Mail", variant: "range" },
	},
	{
		accessorKey: "socials",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Socials" />
		),
		sortingFn: "alphanumeric",
		cell: ({ getValue }) => (
			<span className="tabular-nums">{String(getValue())}</span>
		),
		meta: { label: "Socials", variant: "range" },
	},
	{
		id: "actions",
		header: () => <span className="whitespace-nowrap">Export to Excel</span>,
		cell: ({ row }) => (
			<Button
				variant="ghost"
				size="icon"
				aria-label="Export row to Excel"
				type="button"
				onClick={async (e) => {
					e.stopPropagation();
					const headers: Array<keyof DemoRow> = [
						"list",
						"uploadDate",
						"records",
						"phone",
						"emails",
						"socials",
					];
					await exportSingleRowToExcel(row.original, headers);
				}}
			>
				<Download className="h-4 w-4" />
			</Button>
		),
		enableSorting: false,
		enableHiding: false,
		size: 80,
	},
];
