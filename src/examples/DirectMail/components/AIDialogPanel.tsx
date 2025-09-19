"use client";
import * as React from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "../../../components/ui/tooltip";
import { Sparkles, BarChart3, MessageSquare, FileText } from "lucide-react";
import type { CampaignBase } from "../../../../../../types/_dashboard/campaign";

// Narrow an array of T to a tuple [T, T] when it has exactly two items
function hasTwo<T>(arr: T[]): arr is [T, T] {
	return arr.length === 2;
}

type AICampaignRow = CampaignBase & Partial<{ calls: number; leads: number }>;

export function AIDialogPanel(props: {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	aiRows: AICampaignRow[];
	aiOutput: string;
	setAiOutput: (v: string) => void;
	summarizeRows: (rows: AICampaignRow[]) => string;
}) {
	const { open, onOpenChange, aiRows, aiOutput, setAiOutput, summarizeRows } =
		props;
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[80vh] w-[min(90vw,900px)] max-w-[900px] overflow-y-auto overflow-x-visible pb-8">
				<DialogHeader>
					<DialogTitle>AI Actions — {aiRows.length} campaign(s)</DialogTitle>
				</DialogHeader>

				<div className="flex snap-x snap-mandatory flex-nowrap gap-3 overflow-x-auto overflow-y-visible pr-1 pb-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={() => setAiOutput(summarizeRows(aiRows))}
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
						<TooltipContent side="top" sideOffset={10} className="z-[60] mb-1">
							See totals and averages
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={() => {
									const rows = aiRows;
									const score = Math.min(
										100,
										50 + Math.round((rows.length % 50) * 1.2),
									);
									setAiOutput(
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
						<TooltipContent side="top" sideOffset={10} className="z-[60] mb-1">
							Mock quality estimation
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={() =>
									setAiOutput(
										`Drafted ${aiRows.length} outreach message(s). (mock)`,
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
						<TooltipContent side="top" sideOffset={10} className="z-[60] mb-1">
							Generate outreach copy (mock)
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={() =>
									setAiOutput(
										`Generated mini-report for ${aiRows.length} row(s). (mock)`,
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
						<TooltipContent side="top" sideOffset={10} className="z-[60] mb-1">
							Mock report (no download)
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={() =>
									setAiOutput("Starting AI-assisted campaign creation… (mock)")
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
						<TooltipContent side="top" sideOffset={10} className="z-[60] mb-1">
							Prototype action (mock)
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={() => {
									if (!hasTwo(aiRows)) {
										setAiOutput(
											"Select exactly two rows to compare as A/B test.",
										);
										return;
									}
									const [a, b] = aiRows;
									const aCalls = a.calls ?? 0;
									const bCalls = b.calls ?? 0;
									const aLeads = a.leads ?? 0;
									const bLeads = b.leads ?? 0;
									const callsWinner =
										aCalls === bCalls ? "Tie" : aCalls > bCalls ? "A" : "B";
									const leadsWinner =
										aLeads === bLeads ? "Tie" : aLeads > bLeads ? "A" : "B";
									setAiOutput(
										[
											"A/B Comparison (mock)",
											`Calls — A:${aCalls} vs B:${bCalls} (Winner: ${callsWinner})`,
											`Leads — A:${aLeads} vs B:${bLeads} (Winner: ${leadsWinner})`,
										].join("\n"),
									);
								}}
								disabled={aiRows.length !== 2}
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
						<TooltipContent side="top" sideOffset={10} className="z-[60] mb-1">
							Select two rows to compare
						</TooltipContent>
					</Tooltip>
				</div>

				<div className="mt-3 whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-xs">
					{aiOutput || "Pick an action above to see output here."}
				</div>
			</DialogContent>
		</Dialog>
	);
}
