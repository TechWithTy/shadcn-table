"use client";
import * as React from "react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";

type TransferType = 'chat_agent' | 'voice_inbound' | 'voice_outbound' | 'text' | 'social_media' | 'appraisal' | 'live_person' | 'live_person_calendar';

interface CampaignTransfer {
  type?: TransferType;
  agentId?: string;
}

interface CallCampaign {
  calls?: number;
  leads?: number;
  inQueue?: number;
  transfer?: CampaignTransfer;
}

export function SummaryPanel(props: {
  filtered: CallCampaign[];
  dateChip: "today" | "7d" | "30d";
  setDateChip: (v: "today" | "7d" | "30d") => void;
  campaignType: string;
  onOpenWithRows?: (rows: CallCampaign[]) => void;
}) {
  const { filtered, dateChip, setDateChip, campaignType, onOpenWithRows } =
    props;
  const totals = React.useMemo(() => {
    return {
      rows: filtered.length,
      mailers: filtered.reduce((a, r) => a + (r.calls ?? 0), 0),
      leads: filtered.reduce((a, r) => a + (r.leads ?? 0), 0),
      queued: filtered.reduce((a, r) => a + (r.inQueue ?? 0), 0),
    };
  }, [filtered]);

  const transferCounts = React.useMemo(() => {
    const acc: Record<TransferType, { label: string; count: number }> = {
      chat_agent: { label: "Chat", count: 0 },
      voice_inbound: { label: "Voice (In)", count: 0 },
      voice_outbound: { label: "Voice (Out)", count: 0 },
      text: { label: "Text", count: 0 },
      social_media: { label: "Social", count: 0 },
      appraisal: { label: "Appraisal", count: 0 },
      live_person: { label: "Live Person", count: 0 },
      live_person_calendar: { label: "Live Person Calendar", count: 0 },
    };
    for (const r of filtered) {
      const transfer = r.transfer as CampaignTransfer | undefined;
      const transferType = transfer?.type;
      if (transferType && acc[transferType]) {
        acc[transferType].count += 1;
      }
    }
    return acc;
  }, [filtered]);

  return (
    <div className="rounded-lg border bg-background">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium text-base">Direct Mail Summary</h3>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={dateChip === "today" ? "secondary" : "ghost"}
              onClick={() => setDateChip("today")}
            >
              Today
            </Button>
            <Button
              type="button"
              size="sm"
              variant={dateChip === "7d" ? "secondary" : "ghost"}
              onClick={() => setDateChip("7d")}
            >
              7d
            </Button>
            <Button
              type="button"
              size="sm"
              variant={dateChip === "30d" ? "secondary" : "ghost"}
              onClick={() => setDateChip("30d")}
            >
              30d
            </Button>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground text-xs">Rows</div>
            <div className="font-semibold text-lg">{totals.rows}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground text-xs">Mailers</div>
            <div className="font-semibold text-lg">{totals.mailers}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground text-xs">Leads</div>
            <div className="font-semibold text-lg">{totals.leads}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground text-xs">Queued</div>
            <div className="font-semibold text-lg">{totals.queued}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          <Badge variant="secondary">{campaignType}</Badge>
          <Badge variant="outline">Range: {dateChip}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(transferCounts).map(([key, v]) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (!onOpenWithRows) return;
                const rows = filtered.filter(
                  (r) => (r as CallCampaign).transfer?.type === key,
                );
                onOpenWithRows(rows);
              }}
              className="h-7 px-2"
            >
              <span className="mr-2">{v.label}</span>
              <Badge
                variant="secondary"
                className="rounded-sm px-2 py-0 text-xs"
              >
                {v.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
