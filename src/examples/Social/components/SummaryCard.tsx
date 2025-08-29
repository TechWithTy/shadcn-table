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
      </CardContent>
    </Card>
  );
};
