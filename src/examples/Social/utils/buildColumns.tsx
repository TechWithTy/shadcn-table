import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../../../components/data-table/data-table-column-header";
import { Checkbox } from "../../../components/ui/checkbox";
import { Badge } from "../../../components/ui/badge";
import type { CallCampaign } from "../../../../../../types/_dashboard/campaign";
import type { CheckedState } from "@radix-ui/react-checkbox";

export function buildSocialColumns(): ColumnDef<CallCampaign>[] {
  const primaryLabel = "Actions";
  return [
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
              onCheckedChange={(value: CheckedState) => table.toggleAllPageRowsSelected(!!value)}
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
            onCheckedChange={(value: CheckedState) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="h-4 w-4 leading-none grid place-items-center"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 48,
    },
    // Platform badge (facebook/linkedin)
    {
      accessorKey: "platform",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Platform" />
      ),
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const v = String(row.getValue(id) ?? "");
        return Array.isArray(value) ? value.includes(v) : String(value) === v;
      },
      meta: {
        label: "Platform",
        variant: "select",
        options: [
          { label: "Facebook", value: "facebook" },
          { label: "LinkedIn", value: "linkedin" },
        ],
      },
      cell: ({ getValue }) => {
        const v = String(getValue() || "-");
        const variant = v === "facebook" ? "default" : v === "linkedin" ? "secondary" : "outline";
        const label = v === "facebook" ? "Facebook" : v === "linkedin" ? "LinkedIn" : "-";
        return <Badge variant={variant as any}>{label}</Badge>;
      },
      size: 120,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Campaign Name" />
      ),
      enableColumnFilter: true,
      meta: { label: "Campaign Name", variant: "text", placeholder: "Search name" },
    },
    // Flow / Template (unified)
    {
      id: "flowTemplate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Flow / Template" />
      ),
      meta: { label: "Flow / Template", variant: "text" },
      cell: ({ row }) => {
        const original: any = row.original;
        const platform = original.platform as string | undefined;
        if (platform === "facebook") {
          const name = original.manychatFlowName ?? "Flow";
          const flowId = original.manychatFlowId ?? undefined;
          return (
            <div className="max-w-[220px] truncate" title={flowId ? `${name} (${flowId})` : name}>
              {name}
            </div>
          );
        }
        if (platform === "linkedin") {
          const t = original.liTemplateType ?? "DM";
          const templateName = original.liTemplateName ?? "Template";
          return (
            <div className="max-w-[220px] truncate" title={`${t} - ${templateName}`}>
              {t} · {templateName}
            </div>
          );
        }
        return <span>-</span>;
      },
    },
    // Audience (unified target id)
    {
      id: "audience",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Audience" />
      ),
      meta: { label: "Audience", variant: "text" },
      cell: ({ row }) => {
        const o: any = row.original;
        const platform = o.platform as string | undefined;
        let val: string | undefined;
        if (platform === "facebook") {
          val = o.facebookSubscriberId || o.facebookExternalId;
        } else if (platform === "linkedin") {
          val = o.linkedinChatId || o.linkedinProfileUrl || o.linkedinPublicId;
        }
        const text = val ? String(val) : "-";
        return <span className="max-w-[260px] truncate" title={text}>{text}</span>;
      },
      size: 280,
    },
    // Progress (Queued | Sent | Delivered | Failed)
    {
      id: "progress",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Progress" />
      ),
      meta: { label: "Progress", variant: "text" },
      cell: ({ row }) => {
        const o: any = row.original;
        // Map existing fields for demo if dedicated fields are missing
        const queued = o.queued ?? o.inQueue ?? 0;
        const sent = o.sent ?? o.calls ?? 0;
        const delivered = o.delivered ?? (typeof o.leads === "number" ? o.leads : 0);
        const failed = o.failed ?? 0;
        const total = Math.max(1, queued + sent + delivered + failed);
        const segments = [
          { key: "Queued", value: queued, color: "bg-sky-500" },
          { key: "Sent", value: sent, color: "bg-indigo-500" },
          { key: "Delivered", value: delivered, color: "bg-emerald-500" },
          { key: "Failed", value: failed, color: "bg-rose-500" },
        ];
        const label = `Queued: ${queued} • Sent: ${sent} • Delivered: ${delivered} • Failed: ${failed}`;
        return (
          <div className="min-w-[240px]" aria-label={label} title={label}>
            <div className="flex h-2 w-full overflow-hidden rounded-md bg-muted">
              {segments.map((s) =>
                s.value > 0 ? (
                  <div
                    key={s.key}
                    className={`${s.color}`}
                    style={{ width: `${(s.value / total) * 100}%` }}
                    title={`${s.key}: ${s.value}`}
                  />
                ) : null,
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span>Queued: <span className="tabular-nums">{queued}</span></span>
              <span>Sent: <span className="tabular-nums">{sent}</span></span>
              <span>Delivered: <span className="tabular-nums">{delivered}</span></span>
              <span>Failed: <span className="tabular-nums">{failed}</span></span>
            </div>
          </div>
        );
      },
      size: 260,
    },
    // Hidden computed: Can Send
    {
      id: "canSend",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Can Send" />
      ),
      enableColumnFilter: true,
      accessorFn: (row) => {
        const o: any = row;
        const platform = o.platform as string | undefined;
        let ok = false;
        if (platform === "facebook") {
          const hasAudience = Boolean(o.facebookSubscriberId || o.facebookExternalId);
          const hasFlow = Boolean(o.manychatFlowId || o.manychatFlowName);
          ok = hasAudience && hasFlow;
        } else if (platform === "linkedin") {
          const hasAudience = Boolean(o.linkedinChatId || o.linkedinProfileUrl || o.linkedinPublicId);
          const hasTemplate = Boolean(o.liTemplateType || o.liTemplateName);
          ok = hasAudience && hasTemplate;
        }
        return ok ? "yes" : "no";
      },
      filterFn: (row, id, value) => {
        const v = String(row.getValue(id) ?? "");
        return Array.isArray(value) ? value.includes(v) : String(value) === v;
      },
      meta: { label: "Can Send", variant: "select", options: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ] },
      cell: ({ row }) => {
        const o: any = row.original;
        const platform = o.platform as string | undefined;
        let ok = false;
        if (platform === "facebook") {
          const hasAudience = Boolean(o.facebookSubscriberId || o.facebookExternalId);
          const hasFlow = Boolean(o.manychatFlowId || o.manychatFlowName);
          ok = hasAudience && hasFlow;
        } else if (platform === "linkedin") {
          const hasAudience = Boolean(o.linkedinChatId || o.linkedinProfileUrl || o.linkedinPublicId);
          const hasTemplate = Boolean(o.liTemplateType || o.liTemplateName);
          ok = hasAudience && hasTemplate;
        }
        return <span className="sr-only">{ok ? "yes" : "no"}</span>;
      },
      size: 0,
      minSize: 0,
      maxSize: 0,
      enableHiding: true,
    },
    {
      accessorKey: "calls",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={primaryLabel} />
      ),
      cell: ({ getValue }) => <span className="tabular-nums">{String(getValue())}</span>,
      enableColumnFilter: true,
      filterFn: (row, id, value) => {
        const n = Number(row.getValue(id) ?? 0);
        const [min, max] = Array.isArray(value) ? value : [];
        const lo = typeof min === "number" ? min : -Infinity;
        const hi = typeof max === "number" ? max : Infinity;
        return n >= lo && n <= hi;
      },
      meta: { label: primaryLabel, variant: "range" },
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
        const [min, max] = Array.isArray(value) ? value : [];
        const lo = typeof min === "number" ? min : -Infinity;
        const hi = typeof max === "number" ? max : Infinity;
        return n >= lo && n <= hi;
      },
      meta: { label: "Queued", variant: "range" },
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
        const [min, max] = Array.isArray(value) ? value : [];
        const lo = typeof min === "number" ? min : -Infinity;
        const hi = typeof max === "number" ? max : Infinity;
        return n >= lo && n <= hi;
      },
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
          { label: "Missed", value: "missed" },
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
    // Last sent at (fallback to startDate)
    {
      id: "lastSentAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Sent" />
      ),
      enableColumnFilter: true,
      meta: { label: "Last Sent", variant: "dateRange" },
      filterFn: (row, id, value) => {
        const raw = String((row.original as any).lastSentAt ?? (row.original as any).startDate ?? "");
        const ts = raw ? new Date(raw).getTime() : NaN;
        const [start, end] = Array.isArray(value) ? value : [];
        const lo = start ? new Date(start as string).getTime() : -Infinity;
        const hi = end ? new Date(end as string).getTime() : Infinity;
        return Number.isNaN(ts) ? false : ts >= lo && ts <= hi;
      },
      cell: ({ row }) => {
        const o: any = row.original;
        const raw = o.lastSentAt ?? o.startDate;
        const d = new Date(String(raw));
        return (
          <span className="tabular-nums">
            {Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString()}
          </span>
        );
      },
      size: 140,
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      enableColumnFilter: true,
      meta: { label: "Start Date", variant: "dateRange" },
      filterFn: (row, id, value) => {
        const raw = String(row.getValue(id) ?? "");
        const ts = raw ? new Date(raw).getTime() : NaN;
        const [start, end] = Array.isArray(value) ? value : [];
        const lo = start ? new Date(start as string).getTime() : -Infinity;
        const hi = end ? new Date(end as string).getTime() : Infinity;
        return Number.isNaN(ts) ? false : ts >= lo && ts <= hi;
      },
      cell: ({ getValue }) => {
        const d = new Date(String(getValue()));
        return (
          <span className="tabular-nums">
            {Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString()}
          </span>
        );
      },
    },
  ];
}
