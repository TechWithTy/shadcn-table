"use client";

import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "../components/data-table/data-table";
import { DataTableToolbar } from "../components/data-table/data-table-toolbar";
import { Input } from "../components/ui/input";
import { useDataTable } from "../hooks/use-data-table";
import { useRowCarousel } from "../hooks/use-row-carousel";
import { SummaryCard, type DateChip } from "./Social/components/SummaryCard";
import { Button } from "../components/ui/button";
import { ActionBar } from "./Social/components/ActionBar";
import { AIDialog } from "./Social/components/AIDialog";
import { buildSocialColumns } from "./Social/utils/buildColumns";
import { summarizeRows } from "./Social/utils/summarize";
import { SocialRowCarousel } from "./Social/components/SocialRowCarousel";
import { generateSocialCampaignData } from "./Social/utils/mock";
import CampaignModalMain from "./campaigns/modal/CampaignModalMain";

import { type CallCampaign } from "../../../../types/_dashboard/campaign";

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
  const [createOpen, setCreateOpen] = React.useState(false);
  const campaignType = "Social" as const;
  const [dateChip, setDateChip] = React.useState<DateChip>("today");
  // Per-row feedback (by id or name)
  const [feedback, setFeedback] = React.useState<Record<string, { sentiment: "up" | "down" | null; note: string }>>({});
  const getKey = React.useCallback((r: CallCampaign) => (r as any)?.id ?? r.name, []);

  React.useEffect(() => {
    setData(generateSocialCampaignData());
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
      // Important: "select" must always be the first column (pinned). "feedback" should come immediately after but NOT be pinned/sticky.
      columnPinning: { left: ["select"], right: [] },
      columnOrder: [
        "select",
        "feedback",
        "controls",
        "platform",
        "name",
        "flowTemplate",
        "audience",
        "liSummary",
        "subscribers",
        "growthTools",
        "workflows",
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
    // Controls + Feedback used by Social columns
    meta: {
      onPause: (row: CallCampaign) => {
        const key = getKey(row);
        setData((prev) => prev.map((r) => (getKey(r) === key ? { ...r, status: "paused" } : r)));
      },
      onResume: (row: CallCampaign) => {
        const key = getKey(row);
        setData((prev) => prev.map((r) => (getKey(r) === key ? { ...r, status: "queued" } : r)));
      },
      onStop: (row: CallCampaign) => {
        const key = getKey(row);
        setData((prev) => prev.map((r) => (getKey(r) === key ? { ...r, status: "completed" } : r)));
      },
      getFeedback: (row: CallCampaign) => feedback[getKey(row)],
      onToggleFeedback: (row: CallCampaign, s: "up" | "down") => {
        const key = getKey(row);
        setFeedback((prev) => {
          const cur = prev[key] ?? { sentiment: null, note: "" };
          const nextSentiment = cur.sentiment === s ? null : s;
          return { ...prev, [key]: { ...cur, sentiment: nextSentiment } };
        });
      },
      onFeedbackNoteChange: (row: CallCampaign, note: string) => {
        const key = getKey(row);
        setFeedback((prev) => {
          const cur = prev[key] ?? { sentiment: null, note: "" };
          return { ...prev, [key]: { ...cur, note } };
        });
      },
    },
  });

  const carousel = useRowCarousel(table, { loop: true });

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
          <div className="flex items-center gap-2">
            {onNavigate && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("calls")}>Calls</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("text")}>Text</Button>
                <Button type="button" variant="default" size="sm" onClick={() => onNavigate("social")}>Social</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("directMail")}>Direct Mail</Button>
              </>
            )}
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>Create Campaign</Button>
          </div>
        </div>
      </header>
      <SummaryCard filtered={filtered} campaignType={campaignType} dateChip={dateChip} setDateChip={setDateChip} />

      <DataTable<CallCampaign>
        table={table}
        className="mt-2"
        onRowClick={(row) => {
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

      <SocialRowCarousel
        table={table}
        open={carousel.open}
        setOpen={carousel.setOpen}
        index={carousel.index}
        setIndex={carousel.setIndex}
        rows={carousel.rows as any}
      />
      <CampaignModalMain open={createOpen} onOpenChange={setCreateOpen} defaultChannel="social" />
    </main>
  );
}
