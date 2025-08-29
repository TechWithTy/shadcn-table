"use client";

import * as React from "react";
import { DataTable } from "../components/data-table/data-table";
import { DataTableToolbar } from "../components/data-table/data-table-toolbar";
import { DataTableRowModalCarousel } from "../components/data-table/data-table-row-modal-carousel";
import { DataTableExportButton } from "../components/data-table/data-table-export-button";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useDataTable } from "../hooks/use-data-table";
import { useRowCarousel } from "../hooks/use-row-carousel";
import type { CallCampaign } from "../../../../types/_dashboard/campaign";
import {
  generateCallCampaignData,
  mockCallCampaignData,
} from "../../../../constants/_faker/calls/callCampaign";
import { buildDirectMailColumns } from "./DirectMail/utils/columns";
import { filterCampaigns, summarizeRows } from "./DirectMail/utils/helpers";
import { SummaryPanel } from "./DirectMail/components/SummaryPanel";
import { SelectionBar } from "./DirectMail/components/SelectionBar";
import { AIMenu } from "./DirectMail/components/AIMenu";
import { AIDialogPanel } from "./DirectMail/components/AIDialogPanel";

type ParentTab = "calls" | "text" | "social" | "directMail";

export default function DirectMailCampaignsDemoTable({
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
  const campaignType = "Direct Mail" as const;
  const [dateChip, setDateChip] = React.useState<"today" | "7d" | "30d">("today");

  React.useEffect(() => {
    const d = (mockCallCampaignData as CallCampaign[] | false) || generateCallCampaignData();
    // Enrich with mock Lob template info for demo rendering
    const templates = [
      { id: "tmpl_postcard_std", name: "Postcard - Promo" },
      { id: "tmpl_letter_bw", name: "Letter - BW" },
      { id: "tmpl_selfmailer_color", name: "Self Mailer - Color" },
    ];
    const mailTypes = ["postcard", "letter", "self_mailer"] as const;
    const mailSizes = ["4x6", "6x9", "8.5x11"] as const;
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const withLOB = d.map((r, i) => {
      const delivered = Math.max(0, (r.calls ?? 0) - ((i * 3) % 15));
      const returned = (i * 2) % 7;
      const failed = i % 5;
      const cost = Math.round(((r.calls ?? 0) * (0.45 + (i % 3) * 0.1)) * 100) / 100;
      return {
        ...r,
        template: templates[i % templates.length],
        mailType: mailTypes[i % mailTypes.length],
        mailSize: mailSizes[i % mailSizes.length],
        addressVerified: i % 4 !== 0,
        expectedDeliveryAt: new Date(now + ((i % 14) + 1) * day).toISOString(),
        lastEventAt: new Date(now - ((i % 21) + 1) * day).toISOString(),
        deliveredCount: delivered,
        returnedCount: returned,
        failedCount: failed,
        cost,
      } as CallCampaign & any;
    });
    setData(withLOB as CallCampaign[]);
  }, []);
  const columns = React.useMemo(() => buildDirectMailColumns(), []);

  const filtered = React.useMemo(() => filterCampaigns(data, query), [data, query]);

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
        "template",
        "status",
        "transfer",
        "transfers",
        "startDate",
        "mailType",
        "mailSize",
        "addressVerified",
        "expectedDeliveryAt",
        "lastEventAt",
        "deliveredCount",
        "returnedCount",
        "failedCount",
        "cost",
      ],
      columnVisibility: {
        calls: false,
        inQueue: false,
        leads: false,
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
            <h1 className="text-2xl font-semibold tracking-tight">Direct Mail Campaigns</h1>
            <p className="text-sm text-muted-foreground">Search, selection, filtering, and details.</p>
          </div>
          {onNavigate && (
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("calls")}>Calls</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("text")}>Text</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("social")}>Social</Button>
              <Button type="button" variant="default" size="sm" onClick={() => onNavigate("directMail")}>Direct Mail</Button>
            </div>
          )}
        </div>
      </header>
      <SummaryPanel
        filtered={filtered}
        dateChip={dateChip}
        setDateChip={setDateChip}
        campaignType={campaignType}
        onOpenWithRows={(rows) => {
          if (!rows || rows.length === 0) return;
          setAiRows(rows);
          setAiOpen(true);
        }}
      />

      <DataTable<CallCampaign>
        table={table}
        className="mt-2"
        onRowClick={(row) => {
          setDetailIndex(0);
          carousel.openAt(row);
        }}
        actionBar={
          <SelectionBar
            table={table}
            filename="direct-mail-campaigns"
            onUseSelected={() => {
              const rows = getSelectedRows();
              if (rows.length === 0) return;
              setAiRows(rows);
              setAiOpen(true);
            }}
            onUseAll={() => {
              const rows = getAllRows();
              setAiRows(rows);
              setAiOpen(true);
            }}
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
          <AIMenu
            selectedCount={table.getFilteredSelectedRowModel().rows.length}
            allCount={table.getFilteredRowModel().rows.length}
            onUseSelected={() => {
              const rows = getSelectedRows();
              if (rows.length === 0) return;
              setAiRows(rows);
              setAiOpen(true);
            }}
            onUseAll={() => {
              const rows = getAllRows();
              setAiRows(rows);
              setAiOpen(true);
            }}
          />
          <DataTableExportButton
            table={table}
            filename="direct-mail-campaigns"
            excludeColumns={["select"]}
          />
        </DataTableToolbar>
      </DataTable>
      <AIDialogPanel
        open={aiOpen}
        onOpenChange={setAiOpen}
        aiRows={aiRows}
        aiOutput={aiOutput}
        setAiOutput={setAiOutput}
        summarizeRows={summarizeRows}
      />

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
        render={() => <div className="text-muted-foreground">No playback for Direct Mail campaigns</div>}
      />
    </main>
  );
}
