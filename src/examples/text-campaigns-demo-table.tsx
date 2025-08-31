"use client";

import * as React from "react";
import { faker } from "@faker-js/faker";

import { DataTable } from "../components/data-table/data-table";
import { DataTableRowModalCarousel } from "../components/data-table/data-table-row-modal-carousel";
import { useDataTable } from "../hooks/use-data-table";
import { useRowCarousel } from "../hooks/use-row-carousel";
import { Button } from "../components/ui/button";
import CampaignModalMain from "./campaigns/modal/CampaignModalMain";

import { type CallCampaign } from "../../../../types/_dashboard/campaign";
import {
  generateCallCampaignData,
  mockCallCampaignData,
} from "../../../../constants/_faker/calls/callCampaign";
import { buildTextCampaignColumns } from "./Phone/text/utils/buildColumns";
import { TextRowCarousel } from "./Phone/text/components/TextRowCarousel";
import { SummaryCard } from "./Phone/text/components/SummaryCard";
import { AIDialog } from "./Phone/text/components/AIDialog";
import { ActionBar } from "./Phone/text/components/ActionBar";
import { TextTableToolbar } from "./Phone/text/components/TextTableToolbar";
import { getSelectedRowsFromTable, getAllRowsFromTable, summarizeRows } from "./Phone/text/utils/helpers";
import { generateSampleTextMessage } from "../../../../constants/_faker/texts/texts";

type ParentTab = "calls" | "text" | "social" | "directMail";

export default function TextCampaignsDemoTable({
  onNavigate,
}: {
  onNavigate?: (tab: ParentTab) => void;
}) {
  const [data, setData] = React.useState<CallCampaign[]>([]);
  const [query, setQuery] = React.useState("");
  const [aiOpen, setAiOpen] = React.useState(false);
  const [aiOutput, setAiOutput] = React.useState<string>("");
  const [aiRows, setAiRows] = React.useState<CallCampaign[]>([]);
  const [detailIndex, setDetailIndex] = React.useState(0);
  const [createOpen, setCreateOpen] = React.useState(false);
  const campaignType = "Text" as const;
  const [dateChip, setDateChip] = React.useState<"today" | "7d" | "30d">("today");

  React.useEffect(() => {
    const d = (mockCallCampaignData as CallCampaign[] | false) || generateCallCampaignData();
    // Enrich each row with a few text messages for device chip inference
    const withMessages = d.map((row) => {
      const count = faker.number.int({ min: 1, max: 5 });
      const msgs = Array.from({ length: count }, () => generateSampleTextMessage());
      // Guarantee at least one message and bias to Apple/iMessage so the chip shows
      if (msgs.length === 0) msgs.push(generateSampleTextMessage());
      const biasApple = faker.number.int({ min: 1, max: 100 }) <= 60; // ~60%
      if (biasApple) {
        // force first msg to be Apple/iMessage
        msgs[0].service = "iMessage";
        msgs[0].appleDevice = true;
        msgs[0].provider = msgs[0].provider ?? "sendblue";
      }
      return { ...row, messages: msgs };
    });
    setData(withMessages as unknown as CallCampaign[]);
  }, []);

  const columns = React.useMemo(() => buildTextCampaignColumns(), []);

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
        "name",
        "device",
        "status",
        "transfer",
        "transfers",
        "startDate",
        "sent",
        "delivered",
        "failed",
        "totalMessages",
        "lastMessageAt",
        "download",
      ],
    },
    enableColumnPinning: true,
  });

  const carousel = useRowCarousel(table, { loop: true });

  React.useEffect(() => {
    if (carousel.open) setDetailIndex(0);
  }, [carousel.open, carousel.index]);

  // helpers moved to ./Phone/text/utils/helpers

  return (
    <main className="container mx-auto max-w-7xl p-6 space-y-6">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Text Campaigns</h1>
            <p className="text-sm text-muted-foreground">Search, selection, filtering, and details.</p>
          </div>
          <div className="flex items-center gap-2">
            {onNavigate && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("calls")}>Calls</Button>
                <Button type="button" variant="default" size="sm" onClick={() => onNavigate("text")}>Text</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("social")}>Social</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("directMail")}>Direct Mail</Button>
              </>
            )}
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
          <ActionBar
            table={table}
            onRunSelected={() => {
              const rows = getSelectedRowsFromTable(table);
              if (rows.length === 0) return;
              setAiRows(rows);
              setAiOpen(true);
            }}
            onRunAll={() => {
              const rows = getAllRowsFromTable(table);
              setAiRows(rows);
              setAiOpen(true);
            }}
            onClearSelection={() => table.resetRowSelection()}
            filename="text-campaigns"
          />
        }
      >
        <TextTableToolbar
          table={table}
          query={query}
          setQuery={setQuery}
          onRunSelected={() => {
            const rows = getSelectedRowsFromTable(table);
            if (rows.length === 0) return;
            setAiRows(rows);
            setAiOpen(true);
          }}
          onRunAll={() => {
            const rows = getAllRowsFromTable(table);
            setAiRows(rows);
            setAiOpen(true);
          }}
          filename="text-campaigns"
        />
      </DataTable>

      <AIDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        aiRows={aiRows}
        aiOutput={aiOutput}
        setAiOutput={setAiOutput}
        summarizeRows={summarizeRows}
      />

      <TextRowCarousel
        table={table}
        open={carousel.open}
        setOpen={carousel.setOpen}
        index={carousel.index}
        setIndex={carousel.setIndex}
        rows={carousel.rows as any}
      />
      <CampaignModalMain open={createOpen} onOpenChange={setCreateOpen} defaultChannel="text" />
    </main>
  );
}
