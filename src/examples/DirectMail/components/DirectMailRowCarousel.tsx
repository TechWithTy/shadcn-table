"use client";

import * as React from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { DataTableRowModalCarousel } from "../../../components/data-table/data-table-row-modal-carousel";
import type { Table, Row } from "@tanstack/react-table";
import type { DirectMailCampaign, DirectMailLead } from "../utils/mock";

export function DirectMailRowCarousel({
	table,
	open,
	setOpen,
	index,
	setIndex,
	rows: rowsProp,
}: {
	table: Table<DirectMailCampaign>;
	open: boolean;
	setOpen: (v: boolean) => void;
	index: number;
	setIndex: (i: number) => void;
	rows?: Row<DirectMailCampaign>[];
}) {
	const rows = rowsProp ?? table.getRowModel().rows;
	const [detailIndex, setDetailIndex] = React.useState(0); // lead index
	const [mailingIndex, setMailingIndex] = React.useState(0); // mailing index within lead
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	React.useEffect(() => {
		if (open) {
			setDetailIndex(0);
			setMailingIndex(0);
		}
	}, [open, index]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	React.useEffect(() => {
		// Reset mailing selection when lead changes
		setMailingIndex(0);
	}, [detailIndex]);

	return (
		<DataTableRowModalCarousel
			table={table}
			open={open}
			onOpenChange={setOpen}
			index={index}
			setIndex={setIndex}
			rows={rows}
			onPrev={() => {
				const row = rows[index];
				const leads = rows[index]?.original.leadsDetails ?? [];
				setDetailIndex((i) =>
					leads.length ? (i - 1 + leads.length) % leads.length : 0,
				);
			}}
			onNext={() => {
				const row = rows[index];
				const leads = rows[index]?.original.leadsDetails ?? [];
				setDetailIndex((i) => (leads.length ? (i + 1) % leads.length : 0));
			}}
			title={(row) => {
				const leads = row.original.leadsDetails || [];
				const lead: DirectMailLead | undefined = leads[detailIndex];
				return (
					<div className="flex items-center gap-2">
						<span>
							{lead ? `${row.original.name} — ${lead.name}` : row.original.name}
						</span>
						<Badge variant="secondary">Leads: {leads.length}</Badge>
					</div>
				);
			}}
			description={(row) => {
				const leads = row.original.leadsDetails || [];
				const lead: DirectMailLead | undefined = leads[detailIndex];
				return lead
					? `${lead.address}`
					: `Started: ${new Date(row.original.startDate).toLocaleDateString()}`;
			}}
			counter={(row) => {
				const leads = row.original.leadsDetails || [];
				return leads.length ? `${detailIndex + 1} / ${leads.length}` : "-";
			}}
			actions={(row) => {
				async function downloadZip() {
					const zip = new JSZip();
					const leads = row.original.leadsDetails || [];
					leads.forEach((ld, idx: number) => {
						const filename = ld.pdfFilename || `doc_${idx + 1}.pdf`;
						const content = ld.pdfContent || `Document ${idx + 1}`;
						zip.file(filename, content);
					});
					const blob = await zip.generateAsync({ type: "blob" });
					saveAs(blob, `${row.original.name.replace(/\s+/g, "_")}_docs.zip`);
				}
				return (
					<Button type="button" size="sm" onClick={downloadZip}>
						Download ZIP
					</Button>
				);
			}}
			render={(row) => {
				const r = row.original;
				const leads = r?.leadsDetails || [];
				const lead: DirectMailLead | undefined = leads[detailIndex];
				const mailings = lead?.mailings || [];
				const curMail = mailings[mailingIndex];
				const fmt = (d?: string) => {
					if (!d) return "-";
					const dt = new Date(String(d));
					return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleString();
				};
				return (
					<div className="grid gap-3 md:grid-cols-2">
						{lead ? (
							<div className="rounded-md border p-3">
								<div className="font-medium">Lead Details</div>
								<div className="text-muted-foreground text-xs">{lead.id}</div>
								<div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
									<div>
										<div className="text-muted-foreground text-xs">Name</div>
										<div className="font-medium">{lead.name}</div>
									</div>
									<div>
										<div className="text-muted-foreground text-xs">Address</div>
										<div className="font-medium">{lead.address}</div>
									</div>
									{curMail ? (
										<>
											<div>
												<div className="text-muted-foreground text-xs">PDF</div>
												<div className="font-medium">{curMail.pdfFilename}</div>
											</div>
											<div>
												<div className="text-muted-foreground text-xs">
													Transfers
												</div>
												<div className="font-medium">
													{typeof curMail.transfers === "number"
														? curMail.transfers
														: 0}
												</div>
											</div>
										</>
									) : null}
								</div>
								{curMail ? (
									<>
										<div>
											<div className="text-muted-foreground text-xs">
												Template
											</div>
											<div className="font-medium">
												{curMail.template?.name ?? "-"}
											</div>
											<div className="text-muted-foreground text-xs">
												{curMail.template?.id ?? ""}
											</div>
										</div>
										<div>
											<div className="text-muted-foreground text-xs">
												Mail Type
											</div>
											<div className="font-medium">
												{String(curMail.mailType ?? "-")}
											</div>
										</div>
										<div>
											<div className="text-muted-foreground text-xs">
												Mail Size
											</div>
											<div className="font-medium">
												{String(curMail.mailSize ?? "-")}
											</div>
										</div>
										<div>
											<div className="text-muted-foreground text-xs">
												Send Date
											</div>
											<div className="font-medium">{fmt(curMail.sendDate)}</div>
										</div>
										<div>
											<div className="text-muted-foreground text-xs">
												Expected Delivery
											</div>
											<div className="font-medium">
												{fmt(curMail.expectedDeliveryAt)}
											</div>
										</div>
										<div>
											<div className="text-muted-foreground text-xs">
												Status
											</div>
											<div className="font-medium capitalize">
												{String(curMail.status ?? "-").replace(/_/g, " ")}
											</div>
										</div>
									</>
								) : null}
								<div>
									<div className="text-muted-foreground text-xs">
										Address Verified
									</div>
									<div className="font-medium">
										{r.addressVerified ? "Yes" : "No"}
									</div>
								</div>
								<div>
									<div className="text-muted-foreground text-xs">
										Last Event
									</div>
									<div className="font-medium">{fmt(r.lastEventAt)}</div>
								</div>
							</div>
						) : null}

						{/* Mailing Thread for selected lead */}
						<div className="rounded-md border p-3">
							<div className="mb-2 font-medium">Mailing Thread</div>
							<div className="grid max-h-[340px] gap-2 overflow-auto pr-1">
								{Array.isArray(mailings) && mailings.length ? (
									mailings.map((m, idx: number) => {
										const isActive = idx === mailingIndex;
										return (
											<button
												key={m.id || idx}
												type="button"
												onClick={() => setMailingIndex(idx)}
												className={`cursor-pointer rounded border p-2 text-left text-sm transition-colors ${isActive ? "bg-muted" : "hover:bg-accent"}`}
												aria-current={isActive ? "true" : undefined}
											>
												<div className="flex items-center justify-between gap-2">
													<div className="flex items-center gap-2 font-medium">
														<span className="max-w-[140px] truncate">
															{m.template?.name ?? "Template"}
														</span>
														<Badge variant="outline">
															{String(m.mailType ?? "-")}
														</Badge>
														<Badge variant="outline">
															{String(m.mailSize ?? "-")}
														</Badge>
													</div>
													<div className="text-muted-foreground text-xs">
														{fmt(m.sendDate)}
													</div>
												</div>
												<div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
													{typeof m?.transfers === "number" ? (
														<Badge variant="secondary">
															Transfers: {m.transfers}
														</Badge>
													) : null}
													<Badge variant="outline" className="capitalize">
														{String(m.status ?? "-").replace(/_/g, " ")}
													</Badge>
												</div>
												<div className="mt-2 text-muted-foreground text-xs">
													{m.pdfFilename}
												</div>
												{/* LOB details removed by request */}
											</button>
										);
									})
								) : (
									<div className="text-muted-foreground">No mailings</div>
								)}
							</div>
						</div>
						{/* LOB Details removed; mailings are the source of truth */}
						<div className="grid grid-cols-3 gap-3">
							<div>
								<div className="text-muted-foreground text-xs">Delivered</div>
								<div className="font-medium tabular-nums">
									{Number(r.deliveredCount ?? 0)}
								</div>
							</div>
							<div>
								<div className="text-muted-foreground text-xs">Returned</div>
								<div className="font-medium tabular-nums">
									{Number(r.returnedCount ?? 0)}
								</div>
							</div>
							<div>
								<div className="text-muted-foreground text-xs">Failed</div>
								<div className="font-medium tabular-nums">
									{Number(r.failedCount ?? 0)}
								</div>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div>
								<div className="text-muted-foreground text-xs">Total Items</div>
								<div className="font-medium tabular-nums">
									{Number(r.deliveredCount ?? 0)}
								</div>
							</div>
							<div>
								<div className="text-muted-foreground text-xs">Cost</div>
								<div className="font-medium tabular-nums">
									${Number(r.cost ?? 0).toFixed(2)}
								</div>
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							<Badge variant="outline">
								Delivered: {r?.deliveredCount ?? "-"}
							</Badge>
							<Badge variant="outline">
								Returned: {r?.returnedCount ?? "-"}
							</Badge>
							<Badge variant="outline">Failed: {r?.failedCount ?? "-"}</Badge>
							{typeof r?.deliveredCount === "number" ? (
								<Badge variant="outline">Total Items: {r.deliveredCount}</Badge>
							) : null}
							<Badge variant="outline">
								Cost: ${Number(r?.cost ?? 0).toFixed(2)}
							</Badge>
							<Badge variant="outline">
								Transfers:{" "}
								{(leads ?? []).reduce(
									(a: number, ld: DirectMailLead) => a + (ld.transfers ?? 0),
									0,
								)}
							</Badge>
						</div>
					</div>
				);
			}}
		/>
	);
}
