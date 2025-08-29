import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../components/ui/tooltip";
import { Sparkles, BarChart3, MessageSquare, FileText } from "lucide-react";
import type { CallCampaign } from "../../../../../../types/_dashboard/campaign";

interface AIDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rows: CallCampaign[];
  summarize: (rows: CallCampaign[]) => string;
}

export const AIDialog: React.FC<AIDialogProps> = ({ open, onOpenChange, rows, summarize }) => {
  const [output, setOutput] = React.useState("");

  React.useEffect(() => {
    if (!open) setOutput("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] w-[min(90vw,900px)] max-h-[80vh] overflow-y-auto overflow-x-visible pb-8">
        <DialogHeader>
          <DialogTitle>AI Actions — {rows.length} campaign(s)</DialogTitle>
        </DialogHeader>

        <div className="flex flex-nowrap gap-3 overflow-x-auto overflow-y-visible pb-2 pr-1 snap-x snap-mandatory">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setOutput(summarize(rows))}
                className="min-w-[200px] rounded-md border bg-card p-4 text-left shadow-xs hover:bg-accent focus:outline-none snap-start"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <div className="font-medium">Summarize</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Stats for the chosen rows</div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={10} className="z-[60] mb-1">See totals and averages</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  const score = Math.min(100, 50 + Math.round((rows.length % 50) * 1.2));
                  setOutput(`Quality score (mock): ${score}/100 for ${rows.length} row(s).`);
                }}
                className="min-w-[200px] rounded-md border bg-card p-4 text-left shadow-xs hover:bg-accent focus:outline-none snap-start"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <div className="font-medium">Quality Score</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Estimate campaign quality</div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={10} className="z-[60] mb-1">Mock quality estimation</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setOutput(`Drafted ${rows.length} outreach message(s). (mock)`)}
                className="min-w-[200px] rounded-md border bg-card p-4 text-left shadow-xs hover:bg-accent focus:outline-none snap-start"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  <div className="font-medium">Draft Outreach</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Create sample messages</div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={10} className="z-[60] mb-1">Generate outreach copy (mock)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setOutput(`Generated mini-report for ${rows.length} row(s). (mock)`)}
                className="min-w-[200px] rounded-md border bg-card p-4 text-left shadow-xs hover:bg-accent focus:outline-none snap-start"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-500" />
                  <div className="font-medium">Mini Report</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">Quick downloadable report</div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={10} className="z-[60] mb-1">Mock report (no download)</TooltipContent>
          </Tooltip>
        </div>

        <div className="rounded-md border bg-muted/40 p-3 text-xs whitespace-pre-wrap mt-3">
          {output || "Pick an action above to see output here."}
        </div>
      </DialogContent>
    </Dialog>
  );
};
