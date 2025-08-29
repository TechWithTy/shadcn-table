import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card";
import { Badge } from "../../../../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import type { CallCampaign } from "../../../../../../types/_dashboard/campaign";

export type DateChip = "today" | "7d" | "30d";

interface SummaryCardProps {
  filtered: CallCampaign[];
  campaignType: string;
  dateChip: DateChip;
  setDateChip: (v: DateChip) => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ filtered, campaignType, dateChip, setDateChip }) => {
  // Build a flat interactions timeline from available rows
  const timeline = React.useMemo(() => {
    const items: Array<{ id: string; createdAt: string; label: string }> = [];
    for (const r of filtered as Array<CallCampaign & { interactionsDetails?: any[] }>) {
      const arr = (r as any)?.interactionsDetails as any[] | undefined;
      if (!arr || arr.length === 0) continue;
      for (const it of arr) {
        if (!it?.createdAt) continue;
        const label = `${it.type ?? "interaction"} by @${it.user ?? "user"}`;
        items.push({ id: String(it.id ?? `${r.name}-${it.createdAt}`), createdAt: String(it.createdAt), label });
      }
    }
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items.slice(0, 100);
  }, [filtered]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-medium">Social Summary</CardTitle>
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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Rows</div>
            <div className="text-lg font-semibold">{filtered.length}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Actions</div>
            <div className="text-lg font-semibold">{filtered.reduce((a, r) => a + (r.calls ?? 0), 0)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Leads</div>
            <div className="text-lg font-semibold">{filtered.reduce((a, r) => a + (r.leads ?? 0), 0)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">Queued</div>
            <div className="text-lg font-semibold">{filtered.reduce((a, r) => a + (r.inQueue ?? 0), 0)}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          <Badge variant="secondary">{campaignType}</Badge>
          <Badge variant="outline">Range: {dateChip}</Badge>
        </div>
        {/* Horizontal scrollable timeline */}
        <div className="mt-4">
          <div className="text-xs text-muted-foreground mb-2">Interactions Timeline</div>
          <div className="overflow-x-auto">
            <div className="flex items-center gap-2 whitespace-nowrap pr-2">
              {timeline.length === 0 ? (
                <div className="text-xs text-muted-foreground">No interactions available</div>
              ) : (
                timeline.map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {new Date(t.createdAt).toLocaleString()}
                    </Badge>
                    <span className="text-xs">{t.label}</span>
                    <div className="h-[1px] w-8 bg-border" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
