"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { DataTableRowModalCarousel } from "../../../../components/data-table/data-table-row-modal-carousel";
import type { CallCampaign } from "../../../../../../../types/_dashboard/campaign";
import { Badge } from "../../../../components/ui/badge";
import { PlaybackCell } from "./PlaybackCell";

export function CallDetailsModal({
  table,
  open,
  setOpen,
  index,
  setIndex,
  detailIndex,
  setDetailIndex,
}: {
  table: Table<CallCampaign>;
  open: boolean;
  setOpen: (v: boolean) => void;
  index: number;
  setIndex: (v: number) => void;
  detailIndex: number;
  setDetailIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <DataTableRowModalCarousel
      table={table}
      open={open}
      onOpenChange={setOpen}
      index={index}
      setIndex={setIndex}
      rows={table.getRowModel().rows}
      onPrev={() => {
        const current = table.getRowModel().rows[index]?.original as CallCampaign | undefined;
        const len = current?.callInformation?.length ?? 0;
        if (!len) return;
        setDetailIndex((i) => (i - 1 + len) % len);
      }}
      onNext={() => {
        const current = table.getRowModel().rows[index]?.original as CallCampaign | undefined;
        const len = current?.callInformation?.length ?? 0;
        if (!len) return;
        setDetailIndex((i) => (i + 1) % len);
      }}
      title={(row) => row.original.name}
      description={(row) => `Started: ${new Date(row.original.startDate).toLocaleDateString()}`}
      counter={(row) => {
        const len = row.original.callInformation?.length ?? 0;
        if (!len) return "0 / 0";
        return `${Math.min(detailIndex + 1, len)} / ${len}`;
      }}
      render={(row) => {
        const info = row.original.callInformation ?? [];
        if (!info.length) return <div className="text-muted-foreground">No calls</div>;
        const current = info[Math.min(detailIndex, info.length - 1)];
        const cr = (current?.callResponse ?? {}) as {
          phoneCallProvider?: string;
          phoneCallTransport?: string;
          status?: string;
          cost?: number;
          costBreakdown?: { total?: number };
          startedAt?: string | number | Date;
          endedAt?: string | number | Date;
          analysis?: { summary?: string };
          recordingUrl?: string;
          stereoRecordingUrl?: string;
        };
        const provider = cr.phoneCallProvider ?? "-";
        const transport = cr.phoneCallTransport ?? "-";
        const callStatus = cr.status ?? "-";
        const started = cr.startedAt ? new Date(String(cr.startedAt)).toLocaleString() : "-";
        const ended = cr.endedAt ? new Date(String(cr.endedAt)).toLocaleString() : "-";
        const cost = (cr.costBreakdown?.total ?? cr.cost) as number | undefined;
        const summary = cr.analysis?.summary || (row.original as any)?.analysis?.summary || "";
        const transfer = (row.original as any).transfer as { type?: string; agentId?: string } | undefined;
        const transfersCount = (row.original as any).transfers ?? 0;

        return (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">Call Summary</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {summary || "No summary available for this call."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" title="Provider">
                  {provider}
                </Badge>
                <Badge variant="outline" title="Transport">
                  {transport}
                </Badge>
                <Badge variant="secondary" title="Status">
                  {callStatus}
                </Badge>
                <Badge variant="outline" title="Cost">
                  {typeof cost === "number" ? `$${cost.toFixed(2)}` : "-"}
                </Badge>
                <Badge variant="outline" title="Started">
                  {started}
                </Badge>
                <Badge variant="outline" title="Ended">
                  {ended}
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-medium">Transfers</h4>
                {(() => {
                  const breakdown = (row.original as any).transferBreakdown as Record<string, number> | undefined;
                  const entries = Object.entries(breakdown ?? {}).filter(([, v]) => typeof v === "number" && v > 0);
                  const total = typeof transfersCount === "number" ? transfersCount : entries.reduce((a, [, v]) => a + (v as number), 0);
                  if (!entries.length && !total) {
                    return <span className="text-sm text-muted-foreground">No transfers</span>;
                  }
                  return (
                    <>
                      {entries.length ? (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {entries.map(([k, v]) => (
                            <Badge key={k} variant="secondary">
                              {k.replaceAll("_", " ")} · {v}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      <div className="text-xs text-muted-foreground mt-2">Total transfers: {total}</div>
                      {transfer ? (
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline">last route</Badge>
                          <Badge>{transfer.type ?? "transfer"}</Badge>
                          {transfer.agentId ? (
                            <span className="text-xs text-muted-foreground">Agent: {transfer.agentId}</span>
                          ) : null}
                        </div>
                      ) : null}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="rounded-md border p-3">
              <h3 className="text-sm font-medium mb-2">Playback</h3>
              <PlaybackCell callInformation={current ? [current] : []} />
            </div>
          </div>
        );
      }}
    />
  );
}
