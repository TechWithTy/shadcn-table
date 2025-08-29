"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { DataTableRowModalCarousel } from "../../../../components/data-table/data-table-row-modal-carousel";
import type { CallCampaign } from "../../../../../../../types/_dashboard/campaign";

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
        return <div className="text-sm text-muted-foreground">Calls: {info.length}</div>;
      }}
    />
  );
}
