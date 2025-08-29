import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../../../components/data-table/data-table-column-header";
import { Checkbox } from "../../../components/ui/checkbox";
import { Badge } from "../../../components/ui/badge";
import type { CallCampaign } from "../../../../../../types/_dashboard/campaign";

export function buildDirectMailColumns(primaryLabel = "Mailers"): ColumnDef<CallCampaign>[] {
  return [
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
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Campaign Name" />
      ),
      enableColumnFilter: true,
      meta: { label: "Campaign Name", variant: "text", placeholder: "Search name" },
    },
    {
      id: "template",
      accessorFn: (row) => {
        const anyRow = row as any;
        const name: string | undefined = anyRow?.template?.name;
        const id: string | undefined = anyRow?.template?.id || anyRow?.templateId;
        return name || id || "-";
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Template" />
      ),
      cell: ({ getValue }) => {
        const value = String(getValue() ?? "-");
        return <span title={value}>{value}</span>;
      },
      enableColumnFilter: true,
      meta: { label: "Template", variant: "text", placeholder: "Search template" },
      size: 180,
    },
    {
      accessorKey: "calls",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={primaryLabel} />
      ),
      cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span>,
      enableColumnFilter: true,
      meta: { label: primaryLabel, variant: "range" },
    },
    {
      accessorKey: "inQueue",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Queued" />
      ),
      cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span>,
      enableColumnFilter: true,
      meta: { label: "Queued", variant: "range" },
    },
    {
      accessorKey: "leads",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Leads" />
      ),
      cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span>,
      enableColumnFilter: true,
      meta: { label: "Leads", variant: "range" },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const v = String(row.getValue(id) ?? "");
        return Array.isArray(value) ? value.includes(v) : String(value) === v;
      },
      meta: {
        label: "Status",
        variant: "select",
        options: [
          { label: "Delivering", value: "delivering" },
          { label: "Completed", value: "completed" },
          { label: "Failed", value: "failed" },
          { label: "Delivered", value: "delivered" },
          { label: "Pending", value: "pending" },
          { label: "Queued", value: "queued" },
          { label: "Read", value: "read" },
          { label: "Unread", value: "unread" },
        ],
      },
    },
    // Singular Transfer badge column
    {
      id: "transfer",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Transfer" />
      ),
      accessorFn: (row) => {
        const t = (row as any)?.transfer as { type?: string } | undefined;
        return t?.type ?? "";
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const v = String(row.getValue(id) ?? "");
        return Array.isArray(value) ? value.includes(v) : String(value) === v;
      },
      meta: {
        label: "Transfer",
        variant: "select",
        options: [
          { label: "Chat", value: "chat_agent" },
          { label: "Voice (In)", value: "voice_inbound" },
          { label: "Voice (Out)", value: "voice_outbound" },
          { label: "Text", value: "text" },
          { label: "Social", value: "social_media" },
          { label: "Appraisal", value: "appraisal" },
          { label: "Live Person", value: "live_person" },
          { label: "Live Person Calendar", value: "live_person_calendar" },
        ],
      },
      cell: ({ row }) => {
        const t = (row.original as any).transfer as
          | { type: string; agentId: string }
          | undefined;
        if (!t) return <span>-</span>;
        const label =
          t.type === "chat_agent"
            ? "Chat"
            : t.type === "voice_inbound"
            ? "Voice (In)"
            : t.type === "voice_outbound"
            ? "Voice (Out)"
            : t.type === "text"
            ? "Text"
            : t.type === "social_media"
            ? "Social"
            : t.type === "appraisal"
            ? "Appraisal"
            : t.type === "live_person"
            ? "Live Person"
            : t.type === "live_person_calendar"
            ? "Live Person Calendar"
            : t.type;
        return <Badge title={t.agentId}>{label}</Badge>;
      },
      size: 140,
    },
    // Numeric Transfers count column
    {
      accessorKey: "transfers",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Transfers" />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{String(getValue() ?? 0)}</span>
      ),
      enableColumnFilter: true,
      meta: { label: "Transfers", variant: "range" },
      filterFn: (row, id, value) => {
        const n = Number(row.getValue(id));
        if (Number.isNaN(n)) return false;
        if (!Array.isArray(value)) return true;
        const [min, max] = value as (number | undefined)[];
        if (min !== undefined && n < min) return false;
        if (max !== undefined && n > max) return false;
        return true;
      },
    },
    {
      id: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const raw = row.getValue(id);
        const t = new Date(String(raw)).getTime();
        if (!Array.isArray(value)) return true;
        const [from, to] = value as (number | undefined)[];
        if (from && t < from) return false;
        if (to && t > to) return false;
        return true;
      },
      meta: { label: "Start Date", variant: "dateRange" },
      cell: ({ getValue }) => {
        const d = new Date(String(getValue()));
        return (
          <span className="tabular-nums">
            {isNaN(d.getTime()) ? "-" : d.toLocaleDateString()}
          </span>
        );
      },
    },
    // Must-have LOB columns
    {
      id: "mailType",
      accessorFn: (row) => (row as any)?.mailType ?? "-",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mail Type" />
      ),
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const v = String(row.getValue(id) ?? "");
        return Array.isArray(value) ? value.includes(v) : String(value) === v;
      },
      meta: {
        label: "Mail Type",
        variant: "select",
        options: [
          { label: "Postcard", value: "postcard" },
          { label: "Letter", value: "letter" },
          { label: "Self Mailer", value: "self_mailer" },
        ],
      },
      size: 130,
    },
    {
      id: "mailSize",
      accessorFn: (row) => (row as any)?.mailSize ?? "-",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Size" />
      ),
      enableColumnFilter: true,
      meta: { label: "Size", variant: "text", placeholder: "e.g. 4x6" },
      size: 110,
    },
    {
      id: "addressVerified",
      accessorFn: (row) => {
        const v = (row as any)?.addressVerified as boolean | undefined;
        return typeof v === "boolean" ? (v ? "Yes" : "No") : "-";
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Address Verified" />
      ),
      cell: ({ getValue }) => <span>{String(getValue())}</span>,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const v = String(row.getValue(id) ?? "");
        return Array.isArray(value) ? value.includes(v) : String(value) === v;
      },
      meta: {
        label: "Address Verified",
        variant: "select",
        options: [
          { label: "Yes", value: "Yes" },
          { label: "No", value: "No" },
        ],
      },
      size: 150,
    },
    {
      id: "expectedDeliveryAt",
      accessorFn: (row) => (row as any)?.expectedDeliveryAt ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Expected Delivery" />
      ),
      cell: ({ getValue }) => {
        const d = new Date(String(getValue()))
        return <span className="tabular-nums">{isNaN(d.getTime()) ? "-" : d.toLocaleDateString()}</span>;
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const raw = row.getValue(id);
        const t = new Date(String(raw)).getTime();
        if (!Array.isArray(value)) return true;
        const [from, to] = value as (number | undefined)[];
        if (from && t < from) return false;
        if (to && t > to) return false;
        return true;
      },
      meta: { label: "Expected Delivery", variant: "dateRange" },
      size: 160,
    },
    {
      id: "lastEventAt",
      accessorFn: (row) => (row as any)?.lastEventAt ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Event" />
      ),
      cell: ({ getValue }) => {
        const d = new Date(String(getValue()))
        return <span className="tabular-nums">{isNaN(d.getTime()) ? "-" : d.toLocaleDateString()}</span>;
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const raw = row.getValue(id);
        const t = new Date(String(raw)).getTime();
        if (!Array.isArray(value)) return true;
        const [from, to] = value as (number | undefined)[];
        if (from && t < from) return false;
        if (to && t > to) return false;
        return true;
      },
      meta: { label: "Last Event", variant: "dateRange" },
      size: 140,
    },
    {
      id: "deliveredCount",
      accessorFn: (row) => (row as any)?.deliveredCount ?? 0,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Delivered" />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{String(getValue() ?? 0)}</span>
      ),
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const n = Number(row.getValue(id));
        if (Number.isNaN(n)) return false;
        if (!Array.isArray(value)) return true;
        const [min, max] = value as (number | undefined)[];
        if (min !== undefined && n < min) return false;
        if (max !== undefined && n > max) return false;
        return true;
      },
      meta: { label: "Delivered", variant: "range" },
      size: 120,
    },
    {
      id: "returnedCount",
      accessorFn: (row) => (row as any)?.returnedCount ?? 0,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Returned" />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{String(getValue() ?? 0)}</span>
      ),
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const n = Number(row.getValue(id));
        if (Number.isNaN(n)) return false;
        if (!Array.isArray(value)) return true;
        const [min, max] = value as (number | undefined)[];
        if (min !== undefined && n < min) return false;
        if (max !== undefined && n > max) return false;
        return true;
      },
      meta: { label: "Returned", variant: "range" },
      size: 120,
    },
    {
      id: "failedCount",
      accessorFn: (row) => (row as any)?.failedCount ?? 0,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Failed" />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{String(getValue() ?? 0)}</span>
      ),
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const n = Number(row.getValue(id));
        if (Number.isNaN(n)) return false;
        if (!Array.isArray(value)) return true;
        const [min, max] = value as (number | undefined)[];
        if (min !== undefined && n < min) return false;
        if (max !== undefined && n > max) return false;
        return true;
      },
      meta: { label: "Failed", variant: "range" },
      size: 100,
    },
    {
      id: "cost",
      accessorFn: (row) => (row as any)?.cost ?? 0,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cost" />
      ),
      cell: ({ getValue }) => {
        const n = Number(getValue() ?? 0);
        return <span className="tabular-nums">{isNaN(n) ? "-" : `$${n.toFixed(2)}`}</span>;
      },
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const n = Number(row.getValue(id));
        if (Number.isNaN(n)) return false;
        if (!Array.isArray(value)) return true;
        const [min, max] = value as (number | undefined)[];
        if (min !== undefined && n < min) return false;
        if (max !== undefined && n > max) return false;
        return true;
      },
      meta: { label: "Cost", variant: "range" },
      size: 110,
    },
  ];
}
