"use client";

import * as React from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { DataTableRowModalCarousel } from "../../../components/data-table/data-table-row-modal-carousel";
import type { CallCampaign } from "../../../../../../types/_dashboard/campaign";
import type { Row, Table } from "@tanstack/react-table";

// Local, minimal types used by this Social example to avoid `any`.
type Reaction = { value: string };
type Attachment = { type: string };
type LinkedInMessage = {
	sender_id: string;
	text?: string;
	timestamp?: string;
	attachments?: Attachment[];
	reactions?: Reaction[];
};
type InteractionDetail = {
	id?: string | number;
	type?: string;
	user?: string;
	text?: string;
	createdAt?: string | number | Date;
	transfers?: number;
	assetFilename?: string;
	assetContent?: Blob | string;
	linkedinMessage?: LinkedInMessage;
};
type ManychatPage = { id: string | number; name: string };
type Tag = { name: string };
type Subscriber = {
	id: string;
	name: string;
	email?: string;
	phone?: string;
	tags?: Tag[];
	lastSeen?: string;
	lastInteraction?: string;
};
type GrowthTool = { id: string | number; name: string; type: string };
type Flow = { ns: string; name: string };

// Narrow Social row used in this component
type SocialRow = CallCampaign & {
	name: string;
	platform?: "facebook" | "linkedin" | string;
	interactionsDetails?: InteractionDetail[];
	manychatPage?: ManychatPage;
	subscribers?: Subscriber[];
	manychatGrowthTools?: GrowthTool[];
	manychatFlows?: Flow[];
	delivered?: number;
	failed?: number;
	sent?: number;
	queued?: number;
	calls?: number;
};

export function SocialRowCarousel({
	table,
	open,
	setOpen,
	index,
	setIndex,
	rows,
}: {
	table: Table<SocialRow>;
	open: boolean;
	setOpen: (v: boolean) => void;
	index: number;
	setIndex: (n: number) => void;
	rows: Row<SocialRow>[];
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
				const items = row?.original?.interactionsDetails ?? [];
				setDetailIndex((i) =>
					items.length ? (i - 1 + items.length) % items.length : 0,
				);
			}}
			onNext={() => {
				const row = rows[index];
				const items = row?.original?.interactionsDetails ?? [];
				setDetailIndex((i) => (items.length ? (i + 1) % items.length : 0));
			}}
			title={(row) => {
				const items = row.original?.interactionsDetails ?? [];
				const cur = items[detailIndex];
				return (
					<div className="flex items-center gap-2">
						<span>
							{cur ? `${row.original.name} — @${cur.user}` : row.original.name}
						</span>
						<Badge variant="secondary">Interactions: {items.length}</Badge>
					</div>
				);
			}}
			description={(row) => {
				const items = row.original?.interactionsDetails ?? [];
				const cur = items[detailIndex];
				const createdDisplay = cur?.createdAt
					? new Date(cur.createdAt).toLocaleString()
					: "-";
				return cur
					? `${cur.type} • ${createdDisplay}`
					: `Started: ${new Date(row.original.startDate).toLocaleDateString()}`;
			}}
			counter={(row) => {
				const items = row.original?.interactionsDetails ?? [];
				return items.length ? `${detailIndex + 1} / ${items.length}` : "-";
			}}
			actions={(row) => {
				async function downloadZip() {
					const zip = new JSZip();
					const items = row.original?.interactionsDetails ?? [];
					items.forEach((it: InteractionDetail, idx: number) => {
						if (it.assetFilename && it.assetContent) {
							zip.file(it.assetFilename, it.assetContent);
						} else {
							zip.file(
								`note_${idx + 1}.txt`,
								`${it.type} by @${it.user} — no asset`,
							);
						}
					});
					const blob = await zip.generateAsync({ type: "blob" });
					saveAs(blob, `${row.original.name.replace(/\s+/g, "_")}_assets.zip`);
				}
				return (
					<Button type="button" size="sm" onClick={downloadZip}>
						Download ZIP
					</Button>
				);
			}}
			render={(row) => {
				const r = row.original as SocialRow;
				const items = r?.interactionsDetails ?? [];
				const cur = items[detailIndex];
				return (
					<div className="grid gap-3 md:grid-cols-2">
						{cur ? (
							<div className="rounded-md border p-3">
								<div className="font-medium">Interaction</div>
								<div className="text-muted-foreground text-xs">{cur.id}</div>
								<div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
									<div>
										<div className="text-muted-foreground text-xs">Type</div>
										<div className="font-medium">{cur.type}</div>
									</div>
									<div>
										<div className="text-muted-foreground text-xs">User</div>
										<div className="font-medium">@{cur.user}</div>
									</div>
									<div className="sm:col-span-2">
										<div className="text-muted-foreground text-xs">Text</div>
										<div className="font-medium">{cur.text}</div>
									</div>
									<div>
										<div className="text-muted-foreground text-xs">Created</div>
										<div className="font-medium">
											{cur.createdAt ? new Date(cur.createdAt).toLocaleString() : "-"}
										</div>
									</div>
									{cur.assetFilename ? (
										<div>
											<div className="text-muted-foreground text-xs">Asset</div>
											<div className="font-medium">{cur.assetFilename}</div>
										</div>
									) : null}
									<div>
										<div className="text-muted-foreground text-xs">
											Transfers
										</div>
										<div className="font-medium">
											{typeof cur.transfers === "number" ? cur.transfers : 0}
										</div>
									</div>
								</div>
								{/* LinkedIn message details */}
								{r?.platform === "linkedin" && cur?.linkedinMessage ? (
									<div className="mt-3 grid gap-2">
										<div className="text-muted-foreground text-xs">
											LinkedIn Message
										</div>
										<div className="text-sm">
											<span className="text-muted-foreground">Sender:</span>{" "}
											{cur.linkedinMessage.sender_id}
										</div>
										{cur.linkedinMessage.text ? (
											<div className="text-sm">
												<span className="text-muted-foreground">Message:</span>{" "}
												{cur.linkedinMessage.text}
											</div>
										) : null}
										<div className="flex flex-wrap gap-2">
											<Badge
												variant="outline"
												title={cur.linkedinMessage.timestamp || ""}
											>
												Timestamp
											</Badge>
											{Array.isArray(cur.linkedinMessage.attachments) &&
											cur.linkedinMessage.attachments.length > 0 ? (
												<>
													{((): React.ReactElement[] => {
														const counts =
															cur.linkedinMessage.attachments.reduce(
																(
																	acc: Record<string, number>,
																	a: Attachment,
																) => {
																	acc[a.type] = (acc[a.type] || 0) + 1;
																	return acc;
																},
																{} as Record<string, number>,
															);
														return (
															Object.entries(counts) as Array<[string, number]>
														).map(
															([t, n]: [
																string,
																number,
															]): React.ReactElement => (
																<Badge
																	key={t}
																	variant="outline"
																	title={`${n} ${t} attachment(s)`}
																>
																	{t}: {n}
																</Badge>
															),
														);
													})()}
												</>
											) : (
												<Badge variant="outline">No attachments</Badge>
											)}
											{Array.isArray(cur.linkedinMessage.reactions) &&
											cur.linkedinMessage.reactions.length > 0 ? (
												<Badge
													variant="outline"
													title={cur.linkedinMessage.reactions
														.map((r: Reaction) => r.value)
														.join(", ")}
												>
													Reactions: {cur.linkedinMessage.reactions.length}
												</Badge>
											) : null}
										</div>
									</div>
								) : null}
							</div>
						) : null}

						{/* Thread of interactions (click to jump). This will later evolve into a timeline UI */}
						<div className="rounded-md border p-3">
							<div className="mb-2 font-medium">Thread</div>
							<div className="grid max-h-[340px] gap-2 overflow-auto pr-1">
								{items.length ? (
									items.map((it: InteractionDetail, idx: number) => {
										const isActive = idx === detailIndex;
										const ts = it?.createdAt
											? new Date(it.createdAt).toLocaleString()
											: "-";
										const summary = (it?.text as string) || "";
										return (
											<button
												key={it?.id || idx}
												type="button"
												onClick={() => setDetailIndex(idx)}
												className={`w-full cursor-pointer rounded border p-2 text-left text-sm transition-colors ${
													isActive ? "bg-muted" : "hover:bg-accent"
												}`}
												aria-current={isActive ? "true" : undefined}
											>
												<div className="flex items-center justify-between gap-2">
													<div className="flex items-center gap-2 font-medium">
														<span className="max-w-[140px] truncate">
															@{it?.user ?? "user"}
														</span>
														<Badge variant="outline">
															{String(it?.type ?? "note")}
														</Badge>
													</div>
													<div className="text-muted-foreground text-xs">
														{ts}
													</div>
												</div>
												<div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
													{typeof it?.transfers === "number" ? (
														<Badge variant="secondary">
															Transfers: {it.transfers}
														</Badge>
													) : null}
													{it?.assetFilename ? (
														<Badge variant="outline">Asset</Badge>
													) : null}
													{r?.platform === "linkedin" && it?.linkedinMessage ? (
														<Badge variant="outline">LinkedIn</Badge>
													) : null}
												</div>
												{summary ? (
													<div className="mt-2 line-clamp-2 whitespace-pre-wrap">
														{summary}
													</div>
												) : null}
											</button>
										);
									})
								) : (
									<div className="text-muted-foreground">No interactions</div>
								)}
							</div>
						</div>
						{/* Page & Subscribers (Facebook only) */}
						{r?.platform === "facebook" ? (
							<div className="grid gap-3 rounded-md border p-3">
								<div className="flex flex-wrap items-center gap-2">
									<div className="text-muted-foreground text-xs">Page</div>
									{r.manychatPage ? (
										<Badge variant="outline" title={String(r.manychatPage.id)}>
											{r.manychatPage.name}
										</Badge>
									) : (
										<span className="text-muted-foreground text-sm">
											No page info
										</span>
									)}
								</div>
								<div>
									<div className="text-muted-foreground text-xs">
										Subscribers
									</div>
									<div className="mt-2 flex flex-wrap gap-2">
										{Array.isArray(r.subscribers) &&
										r.subscribers.length > 0 ? (
											<>
												<Badge variant="secondary">
													{r.subscribers.length}
												</Badge>
												{r.subscribers.slice(0, 8).map((s: Subscriber) => {
													const parts: string[] = [
														`ID: ${s.id}`,
														s.email ? `Email: ${s.email}` : undefined,
														s.phone ? `Phone: ${s.phone}` : undefined,
														Array.isArray(s.tags) && s.tags.length
															? `Tags: ${s.tags.map((t: Tag) => t.name).join(", ")}`
															: undefined,
														s.lastSeen ? `Last seen: ${s.lastSeen}` : undefined,
														s.lastInteraction
															? `Last interaction: ${s.lastInteraction}`
															: undefined,
													].filter(Boolean) as string[];
													const title = parts.join("\n");
													return (
														<Badge
															key={s.id}
															variant="outline"
															title={title || s.id}
														>
															{s.name}
														</Badge>
													);
												})}
												{r.subscribers.length > 8 ? (
													<span className="text-muted-foreground text-xs">
														+{r.subscribers.length - 8} more
													</span>
												) : null}
											</>
										) : (
											<span className="text-muted-foreground text-sm">
												No subscribers
											</span>
										)}
									</div>
								</div>
							</div>
						) : null}
						{/* ManyChat Growth Tools & Workflows (Facebook only) */}
						{r?.platform === "facebook" ? (
							<div className="grid gap-4 rounded-md border p-3">
								<div>
									<div className="font-medium">Growth Tools</div>
									<div className="mt-2 flex flex-wrap gap-2">
										{Array.isArray(r.manychatGrowthTools) &&
										r.manychatGrowthTools.length > 0 ? (
											<>
												<Badge variant="secondary">
													{r.manychatGrowthTools.length}
												</Badge>
												{r.manychatGrowthTools
													.slice(0, 6)
													.map((gt: GrowthTool) => (
														<Badge
															key={gt.id}
															variant="outline"
															title={`${gt.name} (${gt.type})`}
														>
															{gt.name}
														</Badge>
													))}
												{r.manychatGrowthTools.length > 6 ? (
													<span className="text-muted-foreground text-xs">
														+{r.manychatGrowthTools.length - 6} more
													</span>
												) : null}
											</>
										) : (
											<span className="text-muted-foreground text-sm">
												No growth tools
											</span>
										)}
									</div>
								</div>
								<div>
									<div className="font-medium">Workflows</div>
									<div className="mt-2 flex flex-wrap gap-2">
										{Array.isArray(r.manychatFlows) &&
										r.manychatFlows.length > 0 ? (
											<>
												<Badge variant="secondary">
													{r.manychatFlows.length}
												</Badge>
												{r.manychatFlows.slice(0, 6).map((f: Flow) => (
													<Badge key={f.ns} variant="outline" title={f.ns}>
														{f.name}
													</Badge>
												))}
												{r.manychatFlows.length > 6 ? (
													<span className="text-muted-foreground text-xs">
														+{r.manychatFlows.length - 6} more
													</span>
												) : null}
											</>
										) : (
											<span className="text-muted-foreground text-sm">
												No workflows
											</span>
										)}
									</div>
								</div>
							</div>
						) : null}
						<div className="flex flex-wrap gap-2">
							{typeof r?.delivered === "number" ? (
								<Badge variant="outline">Delivered: {r.delivered}</Badge>
							) : null}
							{typeof r?.failed === "number" ? (
								<Badge variant="outline">Failed: {r.failed}</Badge>
							) : null}
							{typeof r?.sent === "number" ? (
								<Badge variant="outline">Sent: {r.sent}</Badge>
							) : null}
							{typeof r?.queued === "number" ? (
								<Badge variant="outline">Queued: {r.queued}</Badge>
							) : null}
							{typeof r?.calls === "number" ? (
								<Badge variant="outline">Total Items: {r.calls}</Badge>
							) : null}
							<Badge variant="outline">
								Transfers:{" "}
								{Array.isArray(r?.interactionsDetails)
									? (r.interactionsDetails as InteractionDetail[]).reduce(
											(a, it) => a + (Number(it?.transfers) || 0),
											0,
										)
									: 0}
							</Badge>
						</div>
					</div>
				);
			}}
		/>
	);
}
