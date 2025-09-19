import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../../../components/data-table/data-table-column-header";
import { Badge } from "../../../components/ui/badge";
import { selectColumn } from "./build-columns/SelectColumn";
import { controlsColumn } from "./build-columns/ControlsColumn";
import { feedbackColumn } from "./build-columns/FeedbackColumn";
import { subscribersColumn } from "./build-columns/SubscribersColumn";
import { audienceColumn } from "./build-columns/AudienceColumn";
import { flowTemplateColumn } from "./build-columns/FlowTemplateColumn";
import { linkedInSummaryColumn } from "./build-columns/LinkedInSummaryColumn";
import { growthToolsColumn } from "./build-columns/GrowthToolsColumn";
import { workflowsColumn } from "./build-columns/WorkflowsColumn";
import { progressColumn } from "./build-columns/ProgressColumn";
import { transferColumn } from "./build-columns/TransferColumn";
import { 
  dateRangeFilterFn, 
  numberRangeFilterFn, 
  selectFilterFn, 
  canSendAccessorFn,
  canSendFilterFn
} from "./columnUtils";
import type { SocialRow } from "./build-columns/types";

// Using SocialRow from centralized build-columns/types

export function buildSocialColumns(): ColumnDef<SocialRow>[] {
  const primaryLabel = "Actions";
  return [
    selectColumn,
    controlsColumn,
    feedbackColumn,
    subscribersColumn,
    // Platform badge (facebook/linkedin)
    {
      accessorKey: "platform",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Platform" />
      ),
      enableColumnFilter: true,
      filterFn: selectFilterFn,
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
        const variant =
          v === "facebook"
            ? "default"
            : v === "linkedin"
              ? "secondary"
              : "outline";
        const label =
          v === "facebook" ? "Facebook" : v === "linkedin" ? "LinkedIn" : "-";
        const badgeVariant: React.ComponentProps<typeof Badge>["variant"] = variant as React.ComponentProps<typeof Badge>["variant"];
        return <Badge variant={badgeVariant}>{label}</Badge>;
      },
      size: 120,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Campaign Name" />
      ),
      enableColumnFilter: true,
      meta: {
        label: "Campaign Name",
        variant: "text",
        placeholder: "Search name",
      },
    },
    flowTemplateColumn,
    audienceColumn,
    linkedInSummaryColumn,
    growthToolsColumn,
    workflowsColumn,
    progressColumn,
    // Hidden computed: Can Send
    {
      id: "canSend",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Can Send" />
      ),
      enableColumnFilter: true,
      accessorFn: canSendAccessorFn,
      filterFn: canSendFilterFn,
      meta: {
        label: "Can Send",
        variant: "select",
        options: [
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ],
      },
      cell: ({ row }) => {
        const o = row.original;
        const platform = o.platform as string | undefined;
        let ok = false;
        if (platform === "facebook") {
          const hasAudience = Boolean(
            o.facebookSubscriberId || o.facebookExternalId,
          );
          const hasFlow = Boolean(o.manychatFlowId || o.manychatFlowName);
          ok = hasAudience && hasFlow;
        } else if (platform === "linkedin") {
          const hasAudience = Boolean(
            o.linkedinChatId || o.linkedinProfileUrl || o.linkedinPublicId,
          );
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
      cell: ({ getValue }) => (
        <span className="tabular-nums">{String(getValue())}</span>
      ),
      enableColumnFilter: true,
      filterFn: numberRangeFilterFn,
      meta: { label: primaryLabel, variant: "range" },
    },
    {
      accessorKey: "inQueue",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Queued" />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{String(getValue())}</span>
      ),
      enableColumnFilter: true,
      filterFn: numberRangeFilterFn,
      meta: { label: "Queued", variant: "range" },
    },
    {
      accessorKey: "leads",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Leads" />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{String(getValue())}</span>
      ),
      enableColumnFilter: true,
      filterFn: numberRangeFilterFn,
      meta: { label: "Leads", variant: "range" },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      enableColumnFilter: true,
      filterFn: selectFilterFn,
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
    transferColumn,
    {
      accessorKey: "transfers",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Transfers" />
      ),
      cell: ({ getValue }) => (
        <span className="tabular-nums">{String(getValue() ?? 0)}</span>
      ),
      enableColumnFilter: true,
      filterFn: numberRangeFilterFn,
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
      filterFn: dateRangeFilterFn,
      cell: ({ row }) => {
        const o = row.original;
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
      filterFn: dateRangeFilterFn,
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
