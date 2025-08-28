"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { BarChart3, FileText, MessageSquare, Sparkles, Wand2, Download } from "lucide-react";

import { DataTable } from "../components/data-table/data-table";
import { DataTableToolbar } from "../components/data-table/data-table-toolbar";
import { DataTableColumnHeader } from "../components/data-table/data-table-column-header";
import { DataTableRowModalCarousel } from "../components/data-table/data-table-row-modal-carousel";
import { DataTableExportButton } from "../components/data-table/data-table-export-button";
import { useRowCarousel } from "../hooks/use-row-carousel";
import { useDataTable } from "../hooks/use-data-table";
import { Checkbox } from "../components/ui/checkbox";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";

// Demo data type
type SocialLink = { label: string; url: string };
type SocialHandle = { platform: string; username: string; url?: string };
type ActivityEvent = {
  ts: string; // ISO timestamp
  kind: "call" | "email" | "social" | "note";
  summary: string;
};

// Per-lead CSV export (includes dossier fields)
function exportLeadToCSV(lead: DemoLead) {
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
  const values = headers.map((h) => String((row as any)[h] ?? ""));
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

function formatLeadDossierSummary(lead: DemoLead): string {
  const phones = lead.possiblePhones.length;
  const emails = lead.possibleEmails.length;
  const platforms = Array.from(new Set(lead.possibleHandles.map((h) => h.platform)));
  const topHandles = lead.possibleHandles.slice(0, 3).map((h) => `${h.platform}:${h.username}`);
  const parts: string[] = [];
  parts.push(`Phones: ${phones}`);
  parts.push(`Emails: ${emails}`);
  if (platforms.length) parts.push(`Platforms: ${platforms.join(", ")}`);
  if (topHandles.length) parts.push(`Top: ${topHandles.join(", ")}${lead.possibleHandles.length > 3 ? "…" : ""}`);
  return parts.join(" \u2022 ");
}

function formatLeadDossier(lead: DemoLead): string {
  const phones = lead.possiblePhones.length ? `Phones: ${lead.possiblePhones.join(", ")}` : "Phones: -";
  const emails = lead.possibleEmails.length ? `Emails: ${lead.possibleEmails.join(", ")}` : "Emails: -";
  const handles = lead.possibleHandles.length
    ? `Usernames: ${lead.possibleHandles
        .map((h) => `${h.platform}:${h.username}${h.url ? `(${h.url})` : ""}`)
        .join(", ")}`
    : "Usernames: -";
  return [
    `Lead: ${lead.name}`,
    `Address: ${lead.address}`,
    `Associated Address: ${lead.associatedAddress}`,
    `Address Verified: ${lead.addressVerified ? "Yes" : "No"}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email}`,
    `Is iPhone: ${lead.isIPhone ? "Yes" : "No"}`,
    `Verified — Phone: ${lead.phoneVerified ? "Yes" : "No"}, Email: ${lead.emailVerified ? "Yes" : "No"}, Social: ${lead.socialVerified ? "Yes" : "No"}`,
    phones,
    emails,
    handles,
  ].join("\n");
}

// Per-lead Excel export (dynamic import exceljs)
async function exportLeadToExcel(lead: DemoLead) {
  let WorkbookCtor: any;
  try {
    WorkbookCtor = (await import("exceljs")).Workbook;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("exceljs is required for Excel export.", err);
    return;
  }
  const wb = new WorkbookCtor();
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

export type DemoLead = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  socials: SocialLink[];
  status: "New Lead" | "Contacted" | "Qualified" | "Do Not Contact";
  possiblePhones: string[];
  possibleEmails: string[];
  possibleHandles: SocialHandle[];
  activity: ActivityEvent[];
  // Added verification/metadata
  isIPhone: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  socialVerified: boolean;
  associatedAddress: string;
  addressVerified: boolean;
};

export type DemoRow = {
  id: string;
  list: string;
  uploadDate: string; // ISO string for demo simplicity
  records: number;
  phone: number;
  emails: number;
  socials: number;
  leads: DemoLead[];
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
      <DataTableColumnHeader column={column} title="Direct Mail" />
    ),
    cell: ({ getValue }) => (
      <span className="tabular-nums">{String(getValue())}</span>
    ),
    enableColumnFilter: true,
    meta: { label: "Direct Mail", variant: "range" },
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

function randPhone() {
  const a = Math.floor(100 + Math.random() * 900);
  const b = Math.floor(100 + Math.random() * 900);
  const c = Math.floor(1000 + Math.random() * 9000);
  return `${a}-${b}-${c}`;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function makeLeads(n: number, listName: string): DemoLead[] {
  const first = ["Ruth", "Hollie", "Jennie", "Marcus", "Angela", "Tom", "Sara", "Peter"];
  const last = ["Paucek", "Schaden", "Kunde", "Smith", "Johnson", "Lee", "Brown", "Nguyen"];
  const streets = ["Bath Road", "Constance Spring", "Allen Valley", "King St", "2nd Ave"];
  return Array.from({ length: n }).map((_, i) => {
    const name = `${pick(first)} ${pick(last)}`;
    const address = `${Math.floor(10 + Math.random() * 9900)} ${pick(streets)}`;
    const email = `${name.replace(/\s+/g, "_")}${i}@example.com`;
    const socials: SocialLink[] = [
      { label: "Facebook", url: `https://facebook.com/${name.replace(/\s+/g, "")}` },
      { label: "LinkedIn", url: `https://linkedin.com/in/${name.replace(/\s+/g, "").toLowerCase()}` },
      { label: "Instagram", url: `https://instagram.com/${name.split(" ")[0].toLowerCase()}` },
    ];
    const statuses: DemoLead["status"][] = ["New Lead", "Contacted", "Qualified", "Do Not Contact"];
    // mock dossier
    const possiblePhones = Array.from({ length: Math.floor(Math.random() * 3) }, () => randPhone());
    const possibleEmails = Array.from({ length: Math.floor(Math.random() * 2) }, (_, k) => `${name.replace(/\s+/g, ".").toLowerCase()}${k}@altmail.com`);
    const baseHandle = name.replace(/\s+/g, "").toLowerCase();
    const possibleHandles: SocialHandle[] = [
      { platform: "Facebook", username: baseHandle, url: `https://facebook.com/${baseHandle}` },
      { platform: "LinkedIn", username: `${baseHandle}`, url: `https://linkedin.com/in/${baseHandle}` },
      { platform: "Instagram", username: name.split(" ")[0].toLowerCase(), url: `https://instagram.com/${name.split(" ")[0].toLowerCase()}` },
      { platform: "Twitter", username: `${baseHandle.slice(0, 12)}`, url: `https://x.com/${baseHandle.slice(0, 12)}` },
    ];
    // mock activity events over last ~90 days
    const kinds: ActivityEvent["kind"][] = ["call", "email", "social", "note"];
    const evCount = Math.floor(Math.random() * 7) + 5; // 5-11 events
    const now = Date.now();
    const activity: ActivityEvent[] = Array.from({ length: evCount }, () => {
      const daysAgo = Math.floor(Math.random() * 90);
      const ts = new Date(now - daysAgo * 86_400_000).toISOString();
      const kind = pick(kinds);
      const summaryBase = {
        call: "Phone call",
        email: "Email",
        social: "Social touch",
        note: "Note",
      }[kind];
      return { ts, kind, summary: `${summaryBase} with ${name.split(" ")[0]}` };
    }).sort((a, b) => a.ts.localeCompare(b.ts));

    return {
      id: `${listName}-${i + 1}`,
      name,
      address,
      phone: randPhone(),
      email,
      socials,
      status: pick(statuses),
      possiblePhones,
      possibleEmails,
      possibleHandles,
      activity,
      // new fields
      isIPhone: Math.random() < 0.5,
      phoneVerified: Math.random() < 0.6,
      emailVerified: Math.random() < 0.7,
      socialVerified: Math.random() < 0.5,
      associatedAddress: `${address} Apt ${Math.floor(1 + Math.random() * 20)}`,
      addressVerified: Math.random() < 0.65,
    } satisfies DemoLead;
  });
}

const DEMO_LISTS = [
  "Austin Leads",
  "Dallas Buyers",
  "Houston Sellers",
  "Direct Mail Outreach",
  "Phone Sweep",
] as const;

function makeDemoRow(i: number): DemoRow {
  const list = DEMO_LISTS[i % DEMO_LISTS.length] as string;
  return {
    id: `${i + 1}`,
    list,
    uploadDate: new Date(Date.now() - i * 86_400_000).toISOString(),
    records: Math.floor(Math.random() * 5000) + 100,
    phone: Math.floor(Math.random() * 2000),
    emails: Math.floor(Math.random() * 1500),
    socials: Math.floor(Math.random() * 800),
    leads: makeLeads(3, list),
  } satisfies DemoRow;
}

function makeDemoData(count = 123): DemoRow[] {
  return Array.from({ length: count }, (_, i) => makeDemoRow(i));
}

export default function LeadsDemoTable() {
  const [data, setData] = React.useState<DemoRow[]>([]);
  const [query, setQuery] = React.useState("");
  const [aiOpen, setAiOpen] = React.useState(false);
  const [aiOutput, setAiOutput] = React.useState<string>("");
  const [aiRows, setAiRows] = React.useState<DemoRow[]>([]);
  const [leadIndex, setLeadIndex] = React.useState(0);
  const [showAllLeads, setShowAllLeads] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  // Infinite scroll config
  const BATCH_SIZE = 100;
  const MAX_ROWS = 2000;

  React.useEffect(() => {
    // Initial batch only on client to avoid SSR/CSR mismatch
    setData(Array.from({ length: BATCH_SIZE }, (_, k) => makeDemoRow(k)));
    setHasMore(BATCH_SIZE < MAX_ROWS);
  }, []);

  // IntersectionObserver to append more rows when sentinel enters viewport
  React.useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting || loading) return;
      if (!hasMore) return;
      setLoading(true);
      // Simulate async fetch; in real app replace with API call
      queueMicrotask(() => {
        setData((prev) => {
          const start = prev.length;
          const nextEnd = Math.min(start + BATCH_SIZE, MAX_ROWS);
          const count = Math.max(nextEnd - start, 0);
          const more = Array.from({ length: count }, (_, k) => makeDemoRow(start + k));
          const next = more.length ? [...prev, ...more] : prev;
          setHasMore(nextEnd < MAX_ROWS);
          setLoading(false);
          return next;
        });
      });
    }, { root: null, rootMargin: "600px 0px", threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [loading, hasMore, BATCH_SIZE, MAX_ROWS, data.length]);

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

  // Reset nested lead index whenever a new row is opened/changed
  React.useEffect(() => {
    if (carousel.open) setLeadIndex(0);
  }, [carousel.open, carousel.index]);

  function getSelectedRows(): DemoRow[] {
    return table.getFilteredSelectedRowModel().rows.map((r) => r.original as DemoRow);
  }

  function getAllRows(): DemoRow[] {
    return table.getFilteredRowModel().rows.map((r) => r.original as DemoRow);
  }

  function summarizeRows(rows: DemoRow[]) {
    const count = rows.length;
    const totals = rows.reduce(
      (acc, r) => {
        acc.records += r.records;
        acc.phone += r.phone;
        acc.emails += r.emails;
        acc.socials += r.socials;
        return acc;
      },
      { records: 0, phone: 0, emails: 0, socials: 0 },
    );
    const avg = (n: number) => (count ? Math.round((n / count) * 100) / 100 : 0);
    return [
      `Rows: ${count}`,
      `Records: ${totals.records} (avg ${avg(totals.records)})`,
      `Phone: ${totals.phone} (avg ${avg(totals.phone)})`,
      `Direct Mail: ${totals.emails} (avg ${avg(totals.emails)})`,
      `Socials: ${totals.socials} (avg ${avg(totals.socials)})`,
    ].join("\n");
  }

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
        onRowClick={(row) => {
          setLeadIndex(0);
          carousel.openAt(row);
        }}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="sm" className="bg-purple-600 text-white hover:bg-purple-700">
                  <Wand2 className="mr-1 h-4 w-4" /> AI
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Run AI on</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={table.getFilteredSelectedRowModel().rows.length === 0}
                  onSelect={() => {
                    const rows = getSelectedRows();
                    if (rows.length === 0) return;
                    setAiRows(rows);
                    setAiOpen(true);
                  }}
                >
                  Use Selected ({table.getFilteredSelectedRowModel().rows.length})
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    const rows = getAllRows();
                    setAiRows(rows);
                    setAiOpen(true);
                  }}
                >
                  Use All ({table.getFilteredRowModel().rows.length})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="sm" className="bg-purple-600 text-white hover:bg-purple-700">
                <Wand2 className="mr-1 h-4 w-4" /> AI
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Run AI on</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={table.getFilteredSelectedRowModel().rows.length === 0}
                onSelect={() => {
                  const rows = getSelectedRows();
                  if (rows.length === 0) return;
                  setAiRows(rows);
                  setAiOpen(true);
                }}
              >
                Use Selected ({table.getFilteredSelectedRowModel().rows.length})
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  const rows = getAllRows();
                  setAiRows(rows);
                  setAiOpen(true);
                }}
              >
                Use All ({table.getFilteredRowModel().rows.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DataTableExportButton
            table={table}
            filename="lists"
            excludeColumns={["select"]}
          />
        </DataTableToolbar>
      </DataTable>

      {/* AI Actions Modal */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-[900px] w-[min(90vw,900px)] max-h-[80vh] overflow-y-auto overflow-x-visible pb-8">
          <DialogHeader>
            <DialogTitle>AI Actions — {aiRows.length} list(s)</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mb-2">Data source: {aiRows.length === getAllRows().length ? "All" : "Selected"}</div>

          <div className="flex flex-nowrap gap-3 overflow-x-auto overflow-y-visible pb-2 pr-1 snap-x snap-mandatory">
            {/* Summarize */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setAiOutput(summarizeRows(aiRows))}
                  className="min-w-[200px] rounded-md border bg-card p-4 text-left shadow-xs hover:bg-accent focus:outline-none snap-start"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <div className="font-medium">Summarize</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Stats for the chosen rows</div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={10} className="z-[60] mb-1">See totals and averages</TooltipContent>
            </Tooltip>

            {/* Score Quality */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    const rows = aiRows;
                    // Placeholder scoring
                    const score = Math.min(100, 50 + Math.round((rows.length % 50) * 1.2));
                    setAiOutput(`Quality score (mock): ${score}/100 for ${rows.length} row(s).`);
                  }}
                  className="min-w-[200px] rounded-md border bg-card p-4 text-left shadow-xs hover:bg-accent focus:outline-none snap-start"
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    <div className="font-medium">Quality Score</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Estimate list quality</div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={10} className="z-[60] mb-1">Mock quality estimation</TooltipContent>
            </Tooltip>

            {/* Draft Outreach */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    const rows = aiRows;
                    setAiOutput(`Drafted ${rows.length} outreach message(s). (mock)`);
                  }}
                  className="min-w-[200px] rounded-md border bg-card p-4 text-left shadow-xs hover:bg-accent focus:outline-none snap-start"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    <div className="font-medium">Draft Outreach</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Create sample messages</div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={10} className="z-[60] mb-1">Generate outreach copy (mock)</TooltipContent>
            </Tooltip>

            {/* Report */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    const rows = aiRows;
                    setAiOutput(`Generated mini-report for ${rows.length} row(s). (mock)`);
                  }}
                  className="min-w-[200px] rounded-md border bg-card p-4 text-left shadow-xs hover:bg-accent focus:outline-none snap-start"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-500" />
                    <div className="font-medium">Mini Report</div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Quick downloadable report</div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={10} className="z-[60] mb-1">Mock report (no download)</TooltipContent>
            </Tooltip>
          </div>

          <div className="rounded-md border bg-muted/40 p-3 text-xs whitespace-pre-wrap mt-3">
            {aiOutput || "Pick an action above to see output here."}
          </div>
        </DialogContent>
      </Dialog>

      {/* Infinite scroll sentinel & status */}
      <div ref={sentinelRef} className="h-1 w-full" />
      <div className="py-4 text-center text-xs text-muted-foreground">
        {loading ? "Loading more…" : hasMore ? "Scroll to load more" : "All rows loaded"}
      </div>

      <DataTableRowModalCarousel
        table={table}
        open={carousel.open}
        onOpenChange={carousel.setOpen}
        index={carousel.index}
        setIndex={carousel.setIndex}
        rows={carousel.rows}
        onPrev={() => {
          const current = carousel.rows[carousel.index]?.original as DemoRow | undefined;
          const len = current?.leads.length ?? 0;
          if (!len) return;
          setLeadIndex((i) => (i - 1 + len) % len);
        }}
        onNext={() => {
          const current = carousel.rows[carousel.index]?.original as DemoRow | undefined;
          const len = current?.leads.length ?? 0;
          if (!len) return;
          setLeadIndex((i) => (i + 1) % len);
        }}
        title={(row) => row.original.list}
        description={(row) => `Uploaded: ${new Date(row.original.uploadDate).toLocaleDateString()}`}
        counter={(row) => (showAllLeads ? `All (${row.original.leads.length})` : `${leadIndex + 1} / ${row.original.leads.length}`)}
        render={(row) => {
          const singleLead = row.original.leads[leadIndex];
          if (!singleLead && !showAllLeads) return <div className="text-muted-foreground">No lead</div>;
          return (
            <div className="max-h-[70vh] overflow-y-auto pr-1">
              <div className="mb-2 flex items-center justify-end gap-2 text-xs">
                <span className="text-muted-foreground">Leads per page</span>
                <Select value={showAllLeads ? "all" : "one"} onValueChange={(v) => setShowAllLeads(v === "all")}>
                  <SelectTrigger className="h-7 w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one">One</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showAllLeads ? (
                <div className="space-y-3">
                  {row.original.leads.map((lead) => (
                    <div key={lead.id} className="rounded-md border p-3">
                      <div className="grid grid-cols-12 items-start gap-2">
                        <div className="col-span-6">
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-xs text-muted-foreground">{lead.address}</div>
                          <div className="mt-2 text-sm tabular-nums">{lead.phone}</div>
                          <div className="mt-1 truncate text-sm">
                            <a href={`mailto:${lead.email}`} className="text-primary underline-offset-2 hover:underline">{lead.email}</a>
                          </div>
                          {/* Associated address and verification badges */}
                          <div className="mt-2 text-xs text-muted-foreground">Assoc. Address: {lead.associatedAddress}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className={`rounded px-1.5 py-0.5 border ${lead.isIPhone ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}>Is iPhone: {lead.isIPhone ? "Yes" : "No"}</span>
                            <span className={`rounded px-1.5 py-0.5 border ${lead.addressVerified ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}>Address {lead.addressVerified ? "Verified" : "Unverified"}</span>
                            <span className={`rounded px-1.5 py-0.5 border ${lead.phoneVerified ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}>Phone {lead.phoneVerified ? "Verified" : "Unverified"}</span>
                            <span className={`rounded px-1.5 py-0.5 border ${lead.emailVerified ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}>Email {lead.emailVerified ? "Verified" : "Unverified"}</span>
                            <span className={`rounded px-1.5 py-0.5 border ${lead.socialVerified ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}>Social {lead.socialVerified ? "Verified" : "Unverified"}</span>
                          </div>
                        </div>
                        <div className="col-span-4 text-sm">
                          <div className="flex gap-2 flex-wrap">
                            {lead.socials.map((s) => (
                              <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">
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
                                  r.id === row.original.id
                                    ? { ...r, leads: r.leads.map((l) => (l.id === lead.id ? { ...l, status: val as DemoLead["status"] } : l)) }
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
                                    try {
                                      await navigator.clipboard.writeText(formatLeadDossier(lead));
                                      toast({ title: "Copied", description: "Dossier copied to clipboard." });
                                    } catch (err) {
                                      // eslint-disable-next-line no-console
                                      console.error("Clipboard copy failed", err);
                                      toast({ title: "Copy failed", description: "Unable to copy to clipboard.", variant: "destructive" });
                                    }
                                  }}
                                  aria-label="Copy social dossier"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={8} className="z-[100] max-w-80 whitespace-normal break-words">
                                <div className="text-left text-xs leading-5">
                                  {formatLeadDossierSummary(lead)}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                            <Button type="button" variant="outline" size="sm" onClick={() => exportLeadToCSV(lead)}>CSV</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => exportLeadToExcel(lead)}>Excel</Button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Activity Timeline</div>
                        <div className="mt-2 overflow-x-auto rounded border p-2">
                          {(() => {
                            const hasEvents = Array.isArray(lead.activity) && lead.activity.length > 0;
                            const events: ActivityEvent[] = hasEvents
                              ? lead.activity
                              : [{ ts: new Date().toISOString(), kind: "note", summary: "No activity yet" }];
                            const times = events.map((e) => new Date(e.ts).getTime()).sort((a, b) => a - b);
                            const start = times[0]!;
                            const end = times[times.length - 1]!;
                            const span = Math.max(1, end - start);
                            const color = (k: ActivityEvent["kind"]) => ({ call: "bg-emerald-500", email: "bg-blue-500", social: "bg-purple-500", note: "bg-gray-400" }[k]);
                            return (
                              <div className="min-w-[640px]">
                                <div className="relative h-10">
                                  <div className="absolute left-0 right-0 top-5 h-px bg-muted-foreground/30" />
                                  {events.map((e, idx) => {
                                    const t = new Date(e.ts).getTime();
                                    const pct = span === 1 ? 50 : ((t - start) / span) * 100;
                                    return (
                                      <div key={`${e.ts}-${idx}`} className="absolute top-5" style={{ left: `${pct}%` }}>
                                        <div className={`h-3 w-3 rounded-full ${color(e.kind)} ring-2 ring-background -translate-x-1/2 -translate-y-1/2`} title={`${e.summary || e.kind} • ${new Date(e.ts).toLocaleDateString()}`} />
                                        <div className="mt-1 -translate-x-1/2 whitespace-nowrap text-[10px] text-muted-foreground">{hasEvents ? e.kind : "No activity yet"}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                                  <span>{new Date(start).toLocaleDateString()}</span>
                                  <span>{new Date(end).toLocaleDateString()}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Additional possible contact data */}
                      {(lead.possiblePhones.length > 0 || lead.possibleEmails.length > 0 || lead.possibleHandles.length > 0) && (
                        <div className="mt-4 grid grid-cols-12 gap-3">
                          {lead.possiblePhones.length > 0 && (
                            <div className="col-span-4">
                              <div className="text-[11px] uppercase tracking-wide">Possible Phones</div>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {lead.possiblePhones.map((ph) => (
                                  <span key={`phone-${ph}`} className="rounded border px-1.5 py-0.5 font-medium tabular-nums">{ph}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {lead.possibleEmails.length > 0 && (
                            <div className="col-span-4">
                              <div className="text-[11px] uppercase tracking-wide">Possible Emails</div>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {lead.possibleEmails.map((em) => (
                                  <a key={`email-${em}`} href={`mailto:${em}`} className="rounded border px-1.5 py-0.5 font-medium text-primary underline-offset-2 hover:underline">{em}</a>
                                ))}
                              </div>
                            </div>
                          )}
                          {lead.possibleHandles.length > 0 && (
                            <div className="col-span-4">
                              <div className="text-[11px] uppercase tracking-wide">Possible Usernames</div>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {lead.possibleHandles.map((h) => (
                                  h.url ? (
                                    <a
                                      key={`handle-${h.platform}-${h.username}`}
                                      href={h.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`rounded border px-1.5 py-0.5 font-medium underline-offset-2 hover:underline ${h.platform === "Twitter" ? "text-blue-500" : "text-primary"}`}
                                    >
                                      {h.platform}: {h.username}
                                    </a>
                                  ) : (
                                    <span
                                      key={`handle-${h.platform}-${h.username}`}
                                      className={`rounded border px-1.5 py-0.5 font-medium ${h.platform === "Twitter" ? "text-blue-500" : "text-foreground"}`}
                                    >
                                      {h.platform}: {h.username}
                                    </span>
                                  )
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border p-3">
                  <div className="grid grid-cols-12 items-start gap-2">
                    <div className="col-span-6">
                      <div className="font-medium">{singleLead!.name}</div>
                      <div className="text-xs text-muted-foreground">{singleLead!.address}</div>
                      <div className="mt-2 text-sm tabular-nums">{singleLead!.phone}</div>
                      <div className="mt-1 truncate text-sm">
                        <a href={`mailto:${singleLead!.email}`} className="text-primary underline-offset-2 hover:underline">{singleLead!.email}</a>
                      </div>
                      {/* Associated address and verification badges */}
                      <div className="mt-2 text-xs text-muted-foreground">Assoc. Address: {singleLead!.associatedAddress}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className={`rounded px-1.5 py-0.5 border ${singleLead!.isIPhone ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}>Is iPhone: {singleLead!.isIPhone ? "Yes" : "No"}</span>
                        <span className={`rounded px-1.5 py-0.5 border ${singleLead!.addressVerified ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}>Address {singleLead!.addressVerified ? "Verified" : "Unverified"}</span>
                        <span className={`rounded px-1.5 py-0.5 border ${singleLead!.phoneVerified ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}>Phone {singleLead!.phoneVerified ? "Verified" : "Unverified"}</span>
                        <span className={`rounded px-1.5 py-0.5 border ${singleLead!.emailVerified ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}>Email {singleLead!.emailVerified ? "Verified" : "Unverified"}</span>
                        <span className={`rounded px-1.5 py-0.5 border ${singleLead!.socialVerified ? "border-emerald-400 text-emerald-600" : "border-red-300 text-red-600"}`}>Social {singleLead!.socialVerified ? "Verified" : "Unverified"}</span>
                      </div>
                    </div>
                    <div className="col-span-4 text-sm">
                      <div className="flex gap-2 flex-wrap">
                        {singleLead!.socials.map((s) => (
                          <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="text-primary underline-offset-2 hover:underline">{s.label}</a>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <Select
                        value={singleLead!.status}
                        onValueChange={(val) => {
                          setData((prev) =>
                            prev.map((r) =>
                              r.id === row.original.id
                                ? { ...r, leads: r.leads.map((l) => (l.id === singleLead!.id ? { ...l, status: val as DemoLead["status"] } : l)) }
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
                                try {
                                  await navigator.clipboard.writeText(formatLeadDossier(singleLead!));
                                  toast({ title: "Copied", description: "Dossier copied to clipboard." });
                                } catch (err) {
                                  // eslint-disable-next-line no-console
                                  console.error("Clipboard copy failed", err);
                                  toast({ title: "Copy failed", description: "Unable to copy to clipboard.", variant: "destructive" });
                                }
                              }}
                              aria-label="Copy social dossier"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8} className="z-[100] max-w-80 whitespace-normal break-words">
                            <div className="text-left text-xs leading-5">{formatLeadDossierSummary(singleLead!)}</div>
                          </TooltipContent>
                        </Tooltip>
                        <Button type="button" variant="outline" size="sm" onClick={() => exportLeadToCSV(singleLead!)}>CSV</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => exportLeadToExcel(singleLead!)}>Excel</Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Activity Timeline</div>
                    <div className="mt-2 overflow-x-auto rounded border p-2">
                      {(() => {
                        const hasEvents = Array.isArray(singleLead!.activity) && singleLead!.activity.length > 0;
                        const events: ActivityEvent[] = hasEvents ? singleLead!.activity : [{ ts: new Date().toISOString(), kind: "note", summary: "No activity yet" }];
                        const times = events.map((e) => new Date(e.ts).getTime()).sort((a, b) => a - b);
                        const start = times[0]!;
                        const end = times[times.length - 1]!;
                        const span = Math.max(1, end - start);
                        const color = (k: ActivityEvent["kind"]) => ({ call: "bg-emerald-500", email: "bg-blue-500", social: "bg-purple-500", note: "bg-gray-400" }[k]);
                        return (
                          <div className="min-w-[640px]">
                            <div className="relative h-10">
                              <div className="absolute left-0 right-0 top-5 h-px bg-muted-foreground/30" />
                              {events.map((e, idx) => {
                                const t = new Date(e.ts).getTime();
                                const pct = span === 1 ? 50 : ((t - start) / span) * 100;
                                return (
                                  <div key={`${e.ts}-${idx}`} className="absolute top-5" style={{ left: `${pct}%` }}>
                                    <div className={`h-3 w-3 rounded-full ${color(e.kind)} ring-2 ring-background -translate-x-1/2 -translate-y-1/2`} title={`${e.summary || e.kind} • ${new Date(e.ts).toLocaleDateString()}`} />
                                    <div className="mt-1 -translate-x-1/2 whitespace-nowrap text-[10px] text-muted-foreground">{hasEvents ? e.kind : "No activity yet"}</div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                              <span>{new Date(start).toLocaleDateString()}</span>
                              <span>{new Date(end).toLocaleDateString()}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Additional possible contact data */}
                  {(singleLead!.possiblePhones.length > 0 || singleLead!.possibleEmails.length > 0 || singleLead!.possibleHandles.length > 0) && (
                    <div className="mt-4 grid grid-cols-12 gap-3">
                      {singleLead!.possiblePhones.length > 0 && (
                        <div className="col-span-4">
                          <div className="text-[11px] uppercase tracking-wide">Possible Phones</div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {singleLead!.possiblePhones.map((ph) => (
                              <span key={`phone-${ph}`} className="rounded border px-1.5 py-0.5 font-medium tabular-nums">{ph}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {singleLead!.possibleEmails.length > 0 && (
                        <div className="col-span-4">
                          <div className="text-[11px] uppercase tracking-wide">Possible Emails</div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {singleLead!.possibleEmails.map((em) => (
                              <a key={`email-${em}`} href={`mailto:${em}`} className="rounded border px-1.5 py-0.5 font-medium text-primary underline-offset-2 hover:underline">{em}</a>
                            ))}
                          </div>
                        </div>
                      )}
                      {singleLead!.possibleHandles.length > 0 && (
                        <div className="col-span-4">
                          <div className="text-[11px] uppercase tracking-wide">Possible Usernames</div>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {singleLead!.possibleHandles.map((h) => (
                              h.url ? (
                                <a
                                  key={`handle-${h.platform}-${h.username}`}
                                  href={h.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`rounded border px-1.5 py-0.5 font-medium underline-offset-2 hover:underline ${h.platform === "Twitter" ? "text-blue-500" : "text-primary"}`}
                                >
                                  {h.platform}: {h.username}
                                </a>
                              ) : (
                                <span
                                  key={`handle-${h.platform}-${h.username}`}
                                  className={`rounded border px-1.5 py-0.5 font-medium ${h.platform === "Twitter" ? "text-blue-500" : "text-foreground"}`}
                                >
                                  {h.platform}: {h.username}
                                </span>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }}
        actions={(row) => (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                const headers: Array<keyof DemoRow> = ["list", "uploadDate", "records", "phone", "emails", "socials"];
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
                const headers: Array<keyof DemoRow> = ["list", "uploadDate", "records", "phone", "emails", "socials"];
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
