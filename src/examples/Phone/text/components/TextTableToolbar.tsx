"use client";

import type * as React from "react";
import type { Table } from "@tanstack/react-table";
import { DataTableToolbar } from "../../../../components/data-table/data-table-toolbar";
import { Input } from "../../../../components/ui/input";
import { Button } from "../../../../components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import { DataTableExportButton } from "../../../../components/data-table/data-table-export-button";
import { Sparkles } from "lucide-react";
import type { CallCampaign } from "../../../../../../../types/_dashboard/campaign";

type Props = {
	table: Table<CallCampaign>;
	query: string;
	setQuery: (v: string) => void;
	onRunSelected: () => void;
	onRunAll: () => void;
	filename?: string;
	statusFilter: "all" | "scheduled" | "active" | "completed" | "canceled";
	setStatusFilter: (
		v: "all" | "scheduled" | "active" | "completed" | "canceled",
	) => void;
	dncFilter: "all" | "only" | "hide";
	setDncFilter: (v: "all" | "only" | "hide") => void;
};

export function TextTableToolbar({
	table,
	query,
	setQuery,
	onRunSelected,
	onRunAll,
	filename = "text-campaigns",
	statusFilter,
	setStatusFilter,
	dncFilter,
	setDncFilter,
}: Props) {
	const selectedCount = table.getFilteredSelectedRowModel().rows.length;
	const allCount = table.getFilteredRowModel().rows.length;

	return (
		<DataTableToolbar table={table} className="mb-3 md:mb-4">
			<Input
				aria-label="Global search"
				placeholder="Search campaigns..."
				value={query}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
					setQuery(e.target.value)
				}
				className="h-8 w-64"
			/>
			{/* Status chips */}
			<div className="hidden items-center gap-1 md:flex">
				<Button
					type="button"
					size="sm"
					variant={statusFilter === "all" ? "secondary" : "outline"}
					onClick={() => setStatusFilter("all")}
				>
					All
				</Button>
				<Button
					type="button"
					size="sm"
					variant={statusFilter === "scheduled" ? "secondary" : "outline"}
					onClick={() => setStatusFilter("scheduled")}
				>
					Scheduled
				</Button>
				<Button
					type="button"
					size="sm"
					variant={statusFilter === "active" ? "secondary" : "outline"}
					onClick={() => setStatusFilter("active")}
				>
					Active
				</Button>
				<Button
					type="button"
					size="sm"
					variant={statusFilter === "completed" ? "secondary" : "outline"}
					onClick={() => setStatusFilter("completed")}
				>
					Completed
				</Button>
				<Button
					type="button"
					size="sm"
					variant={statusFilter === "canceled" ? "secondary" : "outline"}
					onClick={() => setStatusFilter("canceled")}
				>
					Canceled
				</Button>
			</div>
			{/* DNC chips */}
			<div className="hidden items-center gap-1 md:flex">
				<Button
					type="button"
					size="sm"
					variant={dncFilter === "all" ? "secondary" : "outline"}
					onClick={() => setDncFilter("all")}
				>
					DNC: All
				</Button>
				<Button
					type="button"
					size="sm"
					variant={dncFilter === "only" ? "secondary" : "outline"}
					onClick={() => setDncFilter("only")}
				>
					DNC: Only
				</Button>
				<Button
					type="button"
					size="sm"
					variant={dncFilter === "hide" ? "secondary" : "outline"}
					onClick={() => setDncFilter("hide")}
				>
					DNC: Hide
				</Button>
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						size="sm"
						className="bg-purple-600 text-white hover:bg-purple-700"
					>
						<Sparkles className="mr-1 h-4 w-4" /> AI
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-52">
					<DropdownMenuLabel>Run AI on</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						disabled={selectedCount === 0}
						onSelect={onRunSelected}
					>
						Use Selected ({selectedCount})
					</DropdownMenuItem>
					<DropdownMenuItem onSelect={onRunAll}>
						Use All ({allCount})
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<DataTableExportButton
				table={table}
				filename={filename}
				excludeColumns={["select"]}
			/>
		</DataTableToolbar>
	);
}
