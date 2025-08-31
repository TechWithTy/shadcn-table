"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "../components/data-table/data-table";
import { DataTableToolbar } from "../components/data-table/data-table-toolbar";
// Modal moved into internal component
import { DataTableExportButton } from "../components/data-table/data-table-export-button";
import { Input } from "../components/ui/input";
import { useDataTable } from "../hooks/use-data-table";
import { Button } from "../components/ui/button";
import { AiActions } from "./Phone/call/components/AiActions";
import { CallDetailsModal } from "./Phone/call/components/CallDetailsModal";
import { useRowCarousel } from "../hooks/use-row-carousel";
import { SummaryCard } from "./Phone/call/components/SummaryCard";
import { StatusQuickActions } from "./Phone/call/components/StatusQuickActions";
import { buildCallCampaignColumns, type CampaignType } from "./Phone/call/utils/buildColumns";
import CampaignModalMain from "./campaigns/modal/CampaignModalMain";

import { type CallCampaign } from "../../../../types/_dashboard/campaign";
import {
  generateCallCampaignData,
  mockCallCampaignData,
} from "../../../../constants/_faker/calls/callCampaign";

// CampaignType comes from buildColumns

type ParentTab = "calls" | "text" | "social" | "directMail";

export default function CallCampaignsDemoTable({
  onNavigate,
}: {
  onNavigate?: (tab: ParentTab) => void;
}) {
  const [data, setData] = React.useState<CallCampaign[]>([]);
  const [query, setQuery] = React.useState("");
  const [detailIndex, setDetailIndex] = React.useState(0);
  const [campaignType, setCampaignType] = React.useState<CampaignType>("Calls");
  const [dateChip, setDateChip] = React.useState<"today" | "7d" | "30d">("today");
  const [createOpen, setCreateOpen] = React.useState(false);
  // In-memory DNC list keyed by campaign id or name for demo purposes
  const [dncSet, setDncSet] = React.useState<Set<string>>(new Set());
  const [dncFilter, setDncFilter] = React.useState<"all" | "only" | "hide">("all");

  const getKey = React.useCallback((r: CallCampaign) => (r as unknown as { id?: string }).id ?? r.name, []);

  // Avoid hydration mismatch: only generate data on the client
  React.useEffect(() => {
    const d = (mockCallCampaignData as CallCampaign[] | false) || generateCallCampaignData();
    setData(d);
  }, []);

  // Build columns dynamically based on selected campaign type (internal util)
  const columns = React.useMemo<ColumnDef<CallCampaign>[]>(
    () => buildCallCampaignColumns(campaignType),
    [campaignType],
  );

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    const byQuery = !q
      ? data
      : data.filter((r) =>
          [r.name, r.status, String(r.calls), String(r.leads), String(r.inQueue)]
            .filter(Boolean)
            .map((v) => String(v).toLowerCase())
            .some((s) => s.includes(q)),
        );
    if (dncFilter === "only") return byQuery.filter((r) => dncSet.has(getKey(r)));
    if (dncFilter === "hide") return byQuery.filter((r) => !dncSet.has(getKey(r)));
    return byQuery;
  }, [data, query, dncFilter, dncSet, getKey]);

  const pageSize = 10;
  // useDataTable is optional; DataTable supports being driven by a table instance.
  // For parity with the other example, we'll use the same pattern.
  const { table } = useDataTable<CallCampaign>({
    data: filtered,
    columns,
    pageCount: Math.max(1, Math.ceil(filtered.length / pageSize)),
    initialState: {
      pagination: { pageIndex: 0, pageSize },
      columnPinning: { left: ["select"], right: [] },
      columnOrder: [
        "select",
        "name",
        // default order for Calls; will be updated via effect for other types
        "calls",
        "inQueue",
        "leads",
        "status",
        "transfer",
        "transfers",
        "startDate",
        "playback",
      ],
    },
    enableColumnPinning: true,
  });

  // Ensure playback is NOT pinned; if any state re-adds it, remove it.
  React.useEffect(() => {
    const current = table.getState().columnPinning;
    const nextRight = (current.right ?? []).filter((id) => id !== "playback");
    if (nextRight.length !== (current.right ?? []).length) {
      table.setColumnPinning({ left: current.left ?? ["select"], right: nextRight });
    }
    table.getColumn("playback")?.pin(false as unknown as "left" | "right");
  }, [campaignType, table, columns]);

  // Ensure column order matches selected campaign type
  React.useEffect(() => {
    const isText = campaignType === "Text";
    const textOrder = [
      "select",
      "name",
      "sent",
      "delivered",
      "failed",
      "totalMessages",
      "status",
      "startDate",
      "lastMessageAt",
      "download",
    ];
    const callsOrder = [
      "select",
      "name",
      "calls",
      "inQueue",
      "leads",
      "status",
      "transfer",
      "transfers",
      // Vapi call details
      "transport",
      "provider",
      "callStatus",
      "costTotal",
      "startedAt",
      "endedAt",
      // existing date and playback columns
      "startDate",
      "playback",
    ];
    const desired = isText ? textOrder : callsOrder;
    table.setColumnOrder(desired);
  }, [campaignType, table]);

  const carousel = useRowCarousel(table, { loop: true });

  React.useEffect(() => {
    if (carousel.open) setDetailIndex(0);
  }, [carousel.open, carousel.index]);

  // Status quick actions and AI helpers are encapsulated in internal components

  return (
    <main className="container mx-auto max-w-7xl p-6 space-y-6">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Campaigns Demo</h1>
            <p className="text-sm text-muted-foreground">Search, selection, filtering, and details.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={campaignType === "Calls" ? "default" : "outline"}
              size="sm"
              onClick={() => (onNavigate ? onNavigate("calls") : setCampaignType("Calls"))}
            >
              Calls
            </Button>
            <Button
              type="button"
              variant={campaignType === "Text" ? "default" : "outline"}
              size="sm"
              onClick={() => (onNavigate ? onNavigate("text") : setCampaignType("Text"))}
            >
              Text
            </Button>
            <Button
              type="button"
              variant={campaignType === "Social" ? "default" : "outline"}
              size="sm"
              onClick={() => (onNavigate ? onNavigate("social") : setCampaignType("Social"))}
            >
              Social
            </Button>
            <Button
              type="button"
              variant={campaignType === "Direct Mail" ? "default" : "outline"}
              size="sm"
              onClick={() => (onNavigate ? onNavigate("directMail") : setCampaignType("Direct Mail"))}
            >
              Direct Mail
            </Button>
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>Create Campaign</Button>
          </div>
        </div>
      </header>

      <SummaryCard table={table} campaignType={campaignType} dateChip={dateChip} setDateChip={setDateChip} />

      <DataTable<CallCampaign>
        table={table}
        className="mt-2"
        onRowClick={(row) => {
          setDetailIndex(0);
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
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                const next = new Set(dncSet);
                table.getFilteredSelectedRowModel().rows.forEach((r) => next.add(getKey(r.original as CallCampaign)));
                setDncSet(next);
                table.resetRowSelection();
              }}
            >
              Add to DNC
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                const next = new Set(dncSet);
                table.getFilteredSelectedRowModel().rows.forEach((r) => next.delete(getKey(r.original as CallCampaign)));
                setDncSet(next);
                table.resetRowSelection();
              }}
            >
              Remove from DNC
            </Button>
            <AiActions table={table} />
            <DataTableExportButton
              table={table}
              filename="call-campaigns"
              excludeColumns={["select"]}
            />
          </div>
        }
      >
        <DataTableToolbar table={table} className="mb-3 md:mb-4">
          <Input
            aria-label="Global search"
            placeholder="Search campaigns..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 w-64"
          />
          <div className="hidden md:flex items-center gap-1">
            <StatusQuickActions table={table} />
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" size="sm" variant={dncFilter === "all" ? "default" : "outline"} onClick={() => setDncFilter("all")}>
              DNC: All
            </Button>
            <Button type="button" size="sm" variant={dncFilter === "only" ? "default" : "outline"} onClick={() => setDncFilter("only")}>
              DNC: Only
            </Button>
            <Button type="button" size="sm" variant={dncFilter === "hide" ? "default" : "outline"} onClick={() => setDncFilter("hide")}>
              DNC: Hide
            </Button>
          </div>
          <AiActions table={table} />
          <DataTableExportButton
            table={table}
            filename="call-campaigns"
            excludeColumns={["select"]}
          />
        </DataTableToolbar>
      </DataTable>

      <CallDetailsModal
        table={table}
        open={carousel.open}
        setOpen={carousel.setOpen}
        index={carousel.index}
        setIndex={carousel.setIndex}
        detailIndex={detailIndex}
        setDetailIndex={setDetailIndex}
      />
      <CampaignModalMain open={createOpen} onOpenChange={setCreateOpen} defaultChannel="call" />
    </main>
  );
}
