"use client";

import * as React from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { DataTableRowModalCarousel } from "../../../components/data-table/data-table-row-modal-carousel";
import type { Table, Row } from "@tanstack/react-table";
import type { DirectMailCampaign } from "../utils/mock";

export function DirectMailRowCarousel({
  table,
  open,
  setOpen,
  index,
  setIndex,
  rows: rowsProp,
}: {
  table: Table<DirectMailCampaign>;
  open: boolean;
  setOpen: (v: boolean) => void;
  index: number;
  setIndex: (i: number) => void;
  rows?: Row<DirectMailCampaign>[];
}) {
  const rows = rowsProp ?? table.getRowModel().rows;
  const [detailIndex, setDetailIndex] = React.useState(0); // lead index
  const [mailingIndex, setMailingIndex] = React.useState(0); // mailing index within lead

  React.useEffect(() => {
    if (open) {
      setDetailIndex(0);
      setMailingIndex(0);
    }
  }, [open, index]);

  React.useEffect(() => {
    // Reset mailing selection when lead changes
    setMailingIndex(0);
  }, [detailIndex]);

  return (
    <DataTableRowModalCarousel
      table={table}
      open={open}
      onOpenChange={setOpen}
      index={index}
      setIndex={setIndex}
      rows={rows}
      onPrev={() => {
        const row = rows[index];
        const leads = ((row?.original as any)?.leadsDetails as any[]) || [];
        setDetailIndex((i) => (leads.length ? (i - 1 + leads.length) % leads.length : 0));
      }}
      onNext={() => {
        const row = rows[index];
        const leads = ((row?.original as any)?.leadsDetails as any[]) || [];
        setDetailIndex((i) => (leads.length ? (i + 1) % leads.length : 0));
      }}
      title={(row) => {
        const leads = ((row.original as any)?.leadsDetails as any[]) || [];
        const lead = leads[detailIndex];
        return (
          <div className="flex items-center gap-2">
            <span>{lead ? `${row.original.name} — ${lead.name}` : row.original.name}</span>
            <Badge variant="secondary">Leads: {leads.length}</Badge>
          </div>
        );
      }}
      description={(row) => {
        const leads = ((row.original as any)?.leadsDetails as any[]) || [];
        const lead = leads[detailIndex];
        return lead ? `${lead.address}` : `Started: ${new Date(row.original.startDate).toLocaleDateString()}`;
      }}
      counter={(row) => {
        const leads = ((row.original as any)?.leadsDetails as any[]) || [];
        return leads.length ? `${detailIndex + 1} / ${leads.length}` : "-";
      }}
      actions={(row) => {
        async function downloadZip() {
          const zip = new JSZip();
          const leads = ((row.original as any)?.leadsDetails as any[]) || [];
          leads.forEach((ld: any, idx: number) => {
            const filename = ld.pdfFilename || `doc_${idx + 1}.pdf`;
            const content = ld.pdfContent || `Document ${idx + 1}`;
            zip.file(filename, content);
          });
          const blob = await zip.generateAsync({ type: "blob" });
          saveAs(blob, `${row.original.name.replace(/\s+/g, "_")}_docs.zip`);
        }
        return (
          <Button type="button" size="sm" onClick={downloadZip}>
            Download ZIP
          </Button>
        );
      }}
      render={(row) => {
        const r = row.original as any;
        const leads = (r?.leadsDetails as any[]) || [];
        const lead = leads[detailIndex];
        const mailings = (lead?.mailings as any[]) || [];
        const curMail = mailings[mailingIndex];
        const fmt = (d?: string) => {
          if (!d) return "-";
          const dt = new Date(String(d));
          return isNaN(dt.getTime()) ? String(d) : dt.toLocaleString();
        };
        return (
          <div className="grid gap-3 md:grid-cols-2">
            {lead ? (
              <div className="rounded-md border p-3">
                <div className="font-medium">Lead Details</div>
                <div className="text-xs text-muted-foreground">{lead.id}</div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Name</div>
                    <div className="font-medium">{lead.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Address</div>
                    <div className="font-medium">{lead.address}</div>
                  </div>
                  {curMail ? (
                    <>
                      <div>
                        <div className="text-xs text-muted-foreground">PDF</div>
                        <div className="font-medium">{curMail.pdfFilename}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Transfers</div>
                        <div className="font-medium">{typeof curMail.transfers === "number" ? curMail.transfers : 0}</div>
                      </div>
                    </>
                  ) : null}
                </div>
                {curMail ? (
                  <>
                    <div>
                      <div className="text-xs text-muted-foreground">Template</div>
                      <div className="font-medium">{curMail.template?.name ?? "-"}</div>
                      <div className="text-xs text-muted-foreground">{curMail.template?.id ?? ""}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Mail Type</div>
                      <div className="font-medium">{String(curMail.mailType ?? "-")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Mail Size</div>
                      <div className="font-medium">{String(curMail.mailSize ?? "-")}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Send Date</div>
                      <div className="font-medium">{fmt(curMail.sendDate)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Expected Delivery</div>
                      <div className="font-medium">{fmt(curMail.expectedDeliveryAt)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Status</div>
                      <div className="font-medium capitalize">{String(curMail.status ?? "-").replace(/_/g, " ")}</div>
                    </div>
                  </>
                ) : null}
                <div>
                  <div className="text-xs text-muted-foreground">Address Verified</div>
                  <div className="font-medium">{r.addressVerified ? "Yes" : "No"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Last Event</div>
                  <div className="font-medium">{fmt(r.lastEventAt)}</div>
                </div>
              </div>
            ) : null}

            {/* Mailing Thread for selected lead */}
            <div className="rounded-md border p-3">
              <div className="font-medium mb-2">Mailing Thread</div>
              <div className="grid gap-2 max-h-[340px] overflow-auto pr-1">
                {Array.isArray(mailings) && mailings.length ? (
                  mailings.map((m: any, idx: number) => {
                    const isActive = idx === mailingIndex;
                    return (
                      <div
                        key={m.id || idx}
                        role="button"
                        tabIndex={0}
                        onClick={() => setMailingIndex(idx)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") setMailingIndex(idx);
                        }}
                        className={`rounded border p-2 text-sm cursor-pointer transition-colors ${isActive ? "bg-muted" : "hover:bg-accent"}`}
                        aria-current={isActive ? "true" : undefined}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium flex items-center gap-2">
                            <span className="truncate max-w-[140px]">{m.template?.name ?? "Template"}</span>
                            <Badge variant="outline">{String(m.mailType ?? "-")}</Badge>
                            <Badge variant="outline">{String(m.mailSize ?? "-")}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">{fmt(m.sendDate)}</div>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                          {typeof m?.transfers === "number" ? (
                            <Badge variant="secondary">Transfers: {m.transfers}</Badge>
                          ) : null}
                          <Badge variant="outline" className="capitalize">{String(m.status ?? "-").replace(/_/g, " ")}</Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">{m.pdfFilename}</div>
                        {/* LOB details removed by request */}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-muted-foreground">No mailings</div>
                )}
              </div>
            </div>
            {/* LOB Details removed; mailings are the source of truth */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Delivered</div>
                <div className="font-medium tabular-nums">{Number(r.deliveredCount ?? 0)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Returned</div>
                <div className="font-medium tabular-nums">{Number(r.returnedCount ?? 0)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Failed</div>
                <div className="font-medium tabular-nums">{Number(r.failedCount ?? 0)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Total Items</div>
                <div className="font-medium tabular-nums">{Number(r.calls ?? 0)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Cost</div>
                <div className="font-medium tabular-nums">${Number(r.cost ?? 0).toFixed(2)}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Delivered: {r?.deliveredCount ?? "-"}</Badge>
              <Badge variant="outline">Returned: {r?.returnedCount ?? "-"}</Badge>
              <Badge variant="outline">Failed: {r?.failedCount ?? "-"}</Badge>
              {typeof r?.calls === "number" ? <Badge variant="outline">Total Items: {r.calls}</Badge> : null}
              <Badge variant="outline">Cost: ${Number(r?.cost ?? 0).toFixed(2)}</Badge>
              <Badge variant="outline">
                Transfers: {Array.isArray(leads) ? leads.reduce((a: number, ld: any) => a + (Number(ld?.transfers) || 0), 0) : 0}
              </Badge>
            </div>
          </div>
        );
      }}
    />
  );
}
