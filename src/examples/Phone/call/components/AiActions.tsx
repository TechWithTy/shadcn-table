"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { Button } from "../../../../components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../../../components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "../../../../components/ui/tooltip";
import { Sparkles, BarChart3, MessageSquare, FileText } from "lucide-react";
import type { CallCampaign } from "../../../../../../../types/_dashboard/campaign";

type Props = {
	table: Table<CallCampaign>;
};

export function AiActions({ table }: Props) {
	const [open, setOpen] = React.useState(false);
	const [rows, setRows] = React.useState<CallCampaign[]>([]);
	const [output, setOutput] = React.useState<string>("");

	const getSelectedRows = React.useCallback((): CallCampaign[] => {
		return table
			.getFilteredSelectedRowModel()
			.rows.map((r) => r.original as CallCampaign);
	}, [table]);

	const getAllRows = React.useCallback((): CallCampaign[] => {
		return table
			.getFilteredRowModel()
			.rows.map((r) => r.original as CallCampaign);
	}, [table]);

	function summarizeRows(r: CallCampaign[]) {
		const count = r.length;
		type Accumulator = {
			calls: number;
			leads: number;
			inQueue: number;
		};

		const totals = r.reduce<Accumulator>(
			(acc, item) => {
				acc.calls += item.calls ?? 0;
				acc.leads += item.leads ?? 0;
				acc.inQueue += item.inQueue ?? 0;
				return acc;
			},
			{ calls: 0, leads: 0, inQueue: 0 },
		);
		const avg = (n: number): number =>
			count ? Math.round((n / count) * 100) / 100 : 0;
		return [
			`Rows: ${count}`,
			`Calls: ${totals.calls} (avg ${avg(totals.calls)})`,
			`Leads: ${totals.leads} (avg ${avg(totals.leads)})`,
			`In Queue: ${totals.inQueue} (avg ${avg(totals.inQueue)})`,
		].join("\n");
	}

	return (
		<>
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
						disabled={table.getFilteredSelectedRowModel().rows.length === 0}
						onSelect={() => {
							const rs = getSelectedRows();
							if (rs.length === 0) return;
							setRows(rs);
							setOpen(true);
						}}
					>
						Use Selected ({table.getFilteredSelectedRowModel().rows.length})
					</DropdownMenuItem>
					<DropdownMenuItem
						onSelect={() => {
							const rs = getAllRows();
							setRows(rs);
							setOpen(true);
						}}
					>
						Use All ({table.getFilteredRowModel().rows.length})
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-h-[80vh] w-[min(90vw,900px)] max-w-[900px] overflow-y-auto overflow-x-visible pb-8">
					<DialogHeader>
						<DialogTitle>AI Actions — {rows.length} campaign(s)</DialogTitle>
					</DialogHeader>

					<div className="flex snap-x snap-mandatory flex-nowrap gap-3 overflow-x-auto overflow-y-visible pr-1 pb-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									onClick={() => setOutput(summarizeRows(rows))}
									className="min-w-[200px] snap-start rounded-md border bg-card p-4 text-left shadow-xs hover:bg-accent focus:outline-none"
								>
									<div className="flex items-center gap-2">
										<Sparkles className="h-5 w-5 text-purple-500" />
										<div className="font-medium">Summarize</div>
									</div>
									<div className="mt-1 text-muted-foreground text-xs">
										Stats for the chosen rows
									</div>
								</button>
							</TooltipTrigger>
							<TooltipContent
								side="top"
								sideOffset={10}
								className="z-[60] mb-1"
							>
								See totals and averages
							</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									onClick={() => {
										const score = Math.min(
											100,
											50 + Math.round((rows.length % 50) * 1.2),
										);
										setOutput(
											`Quality score (mock): ${score}/100 for ${rows.length} row(s).`,
										);
									}}
									className="min-w-[200px] snap-start rounded-md border bg-card p-4 text-left shadow-xs hover:bg-accent focus:outline-none"
								>
									<div className="flex items-center gap-2">
										<BarChart3 className="h-5 w-5 text-blue-500" />
										<div className="font-medium">Quality Score</div>
									</div>
									<div className="mt-1 text-muted-foreground text-xs">
										Estimate campaign quality
									</div>
								</button>
							</TooltipTrigger>
							<TooltipContent
								side="top"
								sideOffset={10}
								className="z-[60] mb-1"
							>
								Mock quality estimation
							</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									onClick={() =>
										setOutput(
											`Drafted ${rows.length} outreach message(s). (mock)`,
										)
									}
									className="min-w-[200px] snap-start rounded-md border bg-card p-4 text-left shadow-xs hover:bg-accent focus:outline-none"
								>
									<div className="flex items-center gap-2">
										<MessageSquare className="h-5 w-5 text-green-500" />
										<div className="font-medium">Draft Outreach</div>
									</div>
									<div className="mt-1 text-muted-foreground text-xs">
										Create sample messages
									</div>
								</button>
							</TooltipTrigger>
							<TooltipContent
								side="top"
								sideOffset={10}
								className="z-[60] mb-1"
							>
								Generate outreach copy (mock)
							</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									onClick={() =>
										setOutput(
											`Generated mini-report for ${rows.length} row(s). (mock)`,
										)
									}
									className="min-w-[200px] snap-start rounded-md border bg-card p-4 text-left shadow-xs hover:bg-accent focus:outline-none"
								>
									<div className="flex items-center gap-2">
										<FileText className="h-5 w-5 text-amber-500" />
										<div className="font-medium">Mini Report</div>
									</div>
									<div className="mt-1 text-muted-foreground text-xs">
										Quick downloadable report
									</div>
								</button>
							</TooltipTrigger>
							<TooltipContent
								side="top"
								sideOffset={10}
								className="z-[60] mb-1"
							>
								Mock report (no download)
							</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									onClick={() =>
										setOutput("Starting AI-assisted campaign creation… (mock)")
									}
									className="min-w-[200px] snap-start rounded-md border bg-card p-4 text-left shadow-xs hover:bg-accent focus:outline-none"
								>
									<div className="flex items-center gap-2">
										<Sparkles className="h-5 w-5 text-pink-500" />
										<div className="font-medium">Create Campaign with AI</div>
									</div>
									<div className="mt-1 text-muted-foreground text-xs">
										Draft a new campaign from selected data
									</div>
								</button>
							</TooltipTrigger>
							<TooltipContent
								side="top"
								sideOffset={10}
								className="z-[60] mb-1"
							>
								Prototype action (mock)
							</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									onClick={() => {
										if (rows.length !== 2) {
											setOutput(
												"Select exactly two rows to compare as A/B test.",
											);
											return;
										}
										const a = rows[0];
										const b = rows[1];
										const aCalls = a?.calls ?? 0;
										const bCalls = b?.calls ?? 0;
										const aLeads = a?.leads ?? 0;
										const bLeads = b?.leads ?? 0;
										const callsWinner =
											aCalls === bCalls ? "Tie" : aCalls > bCalls ? "A" : "B";
										const leadsWinner =
											aLeads === bLeads ? "Tie" : aLeads > bLeads ? "A" : "B";
										setOutput(
											[
												"A/B Comparison (mock)",
												`Calls — A:${aCalls} vs B:${bCalls} (Winner: ${callsWinner})`,
												`Leads — A:${aLeads} vs B:${bLeads} (Winner: ${leadsWinner})`,
											].join("\n"),
										);
									}}
									disabled={rows.length !== 2}
									className="min-w-[200px] snap-start rounded-md border bg-card p-4 text-left shadow-xs hover:bg-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
								>
									<div className="flex items-center gap-2">
										<BarChart3 className="h-5 w-5 text-teal-500" />
										<div className="font-medium">Compare as A/B Test</div>
									</div>
									<div className="mt-1 text-muted-foreground text-xs">
										Requires exactly two selections
									</div>
								</button>
							</TooltipTrigger>
							<TooltipContent
								side="top"
								sideOffset={10}
								className="z-[60] mb-1"
							>
								Select two rows to compare
							</TooltipContent>
						</Tooltip>
					</div>

					<div className="mt-3 whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-xs">
						{output || "Pick an action above to see output here."}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
