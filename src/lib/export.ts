import type { Table } from "@tanstack/react-table";

type ExportMode = "all" | "page" | "selected";

function getVisibleHeaderIds<TData>(
  table: Table<TData>,
  excludeColumns: (keyof TData | "select" | "actions")[],
) {
  return table
    .getVisibleLeafColumns()
    .map((c) => c.id)
    .filter((id) => !excludeColumns.includes(id as keyof TData));
}

function getRowsByMode<TData>(table: Table<TData>, mode: ExportMode) {
  switch (mode) {
    case "selected":
      return table.getFilteredSelectedRowModel().rows;
    case "page":
      return table.getPaginationRowModel().rows;
    case "all":
    default:
      return table.getPrePaginationRowModel().rows;
  }
}

function toCsvLine(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv<TData>(headers: string[], rows: Array<ReturnType<Table<TData>["getRowModel"]>["rows"][number]>) {
  const lines: string[] = [];
  lines.push(headers.join(","));
  for (const row of rows) {
    const cols = headers.map((h) => toCsvLine(row.getValue(h)));
    lines.push(cols.join(","));
  }
  return lines.join("\n");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Backward-compatible CSV export. Uses visible columns and supports modes.
export function exportTableToCSV<TData>(
  table: Table<TData>,
  opts: {
    filename?: string;
    excludeColumns?: (keyof TData | "select" | "actions")[];
    onlySelected?: boolean; // kept for backward-compat; if true, mode becomes "selected"
    mode?: ExportMode; // "all" | "page" | "selected"
  } = {},
): void {
  const {
    filename = "table",
    excludeColumns = [],
    onlySelected = false,
    mode = onlySelected ? "selected" : "page",
  } = opts;

  const headers = getVisibleHeaderIds(table, excludeColumns);
  const rows = getRowsByMode(table, mode);
  const csvContent = buildCsv(headers, rows as any);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

// Export a ZIP archive of CSV files, chunking rows for large datasets.
// Requires `jszip` to be installed by the host app.
export async function exportTableToZipCSV<TData>(
  table: Table<TData>,
  opts: {
    filename?: string; // without extension
    excludeColumns?: (keyof TData | "select" | "actions")[];
    mode?: ExportMode;
    chunkSize?: number; // split into multiple CSV files of this many rows
    filePrefix?: string; // prefix for CSV files inside the zip
  } = {},
): Promise<void> {
  const {
    filename = "table_export",
    excludeColumns = [],
    mode = "all",
    chunkSize = 5000,
    filePrefix = "part",
  } = opts;

  let JSZip: any;
  try {
    JSZip = (await import("jszip")).default;
  } catch (err) {
    console.error(
      "exportTableToZipCSV requires 'jszip' to be installed. Please add it to your dependencies.",
      err,
    );
    throw err;
  }

  const headers = getVisibleHeaderIds(table, excludeColumns);
  const rows = getRowsByMode(table, mode);

  const zip = new JSZip();
  let fileIndex = 1;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize) as any;
    const csv = buildCsv(headers, chunk);
    zip.file(`${filePrefix}_${fileIndex}.csv`, csv);
    fileIndex++;
  }

  const content: Uint8Array = await zip.generateAsync({ type: "uint8array" });
  const blob = new Blob([content], { type: "application/zip" });
  downloadBlob(blob, `${filename}.zip`);
}
