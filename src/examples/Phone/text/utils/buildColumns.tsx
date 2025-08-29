"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { DataTableColumnHeader } from "../../../../components/data-table/data-table-column-header";
import { Checkbox } from "../../../../components/ui/checkbox";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import type { CallCampaign } from "../../../../../../../types/_dashboard/campaign";
import { getTextMetric, getLastMessageAt, downloadCampaignZip, getDeviceHint } from "./helpers";

export function buildTextCampaignColumns(): ColumnDef<CallCampaign>[] {
  const cols: ColumnDef<CallCampaign>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center gap-2 pl-2">
          <div className="grid h-5 w-5 place-items-center">
            <Checkbox
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && ("indeterminate" as unknown as boolean))
              }
              onCheckedChange={(value: boolean | "indeterminate") => table.toggleAllPageRowsSelected(!!value)}
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
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            checked={row.getIsSelected()}
            onCheckedChange={(value: boolean | "indeterminate") => row.toggleSelected(!!value)}
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
      cell: ({ getValue }) => (
        <span className="block truncate max-w-[220px]" title={String(getValue())}>
          {String(getValue())}
        </span>
      ),
      enableColumnFilter: true,
      meta: { label: "Campaign Name", variant: "text", placeholder: "Search name" },
      size: 220,
    },
    {
      id: "device",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Device" />
      ),
      meta: { label: "Device", variant: "text" },
      cell: ({ row }) => {
        const label = getDeviceHint(row.original as any);
        const isApple = label === "Apple";
        return (
          <Badge variant={isApple ? "default" : "outline"} title={label}>
            {label}
          </Badge>
        );
      },
      size: 96,
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
          { label: "Missed", value: "missed" },
          { label: "Delivered", value: "delivered" },
          { label: "Pending", value: "pending" },
          { label: "Queued", value: "queued" },
          { label: "Read", value: "read" },
          { label: "Unread", value: "unread" },
        ],
      },
      cell: ({ getValue }) => (
        <span className="block truncate max-w-[140px]" title={String(getValue())}>
          {String(getValue())}
        </span>
      ),
      size: 140,
    },
    {
      id: "transfer",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Transfer" />
      ),
      accessorFn: (row) => (row as any)?.transfer?.type ?? "-",
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
    {
      accessorKey: "transfers",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Transfers" />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{String(getValue() ?? 0)}</span>
      ),
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const n = Number(row.getValue(id) ?? 0);
        const [min, max] = Array.isArray(value) ? value : [];
        const lo = typeof min === "number" ? min : -Infinity;
        const hi = typeof max === "number" ? max : Infinity;
        return n >= lo && n <= hi;
      },
      meta: { label: "Transfers", variant: "range" },
      size: 110,
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" />
      ),
      enableColumnFilter: true,
      meta: { label: "Created At", variant: "dateRange" },
      cell: ({ getValue }) => {
        const d = new Date(String(getValue()));
        return (
          <span className="tabular-nums">
            {isNaN(d.getTime()) ? "-" : d.toLocaleDateString()}
          </span>
        );
      },
      size: 120,
    },
    {
      id: "sent",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Sent" />,
      accessorFn: (row) => getTextMetric(row as CallCampaign, "sent"),
      cell: ({ getValue }) => <span className="tabular-nums">{String(getValue() ?? 0)}</span>,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const n = Number(row.getValue(id) ?? 0);
        const [min, max] = Array.isArray(value) ? value : [];
        const lo = typeof min === "number" ? min : -Infinity;
        const hi = typeof max === "number" ? max : Infinity;
        return n >= lo && n <= hi;
      },
      meta: { label: "Sent", variant: "range" },
      size: 80,
    },
    {
      id: "delivered",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Delivered" />,
      accessorFn: (row) => getTextMetric(row as CallCampaign, "delivered"),
      cell: ({ getValue }) => <span className="tabular-nums">{String(getValue() ?? 0)}</span>,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const n = Number(row.getValue(id) ?? 0);
        const [min, max] = Array.isArray(value) ? value : [];
        const lo = typeof min === "number" ? min : -Infinity;
        const hi = typeof max === "number" ? max : Infinity;
        return n >= lo && n <= hi;
      },
      meta: { label: "Delivered", variant: "range" },
      size: 96,
    },
    {
      id: "failed",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Failed" />,
      accessorFn: (row) => getTextMetric(row as CallCampaign, "failed"),
      cell: ({ getValue }) => <span className="tabular-nums">{String(getValue() ?? 0)}</span>,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const n = Number(row.getValue(id) ?? 0);
        const [min, max] = Array.isArray(value) ? value : [];
        const lo = typeof min === "number" ? min : -Infinity;
        const hi = typeof max === "number" ? max : Infinity;
        return n >= lo && n <= hi;
      },
      meta: { label: "Failed", variant: "range" },
      size: 84,
    },
    {
      id: "totalMessages",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Total Messages" />,
      accessorFn: (row) => getTextMetric(row as CallCampaign, "total"),
      cell: ({ getValue }) => <span className="tabular-nums">{String(getValue() ?? 0)}</span>,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const n = Number(row.getValue(id) ?? 0);
        const [min, max] = Array.isArray(value) ? value : [];
        const lo = typeof min === "number" ? min : -Infinity;
        const hi = typeof max === "number" ? max : Infinity;
        return n >= lo && n <= hi;
      },
      meta: { label: "Total Messages", variant: "range" },
      size: 120,
    },
    {
      id: "lastMessageAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Message Sent" />,
      accessorFn: (row) => getLastMessageAt(row as CallCampaign) || "",
      cell: ({ getValue }) => <span className="whitespace-nowrap">{String(getValue() || "-")}</span>,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const raw = String(row.getValue(id) || "");
        const ts = raw ? new Date(raw).getTime() : NaN;
        const [start, end] = Array.isArray(value) ? value : [];
        const lo = start ? new Date(start as string).getTime() : -Infinity;
        const hi = end ? new Date(end as string).getTime() : Infinity;
        return Number.isNaN(ts) ? false : ts >= lo && ts <= hi;
      },
      meta: { label: "Last Message Sent", variant: "dateRange" },
      size: 180,
    },
    {
      id: "download",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Download Messages" />,
      cell: ({ row }) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            // Prefer ZIP of CSVs (summary, leads, messages, per-lead)
            void downloadCampaignZip(row.original as CallCampaign);
          }}
        >
          Download ZIP
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 160,
    },
  ];

  return cols;
}
