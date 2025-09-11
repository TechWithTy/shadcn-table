"use client";

import type * as React from "react";
import type { DemoRow, DemoLead } from "./types";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "../../components/ui/tooltip";
import { Button } from "../../components/ui/button";
import { MessageSquare } from "lucide-react";
import { formatLeadDossier, formatLeadDossierSummary } from "./leadDetailUtils";

function buildSingleInit(lead: DemoLead, listName?: string) {
  const name = (lead.name || "").trim().split(/\s+/);
  const firstName = name[0] ?? "";
  const lastName = name.slice(1).join(" ");
  const address = lead.address;
  const email = lead.email;
  const phone = lead.phone;
  const socialMedia = lead.socials?.[0]?.url ?? "";
  return {
    type: "single" as const,
    firstName,
    lastName,
    address,
    email,
    phone,
    socialMedia,
    listName,
  };
}

interface LeadRowCarouselPanelProps {
	row: DemoRow;
	leadIndex: number;
	setLeadIndex: (index: number) => void;
	showAllLeads: boolean;
	setShowAllLeads: (show: boolean) => void;
	onOpenSkipTrace?: (options: { type: "single" }) => void;
	setData: React.Dispatch<React.SetStateAction<DemoRow[]>>;
}

export function LeadRowCarouselPanel(props: LeadRowCarouselPanelProps) {
	const {
		row,
		leadIndex,
		showAllLeads,
		setShowAllLeads,
		onOpenSkipTrace,
		setData,
	} = props;

	if (showAllLeads) {
		return (
			<div className="max-h-[70vh] overflow-y-auto pr-1">
				<div className="mb-2 flex items-center justify-end gap-2 text-xs">
					<span className="text-muted-foreground">Leads per page</span>
					<Select
						value="all"
						onValueChange={(v) => setShowAllLeads(v === "all")}
					>
						<SelectTrigger className="h-7 w-[120px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="one">One</SelectItem>
							<SelectItem value="all">All</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-3">
					{row.leads.map((lead) => (
						<div key={lead.id} className="rounded-md border p-3">
							<div className="grid grid-cols-12 items-start gap-2">
								<div className="col-span-6">
									<div className="font-medium">{lead.name}</div>
									<div className="text-muted-foreground text-xs">
										{lead.address}
									</div>
									<div className="mt-2 text-sm tabular-nums">{lead.phone}</div>
									<div className="mt-1 truncate text-sm">
										<a
											href={`mailto:${lead.email}`}
											className="text-primary underline-offset-2 hover:underline"
										>
											{lead.email}
										</a>
									</div>
									<div className="mt-2 text-muted-foreground text-xs">
										Assoc. Address: {lead.associatedAddress}
									</div>
									<div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
										<span
											className={`rounded border px-1.5 py-0.5 ${lead.isIPhone ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}
										>
											Is iPhone: {lead.isIPhone ? "Yes" : "No"}
										</span>
										<span
											className={`rounded border px-1.5 py-0.5 ${lead.addressVerified ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}
										>
											Address {lead.addressVerified ? "Verified" : "Unverified"}
										</span>
										<span
											className={`rounded border px-1.5 py-0.5 ${lead.phoneVerified ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}
										>
											Phone {lead.phoneVerified ? "Verified" : "Unverified"}
										</span>
										<span
											className={`rounded border px-1.5 py-0.5 ${lead.emailVerified ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}
										>
											Email {lead.emailVerified ? "Verified" : "Unverified"}
										</span>
										<span
											className={`rounded border px-1.5 py-0.5 ${lead.socialVerified ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}
										>
											Social {lead.socialVerified ? "Verified" : "Unverified"}
										</span>
									</div>
								</div>
								<div className="col-span-4 text-sm">
									<div className="flex flex-wrap gap-2">
										{lead.socials.map((s) => (
											<a
												key={s.label}
												href={s.url}
												target="_blank"
												rel="noreferrer"
												className="text-primary underline-offset-2 hover:underline"
											>
												{s.label}
											</a>
										))}
									</div>
								</div>
								<div className="col-span-2 flex items-center justify-end gap-2">
									<Select
										value={lead.status}
										onValueChange={(val) => {
											setData((prev) =>
												prev.map((r) =>
													r.id === row.id
														? {
																...r,
																leads: r.leads.map((l) =>
																	l.id === lead.id
																		? {
																				...l,
																				status: val as DemoLead["status"],
																			}
																		: l,
																),
															}
														: r,
												),
											);
										}}
									>
										<SelectTrigger className="h-8 w-[140px]">
											<SelectValue placeholder="Status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="New Lead">New Lead</SelectItem>
											<SelectItem value="Contacted">Contacted</SelectItem>
											<SelectItem value="Qualified">Qualified</SelectItem>
											<SelectItem value="Do Not Contact">
												Do Not Contact
											</SelectItem>
										</SelectContent>
									</Select>
									<div className="flex items-center gap-1">
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={async (e) => {
														e.stopPropagation();
														await navigator.clipboard.writeText(
															formatLeadDossier(lead),
														);
													}}
													aria-label="Copy social dossier"
												>
													<MessageSquare className="h-4 w-4" />
												</Button>
											</TooltipTrigger>
											<TooltipContent
												side="top"
												sideOffset={8}
												className="z-[100] max-w-80 whitespace-normal break-words"
											>
												<div className="text-left text-xs leading-5">
													{formatLeadDossierSummary(lead)}
												</div>
											</TooltipContent>
										</Tooltip>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => onOpenSkipTrace?.({ type: "single" })}
										>
											Skip Trace Lead
										</Button>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	const lead: DemoLead | undefined = row.leads[leadIndex];
	if (!lead) {
		return <div className="text-muted-foreground">No lead</div>;
	}
	return (
		<div className="max-h-[70vh] overflow-y-auto pr-1">
			<div className="mb-2 flex items-center justify-end gap-2 text-xs">
				<span className="text-muted-foreground">Leads per page</span>
				<Select value="one" onValueChange={(v) => setShowAllLeads(v === "all")}>
					<SelectTrigger className="h-7 w-[120px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="one">One</SelectItem>
						<SelectItem value="all">All</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="rounded-md border p-3">
				<div className="grid grid-cols-12 items-start gap-2">
					<div className="col-span-6">
						<div className="font-medium">{lead.name}</div>
						<div className="text-muted-foreground text-xs">{lead.address}</div>
						<div className="mt-2 text-sm tabular-nums">{lead.phone}</div>
						<div className="mt-1 truncate text-sm">
							<a
								href={`mailto:${lead.email}`}
								className="text-primary underline-offset-2 hover:underline"
							>
								{lead.email}
							</a>
						</div>
						<div className="mt-2 text-muted-foreground text-xs">
							Assoc. Address: {lead.associatedAddress}
						</div>
						<div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
							<span
								className={`rounded border px-1.5 py-0.5 ${lead.isIPhone ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}
							>
								Is iPhone: {lead.isIPhone ? "Yes" : "No"}
							</span>
							<span
								className={`rounded border px-1.5 py-0.5 ${lead.addressVerified ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}
							>
								Address {lead.addressVerified ? "Verified" : "Unverified"}
							</span>
							<span
								className={`rounded border px-1.5 py-0.5 ${lead.phoneVerified ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}
							>
								Phone {lead.phoneVerified ? "Verified" : "Unverified"}
							</span>
							<span
								className={`rounded border px-1.5 py-0.5 ${lead.emailVerified ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}
							>
								Email {lead.emailVerified ? "Verified" : "Unverified"}
							</span>
							<span
								className={`rounded border px-1.5 py-0.5 ${lead.socialVerified ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}
							>
								Social {lead.socialVerified ? "Verified" : "Unverified"}
							</span>
						</div>
					</div>
					<div className="col-span-4 text-sm">
						<div className="flex flex-wrap gap-2">
							{lead.socials.map((s) => (
								<a
									key={s.label}
									href={s.url}
									target="_blank"
									rel="noreferrer"
									className="text-primary underline-offset-2 hover:underline"
								>
									{s.label}
								</a>
							))}
						</div>
					</div>
					<div className="col-span-2 flex items-center justify-end gap-2">
						<Select
							value={lead.status}
							onValueChange={(val) => {
								setData((prev) =>
									prev.map((r) =>
										r.id === row.id
											? {
													...r,
													leads: r.leads.map((l) =>
														l.id === lead.id
															? { ...l, status: val as DemoLead["status"] }
															: l,
													),
												}
											: r,
									),
								);
							}}
						>
							<SelectTrigger className="h-8 w-[140px]">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="New Lead">New Lead</SelectItem>
								<SelectItem value="Contacted">Contacted</SelectItem>
								<SelectItem value="Qualified">Qualified</SelectItem>
								<SelectItem value="Do Not Contact">Do Not Contact</SelectItem>
							</SelectContent>
						</Select>
						<div className="flex items-center gap-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={async (e) => {
											e.stopPropagation();
											await navigator.clipboard.writeText(
												formatLeadDossier(lead),
											);
										}}
										aria-label="Copy social dossier"
									>
										<MessageSquare className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent
									side="top"
									sideOffset={8}
									className="z-[100] max-w-80 whitespace-normal break-words"
								>
									<div className="text-left text-xs leading-5">
										{formatLeadDossierSummary(lead)}
									</div>
								</TooltipContent>
							</Tooltip>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => onOpenSkipTrace?.(buildSingleInit(lead, row.list))}
							>
								Skip Trace Lead
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
