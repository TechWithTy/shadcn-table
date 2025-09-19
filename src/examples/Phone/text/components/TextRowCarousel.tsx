"use client";

import * as React from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { Row, Table } from "@tanstack/react-table";
import { DataTableRowModalCarousel } from "../../../../components/data-table/data-table-row-modal-carousel";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import type { CallCampaign } from "../../../../../../../types/_dashboard/campaign";
import type { TextMessage } from "../../../../../../../types/goHighLevel/text";

export function TextRowCarousel({
	table,
	open,
	setOpen,
	index,
	setIndex,
	rows,
}: {
	table: Table<CallCampaign>;
	open: boolean;
	setOpen: (v: boolean) => void;
	index: number;
	setIndex: (n: number) => void;
	rows: Row<CallCampaign>[];
}) {
	const [detailIndex, setDetailIndex] = React.useState(0);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	React.useEffect(() => {
		if (open) setDetailIndex(0);
	}, [open, index]);

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
				const msgs: TextMessage[] = row?.original?.messages ?? [];
				setDetailIndex((i) =>
					msgs.length ? (i - 1 + msgs.length) % msgs.length : 0,
				);
			}}
			onNext={() => {
				const row = rows[index];
				const msgs: TextMessage[] = row?.original?.messages ?? [];
				setDetailIndex((i) => (msgs.length ? (i + 1) % msgs.length : 0));
			}}
			title={(row: Row<CallCampaign>) => {
				const msgs: TextMessage[] = row.original?.messages ?? [];
				const cur = msgs[detailIndex];
				const prov =
					cur?.provider ||
					(cur?.twilioPayload
						? "twilio"
						: cur?.sendbluePayload
							? "sendblue"
							: "ghl");
				return (
					<div className="flex items-center gap-2">
						<span>{row.original.name}</span>
						<Badge variant="secondary">Messages: {msgs.length}</Badge>
						<Badge variant="outline" title="Provider">
							{String(prov)}
						</Badge>
					</div>
				);
			}}
			description={(row: Row<CallCampaign>) => {
				const msgs: TextMessage[] = row.original?.messages ?? [];
				const cur = msgs[detailIndex];
				const dt =
					cur?.dateAdded ||
					cur?.sendbluePayload?.date_sent ||
					cur?.twilioPayload?.dateSent;
				return cur
					? `${new Date(String(dt)).toLocaleString()}`
					: `Started: ${new Date(String(row.original?.startDate)).toLocaleDateString()}`;
			}}
			counter={(row: Row<CallCampaign>) => {
				const msgs = row.original?.messages || [];
				return msgs.length ? `${detailIndex + 1} / ${msgs.length}` : "-";
			}}
			actions={(row: Row<CallCampaign>) => {
				async function downloadThread() {
					const zip = new JSZip();
					const msgs = row.original?.messages || [];
					const transcript = msgs
						.map((m) => {
							const when =
								m.dateAdded ||
								m?.sendbluePayload?.date_sent ||
								m?.twilioPayload?.dateSent;
							return `${new Date(String(when)).toISOString()} | ${m.direction?.toUpperCase() || ""} | ${m.provider || (m.twilioPayload ? "twilio" : m.sendbluePayload ? "sendblue" : "ghl")} | ${m.body || m?.sendbluePayload?.content || m?.twilioPayload?.body || ""}`;
						})
						.join("\n");
					zip.file(
						`${row.original.name.replace(/\s+/g, "_")}_transcript.txt`,
						transcript || "No messages",
					);
					zip.file(
						`${row.original.name.replace(/\s+/g, "_")}_messages.json`,
						JSON.stringify(msgs, null, 2),
					);
					const blob = await zip.generateAsync({ type: "blob" });
					saveAs(blob, `${row.original.name.replace(/\s+/g, "_")}_thread.zip`);
				}
				return (
					<Button type="button" size="sm" onClick={downloadThread}>
						Download Thread
					</Button>
				);
			}}
			render={(row: Row<CallCampaign>) => {
				const r = row.original;
				const msgs = r?.messages || [];
				const cur = msgs[detailIndex];
				const provider =
					cur?.provider ||
					(cur?.twilioPayload
						? "twilio"
						: cur?.sendbluePayload
							? "sendblue"
							: "ghl");
				const service = cur?.service || cur?.sendbluePayload?.service || "SMS";
				const status =
					cur?.status ||
					cur?.sendbluePayload?.status ||
					cur?.twilioPayload?.status ||
					"-";
				const started =
					cur?.dateAdded ||
					cur?.sendbluePayload?.date_sent ||
					cur?.twilioPayload?.dateCreated;
				const updated =
					cur?.twilioPayload?.dateUpdated ||
					cur?.sendbluePayload?.date_updated ||
					cur?.dateAdded;

				const breakdown = r?.transferBreakdown ?? undefined;
				const entries = Object.entries(breakdown ?? {}).filter(
					(entry): entry is [string, number] =>
						typeof entry[1] === "number" && entry[1] > 0,
				);
				const totalTransfers: number =
					typeof r?.transfers === "number"
						? r.transfers
						: entries.reduce((a, [, v]) => a + v, 0);

				return (
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-3">
							<div>
								<h3 className="font-medium text-sm">Message</h3>
								<div className="text-muted-foreground text-xs">
									{cur?.id ||
										cur?.twilioPayload?.sid ||
										cur?.sendbluePayload?.message_handle ||
										"-"}
								</div>
								<div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
									<div>
										<div className="text-muted-foreground text-xs">
											Provider
										</div>
										<div className="font-medium">{String(provider)}</div>
									</div>
									<div>
										<div className="text-muted-foreground text-xs">Service</div>
										<div className="font-medium">{String(service)}</div>
									</div>
									<div>
										<div className="text-muted-foreground text-xs">Status</div>
										<div className="font-medium">{String(status)}</div>
									</div>
									<div>
										<div className="text-muted-foreground text-xs">Created</div>
										<div className="font-medium">
											{started
												? new Date(String(started)).toLocaleString()
												: "-"}
										</div>
									</div>
									<div>
										<div className="text-muted-foreground text-xs">Updated</div>
										<div className="font-medium">
											{updated
												? new Date(String(updated)).toLocaleString()
												: "-"}
										</div>
									</div>
									<div className="sm:col-span-2">
										<div className="text-muted-foreground text-xs">Body</div>
										<div className="whitespace-pre-wrap font-medium">
											{cur?.body ||
												cur?.sendbluePayload?.content ||
												cur?.twilioPayload?.body ||
												"-"}
										</div>
									</div>
								</div>
							</div>

							<div>
								<h4 className="font-medium text-sm">Transfers</h4>
								{entries.length || totalTransfers ? (
									<>
										{entries.length ? (
											<div className="mt-1 flex flex-wrap gap-2">
												{entries.map(([k, v]) => (
													<Badge key={k} variant="secondary">
														{k.replaceAll("_", " ")} · {v}
													</Badge>
												))}
											</div>
										) : null}
										<div className="mt-2 text-muted-foreground text-xs">
											Total transfers: {totalTransfers}
										</div>
									</>
								) : (
									<span className="text-muted-foreground text-sm">
										No transfers
									</span>
								)}
							</div>
						</div>

						<div className="rounded-md border p-3">
							<h3 className="mb-2 font-medium text-sm">Thread</h3>
							<div className="grid max-h-[320px] gap-2 overflow-auto pr-1">
								{msgs.length ? (
									msgs.map((m, idx) => {
										const when =
											m.dateAdded ||
											m?.sendbluePayload?.date_sent ||
											m?.twilioPayload?.dateSent;
										const who = m.direction === "outbound" ? "You" : "Lead";
										const prov =
											m.provider ||
											(m.twilioPayload
												? "twilio"
												: m.sendbluePayload
													? "sendblue"
													: "ghl");
										return (
											<div
												key={
													m.id ||
													m?.twilioPayload?.sid ||
													m?.sendbluePayload?.message_handle ||
													idx
												}
												className="rounded border p-2 text-sm"
											>
												<div className="flex items-center justify-between gap-2">
													<div className="font-medium">{who}</div>
													<div className="text-muted-foreground text-xs">
														{new Date(String(when)).toLocaleString()}
													</div>
												</div>
												<div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
													<Badge variant="outline">{String(prov)}</Badge>
													{m.service ? (
														<Badge variant="outline">{String(m.service)}</Badge>
													) : null}
													{m.appleDevice ? (
														<Badge variant="outline">Apple</Badge>
													) : null}
													{m.attachments?.length ? (
														<Badge variant="secondary">
															Attachments: {m.attachments.length}
														</Badge>
													) : null}
												</div>
												<div className="mt-2 whitespace-pre-wrap">
													{m.body ||
														m?.sendbluePayload?.content ||
														m?.twilioPayload?.body ||
														""}
												</div>
											</div>
										);
									})
								) : (
									<div className="text-muted-foreground">No messages</div>
								)}
							</div>
						</div>
					</div>
				);
			}}
		/>
	);
}
