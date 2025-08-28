"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";

import { DataTable } from "../components/data-table/data-table";
import { DataTableToolbar } from "../components/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "../components/data-table/data-table-column-header";
import { DataTableRowModalCarousel } from "../components/data-table/data-table-row-modal-carousel";
import { DataTableExportButton } from "../components/data-table/data-table-export-button";
import { useRowCarousel } from "../hooks/use-row-carousel";
import { useDataTable } from "../hooks/use-data-table";
import { Checkbox } from "../components/ui/checkbox";
import { Button } from "../components/ui/button";

// Demo data type
export type DemoRow = {
  id: string;
  list: string;
  uploadDate: string; // ISO string for demo simplicity
  records: number;
  phone: number;
  emails: number;
  socials: number;
};

// Excel export for single row (dynamic import exceljs)
async function exportSingleRowToExcel(row: DemoRow, headers: Array<keyof DemoRow>) {
  let WorkbookCtor: any;
  try {
    WorkbookCtor = (await import("exceljs")).Workbook;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("exceljs is required for Excel export.", err);
    return;
  }

  const wb = new WorkbookCtor();
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

// CSV export for single row
function exportRowToCSV(row: DemoRow, headers: Array<keyof DemoRow>) {
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

// Columns
const columns: ColumnDef<DemoRow>[] = [
  // Selection column (left side)
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center gap-2 pl-2">
        <div className="grid h-5 w-5 place-items-center">
          <Checkbox
            onClick={(e) => e.stopPropagation()}
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="h-4 w-4 leading-none grid place-items-center"
          />
        </div>
        <span className="text-xs text-muted-foreground select-none">Select</span>
      </div>
    ),
    cell: ({ row }) => (
      <div className="grid h-10 place-items-center">
        <Checkbox
          onClick={(e) => e.stopPropagation()}
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="h-4 w-4 leading-none grid place-items-center"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 48,
  },
  {
    accessorKey: "list",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="List" />
    ),
    enableColumnFilter: true,
    meta: { label: "List", variant: "text", placeholder: "Search list" },
  },
  {
    accessorKey: "uploadDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Upload Date" />
    ),
    cell: ({ getValue }) => {
      const d = new Date(String(getValue()));
      return (
        <span className="tabular-nums">
          {isNaN(d.getTime()) ? "-" : d.toLocaleDateString()}
        </span>
      );
    },
    enableColumnFilter: true,
    meta: { label: "Upload Date", variant: "date" },
  },
  {
    accessorKey: "records",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Records" />
    ),
    sortingFn: "alphanumeric",
    cell: ({ getValue }) => (
      <span className="tabular-nums">{String(getValue())}</span>
    ),
    enableColumnFilter: true,
    meta: { label: "Records", variant: "range" },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    cell: ({ getValue }) => (
      <span className="tabular-nums">{String(getValue())}</span>
    ),
    enableColumnFilter: true,
    meta: { label: "Phone", variant: "range" },
  },
  {
    accessorKey: "emails",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Emails" />
    ),
    cell: ({ getValue }) => (
      <span className="tabular-nums">{String(getValue())}</span>
    ),
    enableColumnFilter: true,
    meta: { label: "Emails", variant: "range" },
  },
  {
    accessorKey: "socials",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Socials" />
    ),
    cell: ({ getValue }) => (
      <span className="tabular-nums">{String(getValue())}</span>
    ),
    enableColumnFilter: true,
    meta: { label: "Socials", variant: "range" },
  },
  // Per-row Export column
  {
    id: "actions",
    header: () => <span className="whitespace-nowrap">Export to Excel</span>,
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Export row to Excel"
        type="button"
        onClick={async (e) => {
          e.stopPropagation();
          const headers: Array<keyof DemoRow> = [
            "list",
            "uploadDate",
            "records",
            "phone",
            "emails",
            "socials",
          ];
          await exportSingleRowToExcel(row.original, headers);
        }}
      >
        <Download className="h-4 w-4" />
      </Button>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 80,
  },
];

function makeDemoData(count = 123): DemoRow[] {
  const lists = [
    "Austin Leads",
    "Dallas Buyers",
    "Houston Sellers",
    "Email Outreach",
    "Phone Sweep",
  ];
  const rows: DemoRow[] = [];
  for (let i = 0; i < count; i++) {
    const list = lists[i % lists.length];
    rows.push({
      id: `${i + 1}`,
      list,
      uploadDate: new Date(Date.now() - i * 86_400_000).toISOString(),
      records: Math.floor(Math.random() * 5000) + 100,
      phone: Math.floor(Math.random() * 2000),
      emails: Math.floor(Math.random() * 1500),
      socials: Math.floor(Math.random() * 800),
    });
  }
  return rows;
}

export default function LeadsDemoTable() {
  const [data, setData] = React.useState<DemoRow[]>([]);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    // Generate data on the client to avoid SSR/CSR mismatch
    setData(makeDemoData(200));
  }, []);

  // Lightweight client-side search filtering for demo
  const filtered = React.useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((r) =>
      [r.list, r.records, r.phone, r.emails, r.socials]
        .map((v) => String(v).toLowerCase())
        .some((s) => s.includes(q)),
    );
  }, [data, query]);

  const pageSize = 8;
  const { table } = useDataTable<DemoRow>({
    data: filtered,
    columns,
    pageCount: Math.max(1, Math.ceil(filtered.length / pageSize)),
    initialState: {
      pagination: { pageIndex: 0, pageSize },
      columnPinning: { left: ["select"], right: ["actions"] },
      columnOrder: [
        "select",
        "list",
        "uploadDate",
        "records",
        "phone",
        "emails",
        "socials",
        "actions",
      ],
    },
    enableColumnPinning: true,
  });

  const carousel = useRowCarousel(table, { loop: true });

  return (
    <main className="container mx-auto max-w-7xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">External Table Demo</h1>
        <p className="text-sm text-muted-foreground">
          Sorting, global search, and pagination using TanStack Table.
        </p>
      </header>

      <DataTable<DemoRow>
        table={table}
        className="mt-2"
        onRowClick={(row) => carousel.openAt(row)}
        actionBar={
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {table.getFilteredSelectedRowModel().rows.length} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => table.resetRowSelection()}
            >
              Clear
            </Button>
            <DataTableExportButton
              table={table}
              filename="lists"
              excludeColumns={["select", "actions"]}
            />
          </div>
        }
      >
        <DataTableToolbar table={table} className="mb-3 md:mb-4">
          <input
            aria-label="Global search"
            placeholder="Search all visible fields..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-64 rounded-md border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          />
          <DataTableExportButton
            table={table}
            filename="lists"
            excludeColumns={["select"]}
          />
        </DataTableToolbar>
      </DataTable>

      <DataTableRowModalCarousel
        table={table}
        open={carousel.open}
        onOpenChange={carousel.setOpen}
        index={carousel.index}
        setIndex={carousel.setIndex}
        rows={carousel.rows}
        onPrev={carousel.prev}
        onNext={carousel.next}
        title={(row) => row.original.list}
        description={(row) =>
          `Uploaded: ${new Date(row.original.uploadDate).toLocaleDateString()}`
        }
        render={(row) => (
          <div className="grid gap-2">
            <div className="text-sm">
              <strong>Records:</strong> {row.original.records}
            </div>
            <div className="text-sm">
              <strong>Phone:</strong> {row.original.phone}
            </div>
            <div className="text-sm">
              <strong>Emails:</strong> {row.original.emails}
            </div>
            <div className="text-sm">
              <strong>Socials:</strong> {row.original.socials}
            </div>
          </div>
        )}
        actions={(row) => (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                const headers: Array<keyof DemoRow> = [
                  "list",
                  "uploadDate",
                  "records",
                  "phone",
                  "emails",
                  "socials",
                ];
                exportRowToCSV(row.original, headers);
              }}
            >
              CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async (e) => {
                e.stopPropagation();
                const headers: Array<keyof DemoRow> = [
                  "list",
                  "uploadDate",
                  "records",
                  "phone",
                  "emails",
                  "socials",
                ];
                await exportSingleRowToExcel(row.original, headers);
              }}
            >
              Excel
            </Button>
          </div>
        )}
      />
    </main>
  );
}
