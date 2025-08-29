"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { Button } from "../../../../components/ui/button";
import { Badge } from "../../../../components/ui/badge";
import { DataTableDateFilter } from "../../../../components/data-table/data-table-date-filter";
import type { CallCampaign } from "../../../../../../../types/_dashboard/campaign";

export type CampaignType = "Calls" | "Text" | "Social" | "Direct Mail";

type Props = {
  table: Table<CallCampaign>;
  campaignType: CampaignType;
  dateChip: "today" | "7d" | "30d";
  setDateChip: (v: "today" | "7d" | "30d") => void;
};

export function SummaryCard({ table, campaignType, dateChip, setDateChip }: Props) {
  const uiRows = table.getFilteredRowModel().rows.map((r) => r.original as CallCampaign);
  const totals = React.useMemo(() => {
    return uiRows.reduce(
      (acc, r) => {
        acc.calls += r.calls ?? 0;
        acc.leads += r.leads ?? 0;
        acc.inQueue += r.inQueue ?? 0;
        return acc;
      },
      { calls: 0, leads: 0, inQueue: 0 },
    );
  }, [uiRows]);

  const primaryLabel =
    campaignType === "Calls"
      ? "Calls"
      : campaignType === "Text"
      ? "Messages"
      : campaignType === "Social"
      ? "Actions"
      : "Mailers";

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between gap-3 p-4 pb-2">
        <div className="text-base font-medium">{campaignType} Summary</div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant={dateChip === "today" ? "secondary" : "ghost"} onClick={() => setDateChip("today")}>
            Today
          </Button>
          <Button type="button" size="sm" variant={dateChip === "7d" ? "secondary" : "ghost"} onClick={() => setDateChip("7d")}>
            7d
          </Button>
          <Button type="button" size="sm" variant={dateChip === "30d" ? "secondary" : "ghost"} onClick={() => setDateChip("30d")}>
            30d
          </Button>
          {table.getColumn("startDate") && (
            <DataTableDateFilter
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              column={table.getColumn("startDate")!}
              title="Range"
              multiple
            />
          )}
        </div>
      </div>
      <div className="p-4 pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Rows</div>
            <div className="text-lg font-semibold">{uiRows.length}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">{primaryLabel}</div>
            <div className="text-lg font-semibold">{totals.calls}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Leads</div>
            <div className="text-lg font-semibold">{totals.leads}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Queued</div>
            <div className="text-lg font-semibold">{totals.inQueue}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          <Badge variant="secondary">{campaignType}</Badge>
          <Badge variant="outline">Range: {dateChip}</Badge>
        </div>
      </div>
    </div>
  );
}
