import type * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "../../../../components/data-table/data-table-column-header";
import { Checkbox } from "../../../../components/ui/checkbox";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import type { CallCampaign } from "../../../../../../../types/_dashboard/campaign";
import { PlaybackCell } from "../components/PlaybackCell";
import {
	getTextMetric,
	getLastMessageAt,
	downloadCampaignZip,
} from "../../text/utils/helpers";
import { Pause, Play, Square, ThumbsDown, ThumbsUp } from "lucide-react";
import { stopRowClick, withStopPropagation } from "../../../../utils/events";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "../../../../components/ui/popover";
import { Input } from "../../../../components/ui/input";

export type CampaignType = "Calls" | "Text" | "Social" | "Direct Mail";

function getPrimaryLabel(campaignType: CampaignType) {
	return campaignType === "Calls"
		? "Calls"
		: campaignType === "Text"
			? "Messages"
			: campaignType === "Social"
				? "Actions"
				: "Mailers";
}

type TableMeta = {
	onPause?: (r: CallCampaign) => void;
	onResume?: (r: CallCampaign) => void;
	onStop?: (r: CallCampaign) => void;
	getFeedback?: (
		r: CallCampaign,
	) => { sentiment: "up" | "down" | null; note: string } | undefined;
	onToggleFeedback?: (r: CallCampaign, s: "up" | "down") => void;
	onFeedbackNoteChange?: (r: CallCampaign, note: string) => void;
};

export function buildCallCampaignColumns(
	campaignType: CampaignType,
): ColumnDef<CallCampaign>[] {
	const primaryLabel = getPrimaryLabel(campaignType);

	// Common: selection + name
	const base: ColumnDef<CallCampaign>[] = [
		{
			id: "select",
			header: ({ table }) => (
				<div className="flex items-center gap-2 pl-2">
					<div className="grid h-5 w-5 place-items-center">
						<Checkbox
							onClick={(e: React.MouseEvent) => e.stopPropagation()}
							checked={
								table.getIsAllPageRowsSelected() ||
								(table.getIsSomePageRowsSelected() && "indeterminate")
							}
							onCheckedChange={(value: boolean | "indeterminate") =>
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
						onClick={(e: React.MouseEvent) => e.stopPropagation()}
						checked={row.getIsSelected()}
						onCheckedChange={(value: boolean | "indeterminate") =>
							row.toggleSelected(!!value)
						}
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
			id: "controls",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Controls" />
			),
			cell: ({ row, table }) => {
				const status = String(row.original.status ?? "");
				const isActive = ["queued", "delivering", "pending"].includes(status);
				const isPaused = status === "paused";
				const canControl = isActive || isPaused;
				const meta = (table.options?.meta ?? {}) as TableMeta;
				return (
					<div className="flex items-center gap-2">
						<Button
							type="button"
							size="sm"
							variant="outline"
							aria-label={isPaused ? "Resume" : "Pause"}
							disabled={!canControl}
							onClick={withStopPropagation(() => {
								if (!canControl) return;
								if (isPaused) meta.onResume?.(row.original);
								else meta.onPause?.(row.original);
							})}
						>
							{isPaused ? (
								<Play className="h-4 w-4" />
							) : (
								<Pause className="h-4 w-4" />
							)}
						</Button>
						<Button
							type="button"
							size="sm"
							variant="outline"
							aria-label="Stop"
							disabled={!canControl}
							onClick={withStopPropagation(() => {
								if (!canControl) return;
								meta.onStop?.(row.original);
							})}
						>
							<Square className="h-4 w-4" />
						</Button>
					</div>
				);
			},
			enableSorting: false,
			enableHiding: false,
			size: 220,
		},
		{
			id: "feedback",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Feedback" />
			),
			cell: ({ row, table }) => {
				const r = row.original;
				const status = String(r.status ?? "");
				if (status !== "completed")
					return <span className="text-muted-foreground">—</span>;
				const meta = (table.options?.meta ?? {}) as TableMeta;
				const fb = meta.getFeedback?.(r) ?? { sentiment: null, note: "" };
				const name = String(r.name ?? "this");
				const upActive = fb.sentiment === "up";
				const downActive = fb.sentiment === "down";
				return (
					<div className="flex items-center gap-2">
						<Popover>
							<PopoverTrigger asChild>
								<Button
									type="button"
									size="icon"
									variant="outline"
									aria-label="Thumbs up"
									className={upActive ? "border-green-500 text-green-600" : ""}
									onClick={withStopPropagation(() =>
										meta.onToggleFeedback?.(r, "up"),
									)}
								>
									<ThumbsUp className="h-4 w-4" />
								</Button>
							</PopoverTrigger>
							<PopoverContent
								align="start"
								className="w-64"
								onMouseDown={stopRowClick}
							>
								<Input
									placeholder={`Why did you ${upActive ? "like" : "like"} \"${name}\"?`}
									value={fb.note}
									onChange={(e) =>
										meta.onFeedbackNoteChange?.(r, e.target.value)
									}
								/>
							</PopoverContent>
						</Popover>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									type="button"
									size="icon"
									variant="outline"
									aria-label="Thumbs down"
									className={downActive ? "border-red-500 text-red-600" : ""}
									onClick={withStopPropagation(() =>
										meta.onToggleFeedback?.(r, "down"),
									)}
								>
									<ThumbsDown className="h-4 w-4" />
								</Button>
							</PopoverTrigger>
							<PopoverContent
								align="start"
								className="w-64"
								onMouseDown={stopRowClick}
							>
								<Input
									placeholder={`Why did you ${downActive ? "dislike" : "dislike"} \"${name}\"?`}
									value={fb.note}
									onChange={(e) =>
										meta.onFeedbackNoteChange?.(r, e.target.value)
									}
								/>
							</PopoverContent>
						</Popover>
					</div>
				);
			},
			enableSorting: false,
			enableHiding: false,
			size: 170,
		},
		{
			accessorKey: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Campaign Name" />
			),
			cell: ({ getValue }) => (
				<span
					className="block max-w-[220px] truncate"
					title={String(getValue())}
				>
					{String(getValue())}
				</span>
			),
			enableColumnFilter: true,
			meta: {
				label: "Campaign Name",
				variant: "text",
				placeholder: "Search name",
			},
			size: 220,
		},
	];

	// Campaign-specific columns
	if (campaignType === "Text") {
		const textCols: ColumnDef<CallCampaign>[] = [
			{
				id: "sent",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Sent" />
				),
				accessorFn: (row) => getTextMetric(row, "sent"),
				cell: ({ row }) => (
					<span className="tabular-nums">
						{getTextMetric(row.original, "sent")}
					</span>
				),
				enableColumnFilter: true,
				filterFn: (row, id, value) => {
					const n = Number(row.getValue(id) ?? 0);
					if (!Array.isArray(value)) return true;
					const [min, max] = value as (number | undefined)[];
					if (min != null && n < min) return false;
					if (max != null && n > max) return false;
					return true;
				},
				meta: { label: "Sent", variant: "range" },
				size: 80,
			},
			{
				id: "delivered",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Delivered" />
				),
				accessorFn: (row) => getTextMetric(row, "delivered"),
				cell: ({ row }) => (
					<span className="tabular-nums">
						{getTextMetric(row.original, "delivered")}
					</span>
				),
				enableColumnFilter: true,
				filterFn: (row, id, value) => {
					const n = Number(row.getValue(id) ?? 0);
					if (!Array.isArray(value)) return true;
					const [min, max] = value as (number | undefined)[];
					if (min != null && n < min) return false;
					if (max != null && n > max) return false;
					return true;
				},
				meta: { label: "Delivered", variant: "range" },
				size: 96,
			},
			{
				id: "failed",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Failed" />
				),
				accessorFn: (row) => getTextMetric(row, "failed"),
				cell: ({ row }) => (
					<span className="tabular-nums">
						{getTextMetric(row.original, "failed")}
					</span>
				),
				enableColumnFilter: true,
				filterFn: (row, id, value) => {
					const n = Number(row.getValue(id) ?? 0);
					if (!Array.isArray(value)) return true;
					const [min, max] = value as (number | undefined)[];
					if (min != null && n < min) return false;
					if (max != null && n > max) return false;
					return true;
				},
				meta: { label: "Failed", variant: "range" },
				size: 80,
			},
			{
				id: "totalMessages",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Total Messages" />
				),
				accessorFn: (row) => getTextMetric(row, "total"),
				cell: ({ row }) => (
					<span className="tabular-nums">
						{getTextMetric(row.original, "total")}
					</span>
				),
				enableColumnFilter: true,
				filterFn: (row, id, value) => {
					const n = Number(row.getValue(id) ?? 0);
					if (!Array.isArray(value)) return true;
					const [min, max] = value as (number | undefined)[];
					if (min != null && n < min) return false;
					if (max != null && n > max) return false;
					return true;
				},
				meta: { label: "Total Messages", variant: "range" },
				size: 120,
			},
			{
				id: "lastMessageAt",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Last Message Sent" />
				),
				accessorFn: (row) => {
					const raw = row.textStats?.lastMessageAt ?? row.lastMessageAt;
					const t = new Date(String(raw)).getTime();
					return Number.isNaN(t) ? 0 : t;
				},
				cell: ({ row }) => {
					const d = getLastMessageAt(row.original);
					return <span className="tabular-nums">{d}</span>;
				},
				enableColumnFilter: false,
				size: 160,
			},
		];

		const statusAndDate: ColumnDef<CallCampaign>[] = [
			{
				accessorKey: "status",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Status" />
				),
				enableColumnFilter: true,
				filterFn: (row, id, value) => {
					const v = String(row.getValue(id) ?? "");
					return Array.isArray(value) ? value.includes(v) : String(value) === v;
				},
				meta: {
					label: "Status",
					variant: "multiSelect",
					options: [
						{ label: "Delivering", value: "delivering" },
						{ label: "Completed", value: "completed" },
						{ label: "Failed", value: "failed" },
						{ label: "Missed", value: "missed" },
						{ label: "Delivered", value: "delivered" },
						{ label: "Pending", value: "pending" },
						{ label: "Queued", value: "queued" },
						{ label: "Read", value: "read" },
						{ label: "Unread", value: "unread" },
					],
				},
				cell: ({ getValue }) => (
					<span
						className="block max-w-[140px] truncate"
						title={String(getValue())}
					>
						{String(getValue())}
					</span>
				),
				size: 140,
			},
			{
				accessorKey: "startDate",
				header: ({ column }) => (
					<DataTableColumnHeader column={column} title="Start Date" />
				),
				enableColumnFilter: true,
				filterFn: (row, id, value) => {
					const raw = row.getValue(id);
					const t = new Date(typeof raw === "number" ? raw : String(raw)).getTime();
					if (!Array.isArray(value)) return true;
					const [from, to] = value as (number | undefined)[];
					if (from && t < from) return false;
					if (to && t > to) return false;
					return true;
				},
				meta: { label: "Start Date", variant: "dateRange" },
				cell: ({ getValue }) => {
					const d = new Date(String(getValue()));
					return (
						<span className="tabular-nums">
							{Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString()}
						</span>
					);
				},
				size: 120,
			},
		];

		const downloadCol: ColumnDef<CallCampaign> = {
			id: "download",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Download Messages" />
			),
			cell: ({ row }) => (
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={withStopPropagation(() => {
						void downloadCampaignZip(row.original);
					})}
				>
					Download ZIP
				</Button>
			),
			enableSorting: false,
			enableHiding: false,
			size: 160,
		};

		return [...base, ...textCols, ...statusAndDate, downloadCol];
	}

	// Default (Calls/Social/Direct Mail) use existing numeric columns
	const defaultCols: ColumnDef<CallCampaign>[] = [
		{
			accessorKey: "calls",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title={primaryLabel} />
			),
			cell: ({ getValue }) => (
				<span className="tabular-nums">{String(getValue())}</span>
			),
			enableColumnFilter: true,
			filterFn: (row, id, value) => {
				const n = Number(row.getValue(id) ?? 0);
				if (!Array.isArray(value)) return true;
				const [min, max] = value as (number | undefined)[];
				if (min != null && n < min) return false;
				if (max != null && n > max) return false;
				return true;
			},
			meta: { label: primaryLabel, variant: "range" },
			size: 80,
		},
		{
			accessorKey: "inQueue",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Queued" />
			),
			cell: ({ getValue }) => (
				<span className="tabular-nums">{String(getValue())}</span>
			),
			enableColumnFilter: true,
			filterFn: (row, id, value) => {
				const n = Number(row.getValue(id) ?? 0);
				if (!Array.isArray(value)) return true;
				const [min, max] = value as (number | undefined)[];
				if (min != null && n < min) return false;
				if (max != null && n > max) return false;
				return true;
			},
			meta: { label: "Queued", variant: "range" },
			size: 80,
		},
		{
			accessorKey: "leads",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Leads" />
			),
			cell: ({ getValue }) => (
				<span className="tabular-nums">{String(getValue())}</span>
			),
			enableColumnFilter: true,
			filterFn: (row, id, value) => {
				const n = Number(row.getValue(id) ?? 0);
				if (!Array.isArray(value)) return true;
				const [min, max] = value as (number | undefined)[];
				if (min != null && n < min) return false;
				if (max != null && n > max) return false;
				return true;
			},
			meta: { label: "Leads", variant: "range" },
			size: 80,
		},
		{
			accessorKey: "status",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Status" />
			),
			enableColumnFilter: true,
			filterFn: (row, id, value) => {
				const v = String(row.getValue(id) ?? "");
				return Array.isArray(value) ? value.includes(v) : String(value) === v;
			},
			meta: {
				label: "Status",
				variant: "multiSelect",
				options: [
					{ label: "Delivering", value: "delivering" },
					{ label: "Completed", value: "completed" },
					{ label: "Failed", value: "failed" },
					{ label: "Missed", value: "missed" },
					{ label: "Delivered", value: "delivered" },
					{ label: "Pending", value: "pending" },
					{ label: "Queued", value: "queued" },
					{ label: "Paused", value: "paused" },
					{ label: "Read", value: "read" },
					{ label: "Unread", value: "unread" },
				],
			},
			cell: ({ getValue }) => (
				<span
					className="block max-w-[140px] truncate"
					title={String(getValue())}
				>
					{String(getValue())}
				</span>
			),
			size: 140,
		},
		// Singular Transfer badge column
		{
			id: "transfer",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Transfer" />
			),
			enableColumnFilter: true,
			accessorFn: (row) => row.transfer?.type ?? "",
			filterFn: (row, id, value) => {
				const v = String(row.getValue(id) ?? "");
				return Array.isArray(value) ? value.includes(v) : String(value) === v;
			},
			meta: {
				label: "Transfer",
				variant: "select",
				options: [
					{ label: "Chat", value: "chat_agent" },
					{ label: "Voice (In)", value: "voice_inbound" },
					{ label: "Voice (Out)", value: "voice_outbound" },
					{ label: "Text", value: "text" },
					{ label: "Social", value: "social_media" },
					{ label: "Appraisal", value: "appraisal" },
				],
			},
			size: 170,
		},
		{
			id: "postCallWebhookUrl",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Post-Call Webhook" />
			),
			accessorFn: (row) => row.postCallWebhookUrl ?? "",
			cell: ({ getValue }) => (
				<span
					className="block max-w-[220px] truncate"
					title={String(getValue() ?? "")}
				>
					{String(getValue() ?? "-")}
				</span>
			),
			enableColumnFilter: true,
			filterFn: (row, id, value) => {
				const v = String(row.getValue(id) ?? "").toLowerCase();
				const search = String(value ?? "").toLowerCase();
				if (!search) return true;
				return v.includes(search);
			},
			meta: {
				label: "Post-Call Webhook",
				variant: "text",
				placeholder: "Search URL",
			},
			size: 220,
		},
	];

		defaultCols.push({
			id: "playback",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} title="Playback" />
			),
			cell: ({ row }) => (
				<div onMouseDown={stopRowClick}>
					<PlaybackCell callInformation={row.original.callInformation ?? []} />
				</div>
			),
			enableSorting: false,
			enableHiding: false,
			size: 220,
		});

		return [...base, ...defaultCols];
	}
 
