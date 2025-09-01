import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "../../../../components/data-table/data-table-column-header";
import { Checkbox } from "../../../../components/ui/checkbox";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import type { CallCampaign } from "../../../../../../../types/_dashboard/campaign";
import { PlaybackCell } from "../components/PlaybackCell";
import { getTextMetric, getLastMessageAt, downloadCampaignZip } from "../../text/utils/helpers";
import { Pause, Play, Square, ThumbsDown, ThumbsUp } from "lucide-react";
import { stopRowClick, withStopPropagation } from "../../../../utils/events";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../components/ui/popover";
import { Input } from "../../../../components/ui/input";

export type CampaignType = "Calls" | "Text" | "Social" | "Direct Mail";

function getPrimaryLabel(campaignType: CampaignType) {
  return campaignType === "Calls"
    ? "Calls"
    : campaignType === "Text"
    ? "Messages"
    : campaignType === "Social"
    ? "Actions"
    : "Mailers";
}

export function buildCallCampaignColumns(
  campaignType: CampaignType,
): ColumnDef<CallCampaign>[] {
  const primaryLabel = getPrimaryLabel(campaignType);

  // Common: selection + name
  const base: ColumnDef<CallCampaign>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center gap-2 pl-2">
          <div className="grid h-5 w-5 place-items-center">
            <Checkbox
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
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
      id: "controls",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Controls" />
      ),
      cell: ({ row, table }) => {
        const status = String((row.original as any).status ?? "");
        const isActive = ["queued", "delivering", "pending"].includes(status);
        const isPaused = status === "paused";
        const canControl = isActive || isPaused;
        const meta = ((table.options as any)?.meta ?? {}) as {
          onPause?: (r: any) => void;
          onResume?: (r: any) => void;
          onStop?: (r: any) => void;
        };
        return (
          <div className="flex items-center gap-2" onClick={stopRowClick}>
            <Button
              type="button"
              size="sm"
              variant="outline"
              aria-label={isPaused ? "Resume" : "Pause"}
              disabled={!canControl}
              onClick={withStopPropagation(() => {
                if (!canControl) return;
                if (isPaused) meta.onResume?.(row.original);
                else meta.onPause?.(row.original);
              })}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              aria-label="Stop"
              disabled={!canControl}
              onClick={withStopPropagation(() => {
                if (!canControl) return;
                meta.onStop?.(row.original);
              })}
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 220,
    },
    {
      id: "feedback",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Feedback" />
      ),
      cell: ({ row, table }) => {
        const r = row.original as any;
        const status = String(r.status ?? "");
        if (status !== "completed") return <span className="text-muted-foreground">—</span>;
        const meta = ((table.options as any)?.meta ?? {}) as {
          getFeedback?: (r: any) => { sentiment: "up" | "down" | null; note: string } | undefined;
          onToggleFeedback?: (r: any, s: "up" | "down") => void;
          onFeedbackNoteChange?: (r: any, note: string) => void;
        };
        const fb = meta.getFeedback?.(r) ?? { sentiment: null, note: "" };
        const name = String(r.name ?? "this");
        const upActive = fb.sentiment === "up";
        const downActive = fb.sentiment === "down";
        return (
          <div className="flex items-center gap-2" onClick={stopRowClick}>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Thumbs up"
                  className={upActive ? "text-green-600 border-green-500" : ""}
                  onClick={withStopPropagation(() => meta.onToggleFeedback?.(r, "up"))}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64" onClick={stopRowClick}>
                <Input
                  placeholder={`Why did you ${upActive ? "like" : "like"} \"${name}\"?`}
                  value={fb.note}
                  onChange={(e) => meta.onFeedbackNoteChange?.(r, e.target.value)}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Thumbs down"
                  className={downActive ? "text-red-600 border-red-500" : ""}
                  onClick={withStopPropagation(() => meta.onToggleFeedback?.(r, "down"))}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64" onClick={stopRowClick}>
                <Input
                  placeholder={`Why did you ${downActive ? "dislike" : "dislike"} \"${name}\"?`}
                  value={fb.note}
                  onChange={(e) => meta.onFeedbackNoteChange?.(r, e.target.value)}
                />
              </PopoverContent>
            </Popover>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 170,
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
  ];

  // Campaign-specific columns
  if (campaignType === "Text") {
    const textCols: ColumnDef<CallCampaign>[] = [
      {
        id: "sent",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Sent" />
        ),
        accessorFn: (row) => getTextMetric(row, "sent"),
        cell: ({ row }) => (
          <span className="tabular-nums">{getTextMetric(row.original, "sent")}</span>
        ),
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          const n = Number(row.getValue(id) ?? 0);
          if (!Array.isArray(value)) return true;
          const [min, max] = value as (number | undefined)[];
          if (min != null && n < min) return false;
          if (max != null && n > max) return false;
          return true;
        },
        meta: { label: "Sent", variant: "range" },
        size: 80,
      },
      {
        id: "delivered",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Delivered" />
        ),
        accessorFn: (row) => getTextMetric(row, "delivered"),
        cell: ({ row }) => (
          <span className="tabular-nums">{getTextMetric(row.original, "delivered")}</span>
        ),
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          const n = Number(row.getValue(id) ?? 0);
          if (!Array.isArray(value)) return true;
          const [min, max] = value as (number | undefined)[];
          if (min != null && n < min) return false;
          if (max != null && n > max) return false;
          return true;
        },
        meta: { label: "Delivered", variant: "range" },
        size: 96,
      },
      {
        id: "failed",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Failed" />
        ),
        accessorFn: (row) => getTextMetric(row, "failed"),
        cell: ({ row }) => (
          <span className="tabular-nums">{getTextMetric(row.original, "failed")}</span>
        ),
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          const n = Number(row.getValue(id) ?? 0);
          if (!Array.isArray(value)) return true;
          const [min, max] = value as (number | undefined)[];
          if (min != null && n < min) return false;
          if (max != null && n > max) return false;
          return true;
        },
        meta: { label: "Failed", variant: "range" },
        size: 80,
      },
      {
        id: "totalMessages",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Total Messages" />
        ),
        accessorFn: (row) => getTextMetric(row, "total"),
        cell: ({ row }) => (
          <span className="tabular-nums">{getTextMetric(row.original, "total")}</span>
        ),
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          const n = Number(row.getValue(id) ?? 0);
          if (!Array.isArray(value)) return true;
          const [min, max] = value as (number | undefined)[];
          if (min != null && n < min) return false;
          if (max != null && n > max) return false;
          return true;
        },
        meta: { label: "Total Messages", variant: "range" },
        size: 120,
      },
      {
        id: "lastMessageAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Last Message Sent" />
        ),
        accessorFn: (row) => {
          const raw = (row as any)?.textStats?.lastMessageAt ?? (row as any)?.lastMessageAt;
          const t = new Date(String(raw)).getTime();
          return isNaN(t) ? 0 : t;
        },
        cell: ({ row }) => {
          const d = getLastMessageAt(row.original);
          return <span className="tabular-nums">{d}</span>;
        },
        enableColumnFilter: false,
        size: 160,
      },
    ];

    const statusAndDate: ColumnDef<CallCampaign>[] = [
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
          variant: "multiSelect",
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
        accessorKey: "startDate",
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
            <span className="tabular-nums">{isNaN(d.getTime()) ? "-" : d.toLocaleDateString()}</span>
          );
        },
        size: 120,
      },
    ];

    const downloadCol: ColumnDef<CallCampaign> = {
      id: "download",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Download Messages" />
      ),
      cell: ({ row }) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            void downloadCampaignZip(row.original);
          }}
        >
          Download ZIP
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 160,
    };

    return [...base, ...textCols, ...statusAndDate, downloadCol];
  }

  // Default (Calls/Social/Direct Mail) use existing numeric columns
  const defaultCols: ColumnDef<CallCampaign>[] = [
    {
      accessorKey: "calls",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={primaryLabel} />
      ),
      cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span>,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const n = Number(row.getValue(id) ?? 0);
        if (!Array.isArray(value)) return true;
        const [min, max] = value as (number | undefined)[];
        if (min != null && n < min) return false;
        if (max != null && n > max) return false;
        return true;
      },
      meta: { label: primaryLabel, variant: "range" },
      size: 80,
    },
    {
      accessorKey: "inQueue",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Queued" />
      ),
      cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span>,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const n = Number(row.getValue(id) ?? 0);
        if (!Array.isArray(value)) return true;
        const [min, max] = value as (number | undefined)[];
        if (min != null && n < min) return false;
        if (max != null && n > max) return false;
        return true;
      },
      meta: { label: "Queued", variant: "range" },
      size: 80,
    },
    {
      accessorKey: "leads",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Leads" />
      ),
      cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span>,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const n = Number(row.getValue(id) ?? 0);
        if (!Array.isArray(value)) return true;
        const [min, max] = value as (number | undefined)[];
        if (min != null && n < min) return false;
        if (max != null && n > max) return false;
        return true;
      },
      meta: { label: "Leads", variant: "range" },
      size: 80,
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
        variant: "multiSelect",
        options: [
          { label: "Delivering", value: "delivering" },
          { label: "Completed", value: "completed" },
          { label: "Failed", value: "failed" },
          { label: "Missed", value: "missed" },
          { label: "Delivered", value: "delivered" },
          { label: "Pending", value: "pending" },
          { label: "Queued", value: "queued" },
          { label: "Paused", value: "paused" },
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
    // Singular Transfer badge column
    {
      id: "transfer",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Transfer" />
      ),
      enableColumnFilter: true,
      accessorFn: (row) => {
        const t = (row as any).transfer as { type?: string } | undefined;
        return t?.type ?? "";
      },
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
        if (!Array.isArray(value)) return true;
        const [min, max] = value as (number | undefined)[];
        if (min != null && n < min) return false;
        if (max != null && n > max) return false;
        return true;
      },
      meta: { label: "Transfers", variant: "range" },
      size: 110,
    },
    {
      id: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      enableColumnFilter: true,
      accessorFn: (row) => {
        const t = new Date(String((row as any).startDate)).getTime();
        return isNaN(t) ? 0 : t;
      },
      filterFn: (row, id, value) => {
        const raw = row.getValue(id);
        const t = typeof raw === "number" ? raw : new Date(String(raw)).getTime();
        if (!Array.isArray(value)) return true;
        const [from, to] = value as (number | undefined)[];
        if (from && t < from) return false;
        if (to && t > to) return false;
        return true;
      },
      meta: { label: "Start Date", variant: "dateRange" },
      cell: ({ getValue }) => {
        const raw = getValue();
        const d = new Date(typeof raw === "number" ? raw : String(raw));
        return (
          <span className="tabular-nums">{isNaN(d.getTime()) ? "-" : d.toLocaleDateString()}</span>
        );
      },
      size: 120,
    },
  ];

  // Add playback only for Calls
  if (campaignType === "Calls") {
    // Helper: pull first Vapi call response safely
    const firstCall = (row: CallCampaign) =>
      ((row as unknown as { callInformation?: Array<{ callResponse?: any }> })
        .callInformation?.[0]?.callResponse) as
        | {
            phoneCallTransport?: string;
            phoneCallProvider?: string;
            status?: string;
            cost?: number;
            costBreakdown?: { total?: number };
            startedAt?: string | number | Date;
            endedAt?: string | number | Date;
          }
        | undefined;

    // Insert Vapi-specific columns before Playback
    defaultCols.push(
      {
        id: "transport",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Transport" />
        ),
        accessorFn: (row) => firstCall(row)?.phoneCallTransport ?? "-",
        cell: ({ row }) => {
          const t = firstCall(row.original)?.phoneCallTransport ?? "-";
          return <Badge variant="outline">{t}</Badge>;
        },
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          const v = String(row.getValue(id) ?? "");
          return Array.isArray(value) ? value.includes(v) : String(value) === v;
        },
        meta: {
          label: "Transport",
          variant: "multiSelect",
          options: [
            { label: "SIP", value: "sip" },
            { label: "PSTN", value: "pstn" },
          ],
        },
        size: 90,
      },
      {
        id: "provider",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Provider" />
        ),
        accessorFn: (row) => (firstCall(row)?.phoneCallProvider ?? "").toString(),
        cell: ({ getValue }) => {
          const p = String(getValue() || "-");
          return <Badge>{p || "-"}</Badge>;
        },
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          const v = String(row.getValue(id) ?? "");
          return Array.isArray(value) ? value.includes(v) : String(value) === v;
        },
        meta: {
          label: "Provider",
          variant: "multiSelect",
          options: [
            { label: "Twilio", value: "twilio" },
            { label: "Vonage", value: "vonage" },
            { label: "Vapi", value: "vapi" },
          ],
        },
        size: 96,
      },
      {
        id: "callStatus",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Call Status" />
        ),
        accessorFn: (row) => firstCall(row)?.status ?? "-",
        cell: ({ getValue }) => (
          <span className="block truncate max-w-[120px]" title={String(getValue())}>
            {String(getValue())}
          </span>
        ),
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          const v = String(row.getValue(id) ?? "");
          return Array.isArray(value) ? value.includes(v) : String(value) === v;
        },
        meta: {
          label: "Call Status",
          variant: "multiSelect",
          options: [
            { label: "Queued", value: "queued" },
            { label: "Ringing", value: "ringing" },
            { label: "In Progress", value: "in-progress" },
            { label: "Forwarding", value: "forwarding" },
            { label: "Ended", value: "ended" },
            { label: "Scheduled", value: "scheduled" },
          ],
        },
        size: 120,
      },
      {
        id: "costTotal",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Cost ($)" />
        ),
        accessorFn: (row) => firstCall(row)?.costBreakdown?.total ?? firstCall(row)?.cost ?? 0,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{Number(getValue() ?? 0).toFixed(2)}</span>
        ),
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          const n = Number(row.getValue(id) ?? 0);
          if (!Array.isArray(value)) return true;
          const [min, max] = value as (number | undefined)[];
          if (min != null && n < min) return false;
          if (max != null && n > max) return false;
          return true;
        },
        meta: { label: "Cost", variant: "range" },
        size: 90,
      },
      {
        id: "startedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Started" />
        ),
        accessorFn: (row) => {
          const raw = firstCall(row)?.startedAt;
          const t = new Date(String(raw)).getTime();
          return isNaN(t) ? 0 : t;
        },
        cell: ({ getValue }) => {
          const v = getValue();
          const d = new Date(typeof v === "number" ? v : String(v));
          return <span className="tabular-nums">{isNaN(d.getTime()) ? "-" : d.toLocaleString()}</span>;
        },
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          const raw = row.getValue(id);
          const t = typeof raw === "number" ? raw : new Date(String(raw)).getTime();
          if (!Array.isArray(value)) return true;
          const [from, to] = value as (number | undefined)[];
          if (from && t < from) return false;
          if (to && t > to) return false;
          return true;
        },
        meta: { label: "Started", variant: "dateRange" },
        size: 160,
      },
      {
        id: "endedAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Ended" />
        ),
        accessorFn: (row) => {
          const raw = firstCall(row)?.endedAt;
          const t = new Date(String(raw)).getTime();
          return isNaN(t) ? 0 : t;
        },
        cell: ({ getValue }) => {
          const v = getValue();
          const d = new Date(typeof v === "number" ? v : String(v));
          return <span className="tabular-nums">{isNaN(d.getTime()) ? "-" : d.toLocaleString()}</span>;
        },
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          const raw = row.getValue(id);
          const t = typeof raw === "number" ? raw : new Date(String(raw)).getTime();
          if (!Array.isArray(value)) return true;
          const [from, to] = value as (number | undefined)[];
          if (from && t < from) return false;
          if (to && t > to) return false;
          return true;
        },
        meta: { label: "Ended", variant: "dateRange" },
        size: 160,
      },
    );
    // Dialing configuration columns
    defaultCols.push(
      {
        id: "totalDialAttempts",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Total Dial Attempts" />
        ),
        accessorFn: (row) => (row as any).totalDialAttempts ?? 0,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{String(getValue() ?? 0)}</span>
        ),
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          const n = Number(row.getValue(id) ?? 0);
          if (!Array.isArray(value)) return true;
          const [min, max] = value as (number | undefined)[];
          if (min != null && n < min) return false;
          if (max != null && n > max) return false;
          return true;
        },
        meta: { label: "Total Dial Attempts", variant: "range" },
        size: 140,
      },
      {
        id: "maxDailyAttempts",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Max Daily Attempts" />
        ),
        accessorFn: (row) => (row as any).maxDailyAttempts ?? 0,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{String(getValue() ?? 0)}</span>
        ),
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          const n = Number(row.getValue(id) ?? 0);
          if (!Array.isArray(value)) return true;
          const [min, max] = value as (number | undefined)[];
          if (min != null && n < min) return false;
          if (max != null && n > max) return false;
          return true;
        },
        meta: { label: "Max Daily Attempts", variant: "range" },
        size: 150,
      },
      {
        id: "minMinutesBetweenCalls",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Min Minutes Between Calls" />
        ),
        accessorFn: (row) => (row as any).minMinutesBetweenCalls ?? 0,
        cell: ({ getValue }) => (
          <span className="tabular-nums">{String(getValue() ?? 0)}</span>
        ),
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          const n = Number(row.getValue(id) ?? 0);
          if (!Array.isArray(value)) return true;
          const [min, max] = value as (number | undefined)[];
          if (min != null && n < min) return false;
          if (max != null && n > max) return false;
          return true;
        },
        meta: { label: "Min Minutes Between Calls", variant: "range" },
        size: 190,
      },
      {
        id: "countVoicemailAsAnswered",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="VM Counts as Answered" />
        ),
        accessorFn: (row) => ((row as any).countVoicemailAsAnswered ? "true" : "false"),
        cell: ({ row }) => {
          const v = Boolean((row.original as any).countVoicemailAsAnswered);
          return <Badge variant={v ? "default" : "outline"}>{v ? "Yes" : "No"}</Badge>;
        },
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          const v = String(row.getValue(id) ?? "false");
          return Array.isArray(value) ? value.includes(v) : String(value) === v;
        },
        meta: {
          label: "VM Counts as Answered",
          variant: "select",
          options: [
            { label: "Yes", value: "true" },
            { label: "No", value: "false" },
          ],
        },
        size: 170,
      },
      {
        id: "postCallWebhookUrl",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Post-Call Webhook" />
        ),
        accessorFn: (row) => (row as any).postCallWebhookUrl ?? "",
        cell: ({ getValue }) => (
          <span className="block truncate max-w-[220px]" title={String(getValue() ?? "")}>
            {String(getValue() ?? "-")}
          </span>
        ),
        enableColumnFilter: true,
        filterFn: (row, id, value) => {
          const v = String(row.getValue(id) ?? "").toLowerCase();
          const search = String(value ?? "").toLowerCase();
          if (!search) return true;
          return v.includes(search);
        },
        meta: { label: "Post-Call Webhook", variant: "text", placeholder: "Search URL" },
        size: 220,
      },
    );

    defaultCols.push({
      id: "playback",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Playback" />
      ),
      cell: ({ row }) => (
        <div onClick={stopRowClick}>
          <PlaybackCell callInformation={row.original.callInformation ?? []} />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 220,
    });
  }

  return [...base, ...defaultCols];
}
