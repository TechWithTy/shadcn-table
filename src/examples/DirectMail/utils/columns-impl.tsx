import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../../../components/data-table/data-table-column-header";
import { Checkbox } from "../../../components/ui/checkbox";
import { Badge } from "../../../components/ui/badge";
import type { DirectMailCampaign } from "./mock";

export function buildDirectMailColumns(primaryLabel = "Mailers"): ColumnDef<DirectMailCampaign>[] {
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
    {
      id: "transfer",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Transfer" />
      ),
      enableColumnFilter: true,
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
      meta: { label: "Transfers", variant: "range" },
      size: 110,
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Start Date" />
      ),
      enableColumnFilter: true,
      meta: { label: "Start Date", variant: "date" },
      cell: ({ getValue }) => {
        const d = new Date(String(getValue()));
        return (
          <span className="tabular-nums">
            {isNaN(d.getTime()) ? "-" : d.toLocaleDateString()}
          </span>
        );
      },
    },
    // Hidden by default: Lob postcard core fields
    {
      id: "lob_id",
      accessorFn: (row) => row.lob?.id ?? null,
      header: ({ column }) => <DataTableColumnHeader column={column} title="LOB ID" />,
      meta: { label: "LOB ID", variant: "text", placeholder: "Search LOB ID" },
    },
    {
      id: "lob_url",
      accessorFn: (row) => row.lob?.url ?? null,
      header: ({ column }) => <DataTableColumnHeader column={column} title="LOB URL" />,
      meta: { label: "LOB URL", variant: "text", placeholder: "Search URL" },
    },
    {
      id: "lob_carrier",
      accessorFn: (row) => row.lob?.carrier ?? null,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Carrier" />,
      meta: { label: "Carrier", variant: "select" },
    },
    {
      id: "lob_front_template_id",
      accessorFn: (row) => (row.lob && row.lob.object === "postcard" ? (row.lob as any).front_template_id ?? null : null),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Front Template" />,
      meta: { label: "Front Template", variant: "text" },
    },
    {
      id: "lob_back_template_id",
      accessorFn: (row) => (row.lob && row.lob.object === "postcard" ? (row.lob as any).back_template_id ?? null : null),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Back Template" />,
      meta: { label: "Back Template", variant: "text" },
    },
    {
      id: "lob_date_created",
      accessorFn: (row) => row.lob?.date_created ?? null,
      header: ({ column }) => <DataTableColumnHeader column={column} title="LOB Created" />,
      meta: { label: "LOB Created", variant: "date" },
    },
    {
      id: "lob_date_modified",
      accessorFn: (row) => row.lob?.date_modified ?? null,
      header: ({ column }) => <DataTableColumnHeader column={column} title="LOB Modified" />,
      meta: { label: "LOB Modified", variant: "date" },
    },
    {
      id: "lob_send_date",
      accessorFn: (row) => row.lob?.send_date ?? null,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Send Date" />,
      meta: { label: "Send Date", variant: "date" },
    },
    {
      id: "lob_use_type",
      accessorFn: (row) => row.lob?.use_type ?? null,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Use Type" />,
      meta: { label: "Use Type", variant: "text" },
    },
    {
      id: "lob_fsc",
      accessorFn: (row) => row.lob?.fsc ?? null,
      header: ({ column }) => <DataTableColumnHeader column={column} title="FSC" />,
      meta: { label: "FSC", variant: "select" },
    },
    {
      id: "lob_sla",
      accessorFn: (row) => row.lob?.sla ?? null,
      header: ({ column }) => <DataTableColumnHeader column={column} title="SLA" />,
      meta: { label: "SLA", variant: "text" },
    },
    {
      id: "lob_object",
      accessorFn: (row) => row.lob?.object ?? null,
      header: ({ column }) => <DataTableColumnHeader column={column} title="LOB Object" />,
      meta: { label: "LOB Object", variant: "text" },
    },
    // Hidden by default: Lob 'to' address fields
    {
      id: "lob_to_id",
      accessorFn: (row) => row.lob?.to?.id ?? null,
      header: ({ column }) => <DataTableColumnHeader column={column} title="To ID" />,
      meta: { label: "To ID", variant: "text" },
    },
    { id: "lob_to_company", accessorFn: (row) => row.lob?.to?.company ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="To Company" />, meta: { label: "To Company", variant: "text" } },
    { id: "lob_to_name", accessorFn: (row) => row.lob?.to?.name ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="To Name" />, meta: { label: "To Name", variant: "text" } },
    { id: "lob_to_phone", accessorFn: (row) => row.lob?.to?.phone ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="To Phone" />, meta: { label: "To Phone", variant: "text" } },
    { id: "lob_to_email", accessorFn: (row) => row.lob?.to?.email ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="To Email" />, meta: { label: "To Email", variant: "text" } },
    { id: "lob_to_address_line1", accessorFn: (row) => row.lob?.to?.address_line1 ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="Address 1" />, meta: { label: "Address 1", variant: "text" } },
    { id: "lob_to_address_line2", accessorFn: (row) => row.lob?.to?.address_line2 ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="Address 2" />, meta: { label: "Address 2", variant: "text" } },
    { id: "lob_to_address_city", accessorFn: (row) => row.lob?.to?.address_city ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="City" />, meta: { label: "City", variant: "text" } },
    { id: "lob_to_address_state", accessorFn: (row) => row.lob?.to?.address_state ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="State" />, meta: { label: "State", variant: "text" } },
    { id: "lob_to_address_zip", accessorFn: (row) => row.lob?.to?.address_zip ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="ZIP" />, meta: { label: "ZIP", variant: "text" } },
    { id: "lob_to_address_country", accessorFn: (row) => row.lob?.to?.address_country ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="Country" />, meta: { label: "Country", variant: "text" } },
    { id: "lob_to_date_created", accessorFn: (row) => row.lob?.to?.date_created ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="To Created" />, meta: { label: "To Created", variant: "date" } },
    { id: "lob_to_date_modified", accessorFn: (row) => row.lob?.to?.date_modified ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="To Modified" />, meta: { label: "To Modified", variant: "date" } },
    { id: "lob_to_object", accessorFn: (row) => row.lob?.to?.object ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="To Object" />, meta: { label: "To Object", variant: "text" } },
    // Hidden by default: LOB From-address fields
    { id: "lob_from_id", accessorFn: (row) => row.lob?.from?.id ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="From ID" />, meta: { label: "From ID", variant: "text" } },
    { id: "lob_from_name", accessorFn: (row) => row.lob?.from?.name ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="From Name" />, meta: { label: "From Name", variant: "text" } },
    { id: "lob_from_company", accessorFn: (row) => row.lob?.from?.company ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="From Company" />, meta: { label: "From Company", variant: "text" } },
    { id: "lob_from_phone", accessorFn: (row) => row.lob?.from?.phone ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="From Phone" />, meta: { label: "From Phone", variant: "text" } },
    { id: "lob_from_email", accessorFn: (row) => row.lob?.from?.email ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="From Email" />, meta: { label: "From Email", variant: "text" } },
    { id: "lob_from_address_line1", accessorFn: (row) => row.lob?.from?.address_line1 ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="From Address 1" />, meta: { label: "From Address 1", variant: "text" } },
    { id: "lob_from_address_line2", accessorFn: (row) => row.lob?.from?.address_line2 ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="From Address 2" />, meta: { label: "From Address 2", variant: "text" } },
    { id: "lob_from_address_city", accessorFn: (row) => row.lob?.from?.address_city ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="From City" />, meta: { label: "From City", variant: "text" } },
    { id: "lob_from_address_state", accessorFn: (row) => row.lob?.from?.address_state ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="From State" />, meta: { label: "From State", variant: "text" } },
    { id: "lob_from_address_zip", accessorFn: (row) => row.lob?.from?.address_zip ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="From ZIP" />, meta: { label: "From ZIP", variant: "text" } },
    { id: "lob_from_address_country", accessorFn: (row) => row.lob?.from?.address_country ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="From Country" />, meta: { label: "From Country", variant: "text" } },
    { id: "lob_from_date_created", accessorFn: (row) => row.lob?.from?.date_created ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="From Created" />, meta: { label: "From Created", variant: "date" } },
    { id: "lob_from_date_modified", accessorFn: (row) => row.lob?.from?.date_modified ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="From Modified" />, meta: { label: "From Modified", variant: "date" } },
    { id: "lob_from_object", accessorFn: (row) => row.lob?.from?.object ?? null, header: ({ column }) => <DataTableColumnHeader column={column} title="From Object" />, meta: { label: "From Object", variant: "text" } },
    // Hidden by default: LOB Snap Pack-specific fields
    { id: "lob_snap_outside_template_id", accessorFn: (row) => (row.lob && row.lob.object === "snap_pack" ? (row.lob as any).outside_template_id ?? null : null), header: ({ column }) => <DataTableColumnHeader column={column} title="Outside Template" />, meta: { label: "Outside Template", variant: "text" } },
    { id: "lob_snap_inside_template_id", accessorFn: (row) => (row.lob && row.lob.object === "snap_pack" ? (row.lob as any).inside_template_id ?? null : null), header: ({ column }) => <DataTableColumnHeader column={column} title="Inside Template" />, meta: { label: "Inside Template", variant: "text" } },
    { id: "lob_snap_inside_template_version_id", accessorFn: (row) => (row.lob && row.lob.object === "snap_pack" ? (row.lob as any).inside_template_version_id ?? null : null), header: ({ column }) => <DataTableColumnHeader column={column} title="Inside Version" />, meta: { label: "Inside Version", variant: "text" } },
    { id: "lob_snap_outside_template_version_id", accessorFn: (row) => (row.lob && row.lob.object === "snap_pack" ? (row.lob as any).outside_template_version_id ?? null : null), header: ({ column }) => <DataTableColumnHeader column={column} title="Outside Version" />, meta: { label: "Outside Version", variant: "text" } },
    { id: "lob_snap_size", accessorFn: (row) => (row.lob && row.lob.object === "snap_pack" ? (row.lob as any).size ?? null : null), header: ({ column }) => <DataTableColumnHeader column={column} title="Size" />, meta: { label: "Size", variant: "text" } },
    { id: "lob_snap_mail_type", accessorFn: (row) => (row.lob && row.lob.object === "snap_pack" ? (row.lob as any).mail_type ?? null : null), header: ({ column }) => <DataTableColumnHeader column={column} title="Mail Type" />, meta: { label: "Mail Type", variant: "text" } },
    { id: "lob_snap_expected_delivery_date", accessorFn: (row) => (row.lob && row.lob.object === "snap_pack" ? (row.lob as any).expected_delivery_date ?? null : null), header: ({ column }) => <DataTableColumnHeader column={column} title="Expected Delivery" />, meta: { label: "Expected Delivery", variant: "date" } },
    { id: "lob_snap_color", accessorFn: (row) => (row.lob && row.lob.object === "snap_pack" ? (row.lob as any).color ?? null : null), header: ({ column }) => <DataTableColumnHeader column={column} title="Color" />, meta: { label: "Color", variant: "select" } },
    // For thumbnails, expose first item large URL for quick reference
    { id: "lob_snap_thumbnail_large_1", accessorFn: (row) => (row.lob && row.lob.object === "snap_pack" ? (row.lob as any).thumbnails?.[0]?.large ?? null : null), header: ({ column }) => <DataTableColumnHeader column={column} title="Thumbnail (Large)" />, meta: { label: "Thumbnail (Large)", variant: "text" } },
    // Hidden by default: LOB Letter-specific fields
    { id: "lob_letter_template_id", accessorFn: (row) => (row.lob && row.lob.object === "letter" ? (row.lob as any).template_id ?? null : null), header: ({ column }) => <DataTableColumnHeader column={column} title="Letter Template" />, meta: { label: "Letter Template", variant: "text" } },
    { id: "lob_letter_envelope_type", accessorFn: (row) => (row.lob && row.lob.object === "letter" ? (row.lob as any).envelope_type ?? null : null), header: ({ column }) => <DataTableColumnHeader column={column} title="Envelope Type" />, meta: { label: "Envelope Type", variant: "text" } },
    { id: "lob_letter_page_count", accessorFn: (row) => (row.lob && row.lob.object === "letter" ? (row.lob as any).page_count ?? null : null), header: ({ column }) => <DataTableColumnHeader column={column} title="Page Count" />, meta: { label: "Page Count", variant: "range" } },
    { id: "lob_letter_color", accessorFn: (row) => (row.lob && row.lob.object === "letter" ? (row.lob as any).color ?? null : null), header: ({ column }) => <DataTableColumnHeader column={column} title="Color" />, meta: { label: "Color", variant: "select" } },
    { id: "lob_letter_double_sided", accessorFn: (row) => (row.lob && row.lob.object === "letter" ? (row.lob as any).double_sided ?? null : null), header: ({ column }) => <DataTableColumnHeader column={column} title="Double Sided" />, meta: { label: "Double Sided", variant: "select" } },
    { id: "lob_letter_address_placement", accessorFn: (row) => (row.lob && row.lob.object === "letter" ? (row.lob as any).address_placement ?? null : null), header: ({ column }) => <DataTableColumnHeader column={column} title="Address Placement" />, meta: { label: "Address Placement", variant: "text" } },
    { id: "lob_letter_return_envelope_included", accessorFn: (row) => (row.lob && row.lob.object === "letter" ? (row.lob as any).return_envelope_included ?? null : null), header: ({ column }) => <DataTableColumnHeader column={column} title="Return Envelope" />, meta: { label: "Return Envelope", variant: "select" } },
  ];
}
