import type { DemoLead, DemoRow } from "./types";

// CSV export for a single lead
export function exportLeadToCSV(lead: DemoLead) {
	const row = {
		id: lead.id,
		name: lead.name,
		address: lead.address,
		associatedAddress: lead.associatedAddress,
		addressVerified: lead.addressVerified,
		phone: lead.phone,
		email: lead.email,
		status: lead.status,
		isIPhone: lead.isIPhone,
		phoneVerified: lead.phoneVerified,
		emailVerified: lead.emailVerified,
		socialVerified: lead.socialVerified,
		possiblePhones: lead.possiblePhones.join(" | "),
		possibleEmails: lead.possibleEmails.join(" | "),
		possibleHandles: lead.possibleHandles
			.map((h) => `${h.platform}:${h.username}${h.url ? `(${h.url})` : ""}`)
			.join(" | "),
	} as const;
	const headers = Object.keys(row);
	const values = headers.map((h) =>
		String((row as Record<string, unknown>)[h] ?? ""),
	);
	const csv = [headers.join(","), values.join(",")].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const filename = `${lead.name.replace(/\s+/g, "_")}-${lead.id}.csv`;
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// ---------------- Nested lead exports (the actual leads in each list) -----------------

function collectLeadsByList(rows: DemoRow[]): Map<string, DemoLead[]> {
	const groups = new Map<string, DemoLead[]>();
	for (const r of rows) {
		const key = r.list || "Unknown List";
		const arr = groups.get(key) ?? [];
		const maybe = r as unknown as { leads?: DemoLead[] };
		const leads: DemoLead[] = Array.isArray(maybe.leads)
			? (maybe.leads as DemoLead[])
			: [];
		if (leads.length) arr.push(...leads);
		groups.set(key, arr);
	}
	return groups;
}

function leadToFlatRow(lead: DemoLead) {
	return {
		id: lead.id,
		name: lead.name,
		address: lead.address,
		associatedAddress: lead.associatedAddress,
		addressVerified: String(lead.addressVerified),
		phone: lead.phone,
		email: lead.email,
		status: lead.status,
		isIPhone: String(lead.isIPhone),
		phoneVerified: String(lead.phoneVerified),
		emailVerified: String(lead.emailVerified),
		socialVerified: String(lead.socialVerified),
		possiblePhones: (lead.possiblePhones ?? []).join(" | "),
		possibleEmails: (lead.possibleEmails ?? []).join(" | "),
		possibleHandles: (lead.possibleHandles ?? [])
			.map((h) => `${h.platform}:${h.username}${h.url ? `(${h.url})` : ""}`)
			.join(" | "),
	} as const;
}

const leadHeaderOrder = [
	"id",
	"name",
	"address",
	"associatedAddress",
	"addressVerified",
	"phone",
	"email",
	"status",
	"isIPhone",
	"phoneVerified",
	"emailVerified",
	"socialVerified",
	"possiblePhones",
	"possibleEmails",
	"possibleHandles",
] as const;

export async function exportNestedLeadsToExcelZipPerList(
	rows: DemoRow[],
	zipName = "nested-leads-per-list",
) {
	const groups = collectLeadsByList(rows);
	if (groups.size === 0) return;
	let ExcelModule: typeof import("exceljs");
	let JSZipClass: typeof import("jszip");
	try {
		ExcelModule = await import("exceljs");
		JSZipClass = (await import("jszip")).default;
	} catch (err) {
		console.error("exceljs and jszip are required for nested ZIP export.", err);
		return;
	}
	const zip = new JSZipClass();
	for (const [listName, leads] of groups.entries()) {
		const wb = new ExcelModule.Workbook();
		const ws = wb.addWorksheet("Leads");
		ws.addRow([...leadHeaderOrder]);
		for (const lead of leads) {
			const flat = leadToFlatRow(lead) as Record<string, unknown>;
			ws.addRow(leadHeaderOrder.map((h) => String(flat[h] ?? "")));
		}
		const buf = await wb.xlsx.writeBuffer();
		const safe = listName.replace(/[^a-z0-9\-_]+/gi, "_");
		zip.file(`${safe}.xlsx`, buf);
	}
	const zipBlob = await zip.generateAsync({ type: "blob" });
	const filename = `${zipName}-${new Date().toISOString().slice(0, 10)}.zip`;
	const url = URL.createObjectURL(zipBlob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export async function exportNestedLeadsToExcel(
	rows: DemoRow[],
	filenameBase = "nested-leads",
) {
	const groups = collectLeadsByList(rows);
	if (groups.size === 0) return;
	let ExcelModule: typeof import("exceljs");
	try {
		ExcelModule = await import("exceljs");
	} catch (err) {
		console.error("exceljs is required for nested excel export.", err);
		return;
	}
	const wb = new ExcelModule.Workbook();
	// Single sheet with all leads; include list name as column 0
	const ws = wb.addWorksheet("Leads");
	ws.addRow(["list", ...leadHeaderOrder]);
	for (const [listName, leads] of groups.entries()) {
		for (const lead of leads) {
			const flat = leadToFlatRow(lead) as Record<string, unknown>;
			ws.addRow([
				listName,
				...leadHeaderOrder.map((h) => String(flat[h] ?? "")),
			]);
		}
	}
	const buf = await wb.xlsx.writeBuffer();
	const blob = new Blob([buf], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
	const filename = `${filenameBase}-${new Date().toISOString().slice(0, 10)}.xlsx`;
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export async function exportNestedLeadsToCSVZipPerList(
	rows: DemoRow[],
	zipName = "nested-leads-per-list-csv",
) {
	const groups = collectLeadsByList(rows);
	if (groups.size === 0) return;
	let JSZipClass: typeof import("jszip");
	try {
		JSZipClass = (await import("jszip")).default;
	} catch (err) {
		console.error("jszip is required for nested CSV ZIP export.", err);
		return;
	}
	const zip = new JSZipClass();
	const headerLine = ["list", ...leadHeaderOrder].join(",");
	for (const [listName, leads] of groups.entries()) {
		const lines = leads.map((lead) => {
			const flat = leadToFlatRow(lead) as Record<string, unknown>;
			return [
				listName,
				...leadHeaderOrder.map((h) => String(flat[h] ?? "")),
			].join(",");
		});
		const csv = [headerLine, ...lines].join("\n");
		const safe = listName.replace(/[^a-z0-9\-_]+/gi, "_");
		zip.file(`${safe}.csv`, csv);
	}
	const zipBlob = await zip.generateAsync({ type: "blob" });
	const filename = `${zipName}-${new Date().toISOString().slice(0, 10)}.zip`;
	const url = URL.createObjectURL(zipBlob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export function exportNestedLeadsToCSV(
	rows: DemoRow[],
	filenameBase = "nested-leads",
) {
	const groups = collectLeadsByList(rows);
	if (groups.size === 0) return;
	const headerLine = ["list", ...leadHeaderOrder].join(",");
	const lines: string[] = [];
	for (const [listName, leads] of groups.entries()) {
		for (const lead of leads) {
			const flat = leadToFlatRow(lead) as Record<string, unknown>;
			lines.push(
				[listName, ...leadHeaderOrder.map((h) => String(flat[h] ?? ""))].join(
					",",
				),
			);
		}
	}
	const csv = [headerLine, ...lines].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const filename = `${filenameBase}-${new Date().toISOString().slice(0, 10)}.csv`;
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// CSV export for multiple rows -> single file
export function exportRowsToCSV(
	rows: DemoRow[],
	headers: Array<keyof DemoRow>,
	filenameBase = "lists",
) {
	if (rows.length === 0) return;
	const headerLine = headers.join(",");
	const lines = rows.map((r) =>
		headers.map((h) => String(r[h] ?? "")).join(","),
	);
	const csv = [headerLine, ...lines].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const filename = `${filenameBase}-${new Date().toISOString().slice(0, 10)}.csv`;
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// CSV export: group rows by list and download ZIP containing one CSV per list
export async function exportRowsToCSVZipPerList(
	rows: DemoRow[],
	headers: Array<keyof DemoRow>,
	zipName = "lists-csv-per-list",
) {
	if (rows.length === 0) return;
	let JSZipClass: typeof import("jszip");
	try {
		JSZipClass = (await import("jszip")).default;
	} catch (err) {
		console.error("jszip is required for CSV ZIP export.", err);
		return;
	}

	const groups = new Map<string, DemoRow[]>();
	for (const r of rows) {
		const key = r.list || "Unknown List";
		const arr = groups.get(key) ?? [];
		arr.push(r);
		groups.set(key, arr);
	}

	const zip = new JSZipClass();
	const headerLine = headers.join(",");
	for (const [listName, listRows] of groups.entries()) {
		const lines = listRows.map((r) =>
			headers.map((h) => String(r[h] ?? "")).join(","),
		);
		const csv = [headerLine, ...lines].join("\n");
		const safe = listName.replace(/[^a-z0-9\-_]+/gi, "_");
		zip.file(`${safe}.csv`, csv);
	}

	const zipBlob = await zip.generateAsync({ type: "blob" });
	const filename = `${zipName}-${new Date().toISOString().slice(0, 10)}.zip`;
	const url = URL.createObjectURL(zipBlob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// Excel export: group selected rows by list and download a ZIP containing one XLSX per list
export async function exportSelectedRowsPerListAsZip(
	rows: DemoRow[],
	headers: Array<keyof DemoRow>,
	zipName = "lists-selected-per-list",
) {
	if (rows.length === 0) return;
	// Dynamic imports to keep bundle slim
	let ExcelModule: typeof import("exceljs");
	let JSZipClass: typeof import("jszip");
	try {
		ExcelModule = await import("exceljs");
		JSZipClass = (await import("jszip")).default;
	} catch (err) {
		console.error("exceljs and jszip are required for ZIP export.", err);
		return;
	}

	// Group rows by list name
	const groups = new Map<string, DemoRow[]>();
	for (const r of rows) {
		const key = r.list || "Unknown List";
		const arr = groups.get(key) ?? [];
		arr.push(r);
		groups.set(key, arr);
	}

	const zip = new JSZipClass();
	for (const [listName, listRows] of groups.entries()) {
		const wb = new ExcelModule.Workbook();
		const ws = wb.addWorksheet("Leads");
		ws.addRow(headers.map((h) => String(h)));
		for (const row of listRows) {
			ws.addRow(
				headers.map((h) => row[h] as unknown as string | number | Date),
			);
		}
		const buf = await wb.xlsx.writeBuffer();
		const safe = listName.replace(/[^a-z0-9\-_]+/gi, "_");
		zip.file(`${safe}.xlsx`, buf);
	}

	const zipBlob = await zip.generateAsync({ type: "blob" });
	const filename = `${zipName}-${new Date().toISOString().slice(0, 10)}.zip`;
	const url = URL.createObjectURL(zipBlob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// Excel export for multiple rows (selected)
export async function exportRowsToExcel(
	rows: DemoRow[],
	headers: Array<keyof DemoRow>,
	filenameBase = "lists-selected",
) {
	let ExcelModule: typeof import("exceljs");
	try {
		ExcelModule = await import("exceljs");
	} catch (err) {
		console.error("exceljs is required for Excel export.", err);
		return;
	}
	const wb = new ExcelModule.Workbook();
	const ws = wb.addWorksheet("Leads");
	ws.addRow(headers.map((h) => String(h)));
	for (const row of rows) {
		ws.addRow(headers.map((h) => row[h] as unknown as string | number | Date));
	}
	const buf = await wb.xlsx.writeBuffer();
	const blob = new Blob([buf], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
	const filename = `${filenameBase}-${new Date().toISOString().slice(0, 10)}.xlsx`;
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// Excel export for a single lead (dynamic import exceljs)
export async function exportLeadToExcel(lead: DemoLead) {
	let WorkbookCtor: typeof import("exceljs").Workbook | undefined;
	try {
		WorkbookCtor = (await import("exceljs"))?.Workbook;
	} catch (err) {
		console.error("exceljs is required for Excel export.", err);
		return;
	}
	// todo: Add proper interface for Workbook when types are available
	const wb = new (WorkbookCtor as typeof import("exceljs").Workbook)();
	const ws = wb.addWorksheet("Lead");
	const headers = [
		"id",
		"name",
		"address",
		"associatedAddress",
		"addressVerified",
		"phone",
		"email",
		"status",
		"isIPhone",
		"phoneVerified",
		"emailVerified",
		"socialVerified",
		"possiblePhones",
		"possibleEmails",
		"possibleHandles",
	];
	ws.addRow(headers);
	ws.addRow([
		lead.id,
		lead.name,
		lead.address,
		lead.associatedAddress,
		String(lead.addressVerified),
		lead.phone,
		lead.email,
		lead.status,
		String(lead.isIPhone),
		String(lead.phoneVerified),
		String(lead.emailVerified),
		String(lead.socialVerified),
		lead.possiblePhones.join(" | "),
		lead.possibleEmails.join(" | "),
		lead.possibleHandles
			.map((h) => `${h.platform}:${h.username}${h.url ? `(${h.url})` : ""}`)
			.join(" | "),
	]);
	const buf = await wb.xlsx.writeBuffer();
	const blob = new Blob([buf], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
	const filename = `${lead.name.replace(/\s+/g, "_")}-${lead.id}.xlsx`;
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// Row-level CSV
export function exportRowToCSV(row: DemoRow, headers: Array<keyof DemoRow>) {
	const values = headers.map((h) => String(row[h] ?? ""));
	const csv = [headers.join(","), values.join(",")].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const filename = `${row.list.replace(/\s+/g, "_")}-${new Date(row.uploadDate)
		.toISOString()
		.slice(0, 10)}.csv`;
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// Row-level Excel
export async function exportSingleRowToExcel(
	row: DemoRow,
	headers: Array<keyof DemoRow>,
) {
	let WorkbookCtor: typeof import("exceljs").Workbook | undefined;
	try {
		WorkbookCtor = (await import("exceljs"))?.Workbook;
	} catch (err) {
		console.error("exceljs is required for Excel export.", err);
		return;
	}
	// todo: Add proper interface for Workbook when types are available
	const wb = new (WorkbookCtor as typeof import("exceljs").Workbook)();
	const ws = wb.addWorksheet("Leads");
	ws.addRow(headers.map((h) => String(h)));
	ws.addRow(headers.map((h) => row[h] as unknown as string | number | Date));

	const buf = await wb.xlsx.writeBuffer();
	const blob = new Blob([buf], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
	const filename = `${row.list.replace(/\s+/g, "_")}-${new Date(row.uploadDate)
		.toISOString()
		.slice(0, 10)}.xlsx`;
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
