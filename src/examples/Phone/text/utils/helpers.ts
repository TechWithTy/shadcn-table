import type { Table } from "@tanstack/react-table";
import type { CallCampaign } from "../../../../../../../types/_dashboard/campaign";
import type { TextMessage } from "../../../../../../../types/goHighLevel/text";
import JSZip from "jszip";

export function getSelectedRowsFromTable(
	table: Table<CallCampaign>,
): CallCampaign[] {
	return table.getFilteredSelectedRowModel().rows.map((r) => r.original);
}

// Infer device type (Apple vs Other) from optional messages on the row
export function getDeviceHint(row: CallCampaign): string {
	const msgs = row.messages;
	if (!Array.isArray(msgs) || msgs.length === 0) return "-";
	const anyApple = msgs.some((m: TextMessage) => m?.service === "iMessage");
	return anyApple ? "Apple" : "Other";
}

export function getAllRowsFromTable(
	table: Table<CallCampaign>,
): CallCampaign[] {
	return table.getFilteredRowModel().rows.map((r) => r.original);
}

export function summarizeRows(rows: CallCampaign[]) {
	const count = rows.length;
	const totals = rows.reduce(
		(acc, r) => {
			acc.calls += r.calls ?? 0;
			acc.leads += r.leads ?? 0;
			acc.inQueue += r.inQueue ?? 0;
			return acc;
		},
		{ calls: 0, leads: 0, inQueue: 0 },
	);
	const avg = (n: number) => (count ? Math.round((n / count) * 100) / 100 : 0);
	return [
		`Rows: ${count}`,
		`Messages: ${totals.calls} (avg ${avg(totals.calls)})`,
		`Leads: ${totals.leads} (avg ${avg(totals.leads)})`,
		`Queued: ${totals.inQueue} (avg ${avg(totals.inQueue)})`,
	].join("\n");
}

// Text metrics helpers (tolerant to missing fields on demo data)
type MaybeTextStats = {
	textStats?: {
		sent?: number;
		delivered?: number;
		failed?: number;
		total?: number;
		lastMessageAt?: string;
	};
	lastMessageAt?: string;
};

export function getTextMetric(
	row: CallCampaign,
	key: "sent" | "delivered" | "failed" | "total",
): number {
	const r = row as unknown as MaybeTextStats;
	return Number(r.textStats?.[key] ?? 0) || 0;
}

export function getLastMessageAt(row: CallCampaign): string {
	const r = row as unknown as MaybeTextStats;
	const raw = r.textStats?.lastMessageAt ?? r.lastMessageAt;
	if (!raw) return "-";
	const d = new Date(raw);
	return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleString();
}

export function downloadJson(filename: string, data: unknown) {
	try {
		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	} catch {
		// noop
	}
}

export function downloadCampaignThreads(row: CallCampaign) {
	const payload = {
		id: row.id ?? row.name,
		name: row.name,
		status: row.status,
		createdAt: row.startDate,
		metrics: {
			sent: getTextMetric(row, "sent"),
			delivered: getTextMetric(row, "delivered"),
			failed: getTextMetric(row, "failed"),
			total: getTextMetric(row, "total"),
			lastMessageAt: getLastMessageAt(row),
		},
		// Prefer a nested messages/threads structure if present on demo data
		threads: row.threads ?? row.messages ?? [],
		children: row.children ?? [],
	};
	downloadJson(`${row.name}-messages.json`, payload);
}

function toCsvValue(v: unknown): string {
	if (v == null) return "";
	const s = String(v);
	// Escape quotes and wrap if needed
	const needsWrap = /[",\n]/.test(s);
	const escaped = s.replaceAll('"', '""');
	return needsWrap ? `"${escaped}"` : escaped;
}

function objectsToCsv(objs: Record<string, unknown>[]): string {
	const allKeys = Array.from(
		objs.reduce((set, o) => {
			for (const k of Object.keys(o ?? {})) {
				set.add(k);
			}
			return set;
		}, new Set<string>()),
	);
	const header = allKeys.map(toCsvValue).join(",");
	const rows = objs.map((o) =>
		allKeys.map((k) => toCsvValue(o[k as keyof typeof o])).join(","),
	);
	return [header, ...rows].join("\n");
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
	try {
		const csv = objectsToCsv(rows);
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	} catch {
		// noop
	}
}

export function downloadCampaignThreadsCsv(row: CallCampaign) {
	const base = {
		campaignId: row.id ?? row.name,
		campaignName: row.name,
		status: row.status,
		createdAt: row.startDate,
		sent: getTextMetric(row, "sent"),
		delivered: getTextMetric(row, "delivered"),
		failed: getTextMetric(row, "failed"),
		total: getTextMetric(row, "total"),
		lastMessageAt: getLastMessageAt(row),
	};

	const rThreads = row.threads;
	const rMessages = row.messages;
	const children = row.children ?? [];

	const rows: Record<string, unknown>[] = [];

	const pushArray = (arr: unknown[], extra: Record<string, unknown>) => {
		for (const item of arr) {
			if (item && typeof item === "object") {
				rows.push({ ...base, ...extra, ...(item as Record<string, unknown>) });
			} else {
				rows.push({ ...base, ...extra, value: item });
			}
		}
	};

	if (Array.isArray(rThreads) && rThreads.length) {
		pushArray(rThreads, { source: "thread" });
	} else if (Array.isArray(rMessages) && rMessages.length) {
		pushArray(rMessages, { source: "message" });
	}

	// Include children campaigns if they have threads/messages
	if (Array.isArray(children) && children.length) {
		for (const child of children) {
			const cname = child?.name ?? "child";
			const cthreads = child?.threads ?? child?.messages ?? [];
			if (Array.isArray(cthreads) && cthreads.length) {
				pushArray(cthreads, { source: "child", childCampaign: cname });
			}
		}
	}

	// If no detailed arrays, at least export a single summary row
	if (rows.length === 0) rows.push(base);

	downloadCsv(`${row.name}-messages.csv`, rows);
}

// Build multiple CSVs and package as a ZIP for download (summary, leads, messages, per-lead messages)
export async function downloadCampaignZip(row: CallCampaign) {
	const campaignId = row.id ?? row.name;
	const campaignName = row.name;

	const base = {
		campaignId,
		campaignName,
		status: row.status,
		createdAt: row.startDate,
		sent: getTextMetric(row, "sent"),
		delivered: getTextMetric(row, "delivered"),
		failed: getTextMetric(row, "failed"),
		total: getTextMetric(row, "total"),
		lastMessageAt: getLastMessageAt(row),
	} as Record<string, unknown>;

	const threadsAny = row.threads ?? row.messages ?? [];
	const children = row.children ?? [];

	const summaryRows: Record<string, unknown>[] = [base];
	const leadsRows: Record<string, unknown>[] = [];
	const messagesRows: Record<string, unknown>[] = [];

	// Helper to push per-lead CSV
	const perLeadFiles: Array<{
		filename: string;
		rows: Record<string, unknown>[];
	}> = [];

	const processThread = (
		thread: unknown,
		index: number,
		extra: Record<string, unknown> = {},
	) => {
		const leadId =
			(thread as { leadId?: string; contactId?: string; id?: string })
				?.leadId ??
			(thread as { leadId?: string; contactId?: string; id?: string })
				?.contactId ??
			(thread as { leadId?: string; contactId?: string; id?: string })?.id ??
			String(index);
		const threadId = (thread as { id?: string })?.id ?? String(index);
		const msgs: unknown[] = Array.isArray(
			(thread as { messages?: unknown[] })?.messages,
		)
			? (thread as { messages: unknown[] }).messages
			: Array.isArray(thread)
				? thread
				: [];

		// Lead row (one per thread)
		const leadRow = {
			...base,
			...extra,
			leadId,
			threadId,
			messageCount: Array.isArray(msgs) ? msgs.length : 0,
			...flattenIfObject(thread, ["messages"]),
		};
		leadsRows.push(leadRow);

		// Messages rows
		const perLead: Record<string, unknown>[] = [];
		if (Array.isArray(msgs)) {
			msgs.forEach((m, mi) => {
				const rowObj = {
					...base,
					...extra,
					leadId,
					threadId,
					messageIndex: mi,
					...(isPlainObject(m) ? m : { value: m }),
				};
				messagesRows.push(rowObj);
				perLead.push(rowObj);
			});
		} else if (
			isPlainObject(thread) &&
			!(thread as { messages?: unknown[] }).messages
		) {
			// If it's a simple object (non-nested), treat it as a single message row
			const rowObj = { ...base, ...extra, leadId, threadId, ...thread };
			messagesRows.push(rowObj);
			perLead.push(rowObj);
		}

		if (perLead.length) {
			const fname = `leads/${sanitizeFilename(String(leadId))}.csv`;
			perLeadFiles.push({ filename: fname, rows: perLead });
		}
	};

	if (Array.isArray(threadsAny) && threadsAny.length) {
		threadsAny.forEach((t, i) => processThread(t, i));
	}

	if (Array.isArray(children) && children.length) {
		for (const child of children) {
			const cname = child?.name ?? "child";
			const cthreads = child?.threads ?? child?.messages ?? [];
			if (Array.isArray(cthreads) && cthreads.length) {
				cthreads.forEach((t, i) =>
					processThread(t, i, { childCampaign: cname }),
				);
			}
		}
	}

	// Ensure there is at least a summary row
	if (messagesRows.length === 0 && leadsRows.length === 0) {
		// no details; keep only summary
	}

	// Prepare ZIP
	const zip = new JSZip();
	const rootFolder = zip.folder(sanitizeFilename(`${campaignName}`));
	const root = rootFolder ?? zip;
	root.file("summary.csv", objectsToCsv(summaryRows));
	root.file("leads.csv", objectsToCsv(leadsRows));
	root.file("messages.csv", objectsToCsv(messagesRows));
	for (const { filename, rows } of perLeadFiles) {
		// filename is already under leads/
		root.file(filename, objectsToCsv(rows));
	}

	const blob = await zip.generateAsync({ type: "blob" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${sanitizeFilename(campaignName)}-export.zip`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return !!v && typeof v === "object" && !Array.isArray(v);
}

function flattenIfObject(
	obj: unknown,
	omitKeys: string[] = [],
): Record<string, unknown> {
	if (!isPlainObject(obj)) return {};
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(obj)) {
		if (omitKeys.includes(k)) continue;
		out[k] = v as unknown;
	}
	return out;
}

function sanitizeFilename(name: string) {
	return name.replace(/[^a-zA-Z0-9_\-]/g, "_");
}
