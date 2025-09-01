import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../../../components/data-table/data-table-column-header";
import { Checkbox } from "../../../components/ui/checkbox";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { Input } from "../../../components/ui/input";
import { Pause, Play, Square, ThumbsDown, ThumbsUp } from "lucide-react";
import { stopRowClick, withStopPropagation } from "../../../utils/events";
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
    // Controls: Pause/Resume and Stop
    {
      id: "controls",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Controls" />
      ),
      cell: ({ row, table }) => {
        const r: any = row.original;
        const status = String(r.status ?? "");
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
              size="icon"
              variant="outline"
              aria-label={isPaused ? "Resume" : "Pause"}
              disabled={!canControl}
              onClick={withStopPropagation(() => {
                if (!canControl) return;
                if (isPaused) meta.onResume?.(r);
                else meta.onPause?.(r);
              })}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="Stop"
              disabled={!canControl}
              onClick={withStopPropagation(() => {
                if (!canControl) return;
                meta.onStop?.(r);
              })}
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
        );
      },
      enableSorting: false,
      size: 92,
    },
    // Feedback: thumbs up/down + note popover (completed only)
    {
      id: "feedback",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Feedback" />
      ),
      cell: ({ row, table }) => {
        const r: any = row.original;
        const status = String(r.status ?? "");
        const isCompleted = status === "completed";
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
                  disabled={!isCompleted}
                  onClick={withStopPropagation(() => {
                    if (!isCompleted) return;
                    meta.onToggleFeedback?.(r, "up");
                  })}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              {isCompleted ? (
                <PopoverContent align="start" className="w-64" onClick={stopRowClick}>
                  <Input
                    placeholder={`Why did you ${upActive ? "like" : "like"} "${name}"?`}
                    value={fb.note}
                    onChange={(e) => meta.onFeedbackNoteChange?.(r, e.target.value)}
                  />
                </PopoverContent>
              ) : null}
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Thumbs down"
                  className={downActive ? "text-red-600 border-red-500" : ""}
                  disabled={!isCompleted}
                  onClick={withStopPropagation(() => {
                    if (!isCompleted) return;
                    meta.onToggleFeedback?.(r, "down");
                  })}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              {isCompleted ? (
                <PopoverContent align="start" className="w-64" onClick={stopRowClick}>
                  <Input
                    placeholder={`Why did you ${downActive ? "dislike" : "dislike"} "${name}"?`}
                    value={fb.note}
                    onChange={(e) => meta.onFeedbackNoteChange?.(r, e.target.value)}
                  />
                </PopoverContent>
              ) : null}
            </Popover>
          </div>
        );
      },
      enableSorting: false,
      size: 120,
    },
    // Subscribers — facebook only
    {
      id: "subscribers",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Subscribers" />
      ),
      meta: { label: "Subscribers", variant: "text" },
      cell: ({ row }) => {
        const o: any = row.original;
        if (o.platform !== "facebook") return <span>-</span>;
        const subs: Array<{
          id: string;
          name: string;
          email?: string;
          phone?: string;
          tags?: Array<{ id: number; name: string }>;
          lastSeen?: string;
          lastInteraction?: string;
        }> = o.subscribers || [];
        const count = subs.length;
        return (
          <div className="flex items-center gap-1 flex-wrap max-w-[260px]">
            <Badge variant="secondary">{count}</Badge>
            {subs.slice(0, 3).map((s) => {
              const parts: string[] = [
                `ID: ${s.id}`,
                s.email ? `Email: ${s.email}` : undefined,
                s.phone ? `Phone: ${s.phone}` : undefined,
                Array.isArray(s.tags) && s.tags.length ? `Tags: ${s.tags.map((t) => t.name).join(', ')}` : undefined,
                s.lastSeen ? `Last seen: ${s.lastSeen}` : undefined,
                s.lastInteraction ? `Last interaction: ${s.lastInteraction}` : undefined,
              ].filter(Boolean) as string[];
              const title = parts.join('\n');
              return (
                <Badge key={s.id} variant="outline" title={title || s.id}>
                  {s.name}
                </Badge>
              );
            })}
            {count > 3 ? <span className="text-xs text-muted-foreground">+{count - 3} more</span> : null}
          </div>
        );
      },
      size: 260,
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
    // LinkedIn Summary (messages, attachments by type, reactions) — linkedin only
    {
      id: "liSummary",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="LinkedIn" />
      ),
      meta: { label: "LinkedIn", variant: "text" },
      cell: ({ row }) => {
        const o: any = row.original;
        if (o.platform !== "linkedin") return <span>-</span>;
        const items: any[] = Array.isArray(o.interactionsDetails) ? o.interactionsDetails : [];
        const li = items.filter((it) => it && it.linkedinMessage);
        const msgCount = li.length;
        const attCounts = li.reduce((acc: Record<string, number>, it: any) => {
          const atts: any[] = (it.linkedinMessage?.attachments as any[]) || [];
          atts.forEach((a: any) => {
            const t = String(a?.type || "unknown");
            acc[t] = (acc[t] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>);
        const totalReactions = li.reduce((sum: number, it: any) => sum + (((it.linkedinMessage?.reactions as any[]) || []).length), 0);
        const attTitle = Object.entries(attCounts)
          .map(([t, n]) => `${t}: ${n}`)
          .join("\n");
        return (
          <div className="flex items-center gap-1 flex-wrap max-w-[280px]">
            <Badge variant="secondary" title="LinkedIn messages with payload">Msgs: {msgCount}</Badge>
            {Object.keys(attCounts).length > 0 ? (
              <Badge variant="outline" title={attTitle || "Attachments"}>
                Att: {Object.values(attCounts).reduce((a, b) => a + b, 0)}
              </Badge>
            ) : (
              <Badge variant="outline">Att: 0</Badge>
            )}
            {totalReactions > 0 ? (
              <Badge variant="outline" title="Total reactions across messages">Reacts: {totalReactions}</Badge>
            ) : null}
          </div>
        );
      },
      size: 300,
    },
    // Growth Tools (ManyChat) — facebook only
    {
      id: "growthTools",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Growth Tools" />
      ),
      meta: { label: "Growth Tools", variant: "text" },
      cell: ({ row }) => {
        const o: any = row.original;
        if (o.platform !== "facebook") return <span>-</span>;
        const tools: Array<{ id: number; name: string; type: string }> = o.manychatGrowthTools || [];
        const count = tools.length;
        return (
          <div className="flex items-center gap-1 flex-wrap max-w-[260px]">
            <Badge variant="secondary">{count}</Badge>
            {tools.slice(0, 3).map((t) => (
              <Badge key={t.id} variant="outline" title={`${t.name} (${t.type})`}>
                {t.name}
              </Badge>
            ))}
            {count > 3 ? <span className="text-xs text-muted-foreground">+{count - 3} more</span> : null}
          </div>
        );
      },
      size: 280,
    },
    // Workflows (ManyChat Flows) — facebook only
    {
      id: "workflows",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Workflows" />
      ),
      meta: { label: "Workflows", variant: "text" },
      cell: ({ row }) => {
        const o: any = row.original;
        if (o.platform !== "facebook") return <span>-</span>;
        const flows: Array<{ ns: string; name: string; folder_id?: number }> = o.manychatFlows || [];
        const count = flows.length;
        return (
          <div className="flex items-center gap-1 flex-wrap max-w-[260px]">
            <Badge variant="secondary">{count}</Badge>
            {flows.slice(0, 3).map((f) => (
              <Badge key={f.ns} variant="outline" title={f.ns}>
                {f.name}
              </Badge>
            ))}
            {count > 3 ? <span className="text-xs text-muted-foreground">+{count - 3} more</span> : null}
          </div>
        );
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
