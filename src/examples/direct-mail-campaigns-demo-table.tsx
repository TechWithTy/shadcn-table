"use client";

import * as React from "react";
import { DataTable } from "../components/data-table/data-table";
import { DataTableToolbar } from "../components/data-table/data-table-toolbar";
import { DataTableExportButton } from "../components/data-table/data-table-export-button";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useDataTable } from "../hooks/use-data-table";
import { useRowCarousel } from "../hooks/use-row-carousel";
import { buildDirectMailColumns } from "./DirectMail/utils/columns";
import { filterCampaigns, summarizeRows } from "./DirectMail/utils/helpers";
import { SummaryPanel } from "./DirectMail/components/SummaryPanel";
import { SelectionBar } from "./DirectMail/components/SelectionBar";
import { AIMenu } from "./DirectMail/components/AIMenu";
import { AIDialogPanel } from "./DirectMail/components/AIDialogPanel";
import type { DirectMailCampaign } from "./DirectMail/utils/mock";
import { generateDirectMailCampaignData } from "./DirectMail/utils/mock";
import { DirectMailRowCarousel } from "./DirectMail/components/DirectMailRowCarousel";
import type { CallCampaign } from "../../../../types/_dashboard/campaign";
import CampaignModalMain from "./campaigns/modal/CampaignModalMain";

type ParentTab = "calls" | "text" | "social" | "directMail";

export default function DirectMailCampaignsDemoTable({
	onNavigate,
}: {
	onNavigate?: (tab: ParentTab) => void;
}) {
	const [data, setData] = React.useState<DirectMailCampaign[]>([]);
	const [query, setQuery] = React.useState("");
	const [aiOpen, setAiOpen] = React.useState(false);
	const [aiOutput, setAiOutput] = React.useState<string>("");
	const [aiRows, setAiRows] = React.useState<DirectMailCampaign[]>([]);
	const [createOpen, setCreateOpen] = React.useState(false);
	const campaignType = "Direct Mail" as const;
	const [dateChip, setDateChip] = React.useState<"today" | "7d" | "30d">(
		"today",
	);
	// Toolbar filters
	const [statusFilter, setStatusFilter] = React.useState<
		"all" | "scheduled" | "active" | "completed" | "canceled"
	>("all");
	const [dncFilter, setDncFilter] = React.useState<"all" | "only" | "hide">(
		"all",
	);
	// Per-row feedback (by id or name)
	const [feedback, setFeedback] = React.useState<
		Record<string, { sentiment: "up" | "down" | null; note: string }>
	>({});
	const getKey = React.useCallback(
		(r: DirectMailCampaign) => r.id ?? r.name,
		[],
	);

	React.useEffect(() => {
		setData(generateDirectMailCampaignData());
	}, []);
	const columns = React.useMemo(() => buildDirectMailColumns(), []);

	const filtered = React.useMemo(() => {
		const base = filterCampaigns(data, query);
		const byStatus = base.filter((r) => {
			if (statusFilter === "all") return true;
			const s = String(r.status ?? "").toLowerCase();
			if (statusFilter === "scheduled")
				return s === "queued" || s === "pending";
			if (statusFilter === "active")
				return ["delivering", "delivered", "read", "unread", "paused"].includes(
					s,
				);
			if (statusFilter === "completed") return s === "completed";
			if (statusFilter === "canceled") return s === "failed" || s === "missed";
			return true;
		});
		const byDnc = byStatus.filter((r) => {
			const d = Number(r.dnc ?? 0);
			if (dncFilter === "all") return true;
			if (dncFilter === "only") return d > 0;
			if (dncFilter === "hide") return d === 0;
			return true;
		});
		return byDnc;
	}, [data, query, statusFilter, dncFilter]);

	const pageSize = 10;
	const { table } = useDataTable<DirectMailCampaign>({
		data: filtered,
		columns,
		pageCount: Math.max(1, Math.ceil(filtered.length / pageSize)),
		initialState: {
			pagination: { pageIndex: 0, pageSize },
			// Important: "select" must always be the first column (pinned). "feedback" should come immediately after but NOT be pinned/sticky.
			columnPinning: { left: ["select"], right: [] },
			columnOrder: [
				"select",
				"feedback",
				"controls",
				"name",
				"calls",
				"inQueue",
				"leads",
				"status",
				"transfer",
				"transfers",
				"startDate",
			],
			columnVisibility: {
				calls: false,
				inQueue: false,
				leads: false,
				// LOB fields hidden by default
				lob_id: false,
				lob_url: false,
				lob_carrier: false,
				lob_front_template_id: false,
				lob_back_template_id: false,
				lob_date_created: false,
				lob_date_modified: false,
				lob_send_date: false,
				lob_use_type: false,
				lob_fsc: false,
				lob_sla: false,
				lob_object: false,
				// LOB To address fields
				lob_to_id: false,
				lob_to_company: false,
				lob_to_name: false,
				lob_to_phone: false,
				lob_to_email: false,
				lob_to_address_line1: false,
				lob_to_address_line2: false,
				lob_to_address_city: false,
				lob_to_address_state: false,
				lob_to_address_zip: false,
				lob_to_address_country: false,
				lob_to_date_created: false,
				lob_to_date_modified: false,
				lob_to_object: false,
				// LOB Letter-specific fields
				lob_letter_template_id: false,
				lob_letter_envelope_type: false,
				lob_letter_page_count: false,
				lob_letter_color: false,
				lob_letter_double_sided: false,
				lob_letter_address_placement: false,
				lob_letter_return_envelope_included: false,
				// LOB From-address fields
				lob_from_id: false,
				lob_from_name: false,
				lob_from_company: false,
				lob_from_phone: false,
				lob_from_email: false,
				lob_from_address_line1: false,
				lob_from_address_line2: false,
				lob_from_address_city: false,
				lob_from_address_state: false,
				lob_from_address_zip: false,
				lob_from_address_country: false,
				lob_from_date_created: false,
				lob_from_date_modified: false,
				lob_from_object: false,
				// LOB Snap Pack-specific fields
				lob_snap_outside_template_id: false,
				lob_snap_inside_template_id: false,
				lob_snap_inside_template_version_id: false,
				lob_snap_outside_template_version_id: false,
				lob_snap_size: false,
				lob_snap_mail_type: false,
				lob_snap_expected_delivery_date: false,
				lob_snap_color: false,
				lob_snap_thumbnail_large_1: false,
			},
		},
		enableColumnPinning: true,
		// Controls + Feedback used by Direct Mail columns
		meta: {
			onPause: (row: DirectMailCampaign) => {
				const key = getKey(row);
				setData((prev) =>
					prev.map((r) => (getKey(r) === key ? { ...r, status: "paused" } : r)),
				);
			},
			onResume: (row: DirectMailCampaign) => {
				const key = getKey(row);
				setData((prev) =>
					prev.map((r) => (getKey(r) === key ? { ...r, status: "queued" } : r)),
				);
			},
			onStop: (row: DirectMailCampaign) => {
				const key = getKey(row);
				setData((prev) =>
					prev.map((r) =>
						getKey(r) === key ? { ...r, status: "completed" } : r,
					),
				);
			},
			getFeedback: (row: DirectMailCampaign) => feedback[getKey(row)],
			onToggleFeedback: (row: DirectMailCampaign, s: "up" | "down") => {
				const key = getKey(row);
				setFeedback((prev) => {
					const cur = prev[key] ?? { sentiment: null, note: "" };
					const nextSentiment = cur.sentiment === s ? null : s;
					return { ...prev, [key]: { ...cur, sentiment: nextSentiment } };
				});
			},
			onFeedbackNoteChange: (row: DirectMailCampaign, note: string) => {
				const key = getKey(row);
				setFeedback((prev) => {
					const cur = prev[key] ?? { sentiment: null, note: "" };
					return { ...prev, [key]: { ...cur, note } };
				});
			},
		},
	});

	const carousel = useRowCarousel(table, { loop: true });

	function getSelectedRows(): DirectMailCampaign[] {
		return table
			.getFilteredSelectedRowModel()
			.rows.map((r) => r.original as DirectMailCampaign);
	}

	function getAllRows(): DirectMailCampaign[] {
		return table
			.getFilteredRowModel()
			.rows.map((r) => r.original as DirectMailCampaign);
	}

	return (
		<main className="container mx-auto max-w-7xl space-y-6 p-6">
			<header className="space-y-1">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h1 className="font-semibold text-2xl tracking-tight">
							Direct Mail Campaigns
						</h1>
						<p className="text-muted-foreground text-sm">
							Search, selection, filtering, and details.
						</p>
					</div>
					<div className="flex items-center gap-2">
						{onNavigate && (
							<>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => onNavigate("calls")}
								>
									Calls
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => onNavigate("text")}
								>
									Text
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => onNavigate("social")}
								>
									Social
								</Button>
								<Button
									type="button"
									variant="default"
									size="sm"
									onClick={() => onNavigate("directMail")}
								>
									Direct Mail
								</Button>
							</>
						)}
						<Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
							Create Campaign
						</Button>
					</div>
				</div>
			</header>
			<SummaryPanel
				filtered={filtered}
				dateChip={dateChip}
				setDateChip={setDateChip}
				campaignType={campaignType}
				onOpenWithRows={(rows) => {
					if (!rows || rows.length === 0) return;
					const dmRows = (rows as unknown[]).filter(
						(r): r is DirectMailCampaign =>
							r != null &&
							typeof r === "object" &&
							"template" in (r as Record<string, unknown>) &&
							"mailType" in (r as Record<string, unknown>),
					);
					setAiRows(dmRows);
					setAiOpen(true);
				}}
			/>

			<DataTable<DirectMailCampaign>
				table={table}
				className="mt-2"
				onRowClick={(row) => {
					carousel.openAt(row);
				}}
				actionBar={
					<SelectionBar
						table={table}
						filename="direct-mail-campaigns"
						onUseSelected={() => {
							const rows = getSelectedRows();
							if (rows.length === 0) return;
							setAiRows(rows);
							setAiOpen(true);
						}}
						onUseAll={() => {
							const rows = getAllRows();
							setAiRows(rows);
							setAiOpen(true);
						}}
					/>
				}
			>
				<DataTableToolbar table={table} className="mb-3 md:mb-4">
					<Input
						aria-label="Global search"
						placeholder="Search campaigns..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
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
					<AIMenu
						selectedCount={table.getFilteredSelectedRowModel().rows.length}
						allCount={table.getFilteredRowModel().rows.length}
						onUseSelected={() => {
							const rows = getSelectedRows();
							if (rows.length === 0) return;
							setAiRows(rows);
							setAiOpen(true);
						}}
						onUseAll={() => {
							const rows = getAllRows();
							setAiRows(rows);
							setAiOpen(true);
						}}
					/>
					<DataTableExportButton
						table={table}
						filename="direct-mail-campaigns"
						excludeColumns={["select"]}
					/>
				</DataTableToolbar>
			</DataTable>
			<AIDialogPanel
				open={aiOpen}
				onOpenChange={setAiOpen}
				aiRows={aiRows}
				aiOutput={aiOutput}
				setAiOutput={setAiOutput}
				summarizeRows={(rows) => summarizeRows(rows)}
			/>
			<CampaignModalMain
				open={createOpen}
				onOpenChange={setCreateOpen}
				defaultChannel="directmail"
			/>
			<DirectMailRowCarousel
				table={table}
				open={carousel.open}
				setOpen={carousel.setOpen}
				index={carousel.index}
				setIndex={carousel.setIndex}
				rows={carousel.rows}
			/>
		</main>
	);
}
