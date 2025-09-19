"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { Button } from "../../../../components/ui/button";
import type { CallCampaign } from "../../../../../../../types/_dashboard/campaign";
import {
	STATUS_GROUPS,
	isGroupActive,
	setStatusGroup,
} from "../utils/statusFilters";
import { X } from "lucide-react";

type Props = {
	table: Table<CallCampaign>;
};

export function StatusQuickActions({ table }: Props) {
	const groups = STATUS_GROUPS;
	const hasFilters = table.getState().columnFilters.length > 0;

	return (
		<div className="hidden items-center gap-1 md:flex">
			{hasFilters && (
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={() => table.resetColumnFilters()}
					aria-label="Clear all filters"
				>
					<X className="mr-1 h-3 w-3" /> Clear
				</Button>
			)}
			<Button
				type="button"
				size="sm"
				variant={isGroupActive(table, groups.All) ? "secondary" : "ghost"}
				onClick={() => setStatusGroup(table, groups.All)}
			>
				All
			</Button>
			<Button
				type="button"
				size="sm"
				variant={isGroupActive(table, groups.Scheduled) ? "secondary" : "ghost"}
				onClick={() => setStatusGroup(table, groups.Scheduled)}
			>
				Scheduled
			</Button>
			<Button
				type="button"
				size="sm"
				variant={isGroupActive(table, groups.Active) ? "secondary" : "ghost"}
				onClick={() => setStatusGroup(table, groups.Active)}
			>
				Active
			</Button>
			<Button
				type="button"
				size="sm"
				variant={isGroupActive(table, groups.Completed) ? "secondary" : "ghost"}
				onClick={() => setStatusGroup(table, groups.Completed)}
			>
				Completed
			</Button>
			<Button
				type="button"
				size="sm"
				variant={isGroupActive(table, groups.Canceled) ? "secondary" : "ghost"}
				onClick={() => setStatusGroup(table, groups.Canceled)}
			>
				Canceled
			</Button>
		</div>
	);
}
