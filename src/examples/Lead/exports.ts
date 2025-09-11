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
  const values = headers.map((h) => String((row as Record<string, unknown>)[h] ?? ""));
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
      ws.addRow(headers.map((h) => row[h] as unknown as string | number | Date));
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
  let WorkbookCtor: typeof import('exceljs').Workbook | undefined;
  try {
    WorkbookCtor = (await import("exceljs"))?.Workbook;
  } catch (err) {
    console.error("exceljs is required for Excel export.", err);
    return;
  }
  // todo: Add proper interface for Workbook when types are available
  const wb = new (WorkbookCtor as typeof import('exceljs').Workbook)();
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
  let WorkbookCtor: typeof import('exceljs').Workbook | undefined;
  try {
    WorkbookCtor = (await import("exceljs"))?.Workbook;
  } catch (err) {
    console.error("exceljs is required for Excel export.", err);
    return;
  }
  // todo: Add proper interface for Workbook when types are available
  const wb = new (WorkbookCtor as typeof import('exceljs').Workbook)();
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
