"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "../components/data-table/data-table";
import { DataTableToolbar } from "../components/data-table/data-table-toolbar";
import { DataTableRowModalCarousel } from "../components/data-table/data-table-row-modal-carousel";
import { Input } from "../components/ui/input";
import { useDataTable } from "../hooks/use-data-table";
import { useRowCarousel } from "../hooks/use-row-carousel";
import { SummaryCard, type DateChip } from "./Social/components/SummaryCard";
import { Button } from "../components/ui/button";
import { ActionBar } from "./Social/components/ActionBar";
import { AIDialog } from "./Social/components/AIDialog";
import { buildSocialColumns } from "./Social/utils/buildColumns";
import { summarizeRows } from "./Social/utils/summarize";

import { type CallCampaign } from "../../../../types/_dashboard/campaign";
import {
  generateCallCampaignData,
  mockCallCampaignData,
} from "../../../../constants/_faker/calls/callCampaign";

type ParentTab = "calls" | "text" | "social" | "directMail";

export default function SocialCampaignsDemoTable({
  onNavigate,
}: {
  onNavigate?: (tab: ParentTab) => void;
}) {
  const [data, setData] = React.useState<CallCampaign[]>([]);
  const [query, setQuery] = React.useState("");
  const [aiOpen, setAiOpen] = React.useState(false);
  const [aiRows, setAiRows] = React.useState<CallCampaign[]>([]);
  const [detailIndex, setDetailIndex] = React.useState(0);
  const campaignType = "Social" as const;
  const [dateChip, setDateChip] = React.useState<DateChip>("today");

  React.useEffect(() => {
    const base = (mockCallCampaignData as CallCampaign[] | false) || generateCallCampaignData();
    // Enrich with social-specific fields for demo (platform + identifiers)
    const enriched = base.map((r) => {
      const isFacebook = Math.random() < 0.5;
      if (isFacebook) {
        const fb = {
          platform: "facebook",
          manychatFlowId: Math.random() < 0.7 ? `flow_${Math.floor(Math.random() * 9000 + 1000)}` : undefined,
          manychatFlowName: Math.random() < 0.9 ? `Welcome Flow ${Math.floor(Math.random() * 10 + 1)}` : undefined,
          facebookSubscriberId: Math.random() < 0.8 ? `sub_${Math.floor(Math.random() * 1_000_000)}` : undefined,
          facebookExternalId: Math.random() < 0.3 ? `${Math.floor(Math.random() * 1_000_000)}` : undefined,
          lastSentAt: Math.random() < 0.6 ? new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000).toISOString() : undefined,
          queued: Math.floor(Math.random() * 5),
          sent: Math.floor(Math.random() * 20),
          delivered: Math.floor(Math.random() * 20),
          failed: Math.floor(Math.random() * 3),
        } as Record<string, unknown>;
        return ({ ...r, ...fb }) as unknown as CallCampaign;
      }
      const liTypes = ["DM", "Invite", "InMail"] as const;
      const li = {
        platform: "linkedin",
        liTemplateType: liTypes[Math.floor(Math.random() * liTypes.length)],
        liTemplateName: `Template ${Math.floor(Math.random() * 5) + 1}`,
        linkedinChatId: Math.random() < 0.6 ? `li_chat_${Math.floor(Math.random() * 1_000_000)}` : undefined,
        linkedinProfileUrl: Math.random() < 0.4 ? `https://www.linkedin.com/in/user${Math.floor(Math.random() * 10000)}/` : undefined,
        linkedinPublicId: Math.random() < 0.2 ? `user${Math.floor(Math.random() * 10000)}` : undefined,
        lastSentAt: Math.random() < 0.6 ? new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000).toISOString() : undefined,
        queued: Math.floor(Math.random() * 5),
        sent: Math.floor(Math.random() * 20),
        delivered: Math.floor(Math.random() * 20),
        failed: Math.floor(Math.random() * 3),
      } as Record<string, unknown>;
      return ({ ...r, ...li }) as unknown as CallCampaign;
    });
    setData(enriched);
  }, []);

  const columns = React.useMemo<ColumnDef<CallCampaign>[]>(() => buildSocialColumns(), []);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((r) =>
      [r.name, r.status, String(r.calls), String(r.leads), String(r.inQueue)]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .some((s) => s.includes(q)),
    );
  }, [data, query]);

  const pageSize = 10;
  const { table } = useDataTable<CallCampaign>({
    data: filtered,
    columns,
    pageCount: Math.max(1, Math.ceil(filtered.length / pageSize)),
    initialState: {
      pagination: { pageIndex: 0, pageSize },
      columnPinning: { left: ["select"], right: [] },
      columnOrder: [
        "select",
        "platform",
        "name",
        "flowTemplate",
        "audience",
        "progress",
        "calls",
        "inQueue",
        "leads",
        "status",
        "transfer",
        "transfers",
        "canSend",
        "lastSentAt",
        "startDate",
      ],
      columnVisibility: {
        canSend: false,
      },
    },
    enableColumnPinning: true,
  });

  const carousel = useRowCarousel(table, { loop: true });

  React.useEffect(() => {
    if (carousel.open) setDetailIndex(0);
  }, [carousel.open, carousel.index]);

  function getSelectedRows(): CallCampaign[] {
    return table.getFilteredSelectedRowModel().rows.map((r) => r.original as CallCampaign);
  }

  function getAllRows(): CallCampaign[] {
    return table.getFilteredRowModel().rows.map((r) => r.original as CallCampaign);
  }

  return (
    <main className="container mx-auto max-w-7xl p-6 space-y-6">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Social Campaigns</h1>
            <p className="text-sm text-muted-foreground">Search, selection, filtering, and details.</p>
          </div>
          {onNavigate && (
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("calls")}>Calls</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("text")}>Text</Button>
              <Button type="button" variant="default" size="sm" onClick={() => onNavigate("social")}>Social</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("directMail")}>Direct Mail</Button>
            </div>
          )}
        </div>
      </header>
      <SummaryCard filtered={filtered} campaignType={campaignType} dateChip={dateChip} setDateChip={setDateChip} />

      <DataTable<CallCampaign>
        table={table}
        className="mt-2"
        onRowClick={(row) => {
          setDetailIndex(0);
          carousel.openAt(row);
        }}
        actionBar={
          <ActionBar
            table={table}
            getSelectedRows={getSelectedRows}
            getAllRows={getAllRows}
            setAiRows={setAiRows}
            setAiOpen={setAiOpen}
          />
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
          <ActionBar
            table={table}
            getSelectedRows={getSelectedRows}
            getAllRows={getAllRows}
            setAiRows={setAiRows}
            setAiOpen={setAiOpen}
          />
        </DataTableToolbar>
      </DataTable>

      <AIDialog open={aiOpen} onOpenChange={setAiOpen} rows={aiRows} summarize={summarizeRows} />

      <DataTableRowModalCarousel
        table={table}
        open={carousel.open}
        onOpenChange={carousel.setOpen}
        index={carousel.index}
        setIndex={carousel.setIndex}
        rows={carousel.rows}
        onPrev={() => setDetailIndex((i) => Math.max(0, i - 1))}
        onNext={() => setDetailIndex((i) => i + 1)}
        title={(row) => row.original.name}
        description={(row) => `Started: ${new Date(row.original.startDate).toLocaleDateString()}`}
        counter={() => `-`}
        render={() => <div className="text-muted-foreground">No playback for Social campaigns</div>}
      />
    </main>
  );
}
