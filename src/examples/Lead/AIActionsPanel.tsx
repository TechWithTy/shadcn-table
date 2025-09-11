"use client";

import * as React from "react";
import { BarChart3, MessageSquare, Sparkles } from "lucide-react";
import { DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import type { DemoRow } from "./types";

export interface AIActionsPanelProps {
  aiRows: DemoRow[];
  setAiOutput: (s: string) => void;
  getAllRows: () => DemoRow[];
  summarizeRows: (rows: DemoRow[]) => string;
}

export function AIActionsPanel({ aiRows, setAiOutput, getAllRows, summarizeRows }: AIActionsPanelProps) {
  return (
    <DialogContent className="max-h-[80vh] w-[min(90vw,900px)] max-w-[900px] overflow-y-auto overflow-x-visible pb-8">
      <DialogHeader>
        <DialogTitle>AI Actions — {aiRows.length} list(s)</DialogTitle>
      </DialogHeader>
      <div className="mb-2 text-muted-foreground text-sm">
        Data source: {aiRows.length === getAllRows().length ? "All" : "Selected"}
      </div>

      <div className="flex snap-x snap-mandatory flex-nowrap gap-3 overflow-x-auto overflow-y-visible pr-1 pb-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setAiOutput(summarizeRows(aiRows))}
              className="min-w-[200px] snap-start rounded-md border bg-card p-4 text-left shadow-xs hover:bg-accent focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <div className="font-medium">Summarize</div>
              </div>
              <div className="mt-1 text-muted-foreground text-xs">Stats for the chosen rows</div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={10} className="z-[60] mb-1">See totals and averages</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => {
                const rows = aiRows;
                const score = Math.min(100, 50 + Math.round((rows.length % 50) * 1.2));
                setAiOutput(`Quality score (mock): ${score}/100 for ${rows.length} row(s).`);
              }}
              className="min-w-[200px] snap-start rounded-md border bg-card p-4 text-left shadow-xs hover:bg-accent focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <div className="font-medium">Quality Score</div>
              </div>
              <div className="mt-1 text-muted-foreground text-xs">Estimate list quality</div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={10} className="z-[60] mb-1">Mock quality estimation</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setAiOutput(`Drafted ${aiRows.length} outreach message(s). (mock)`)}
              className="min-w-[200px] snap-start rounded-md border bg-card p-4 text-left shadow-xs hover:bg-accent focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-500" />
                <div className="font-medium">Draft Outreach</div>
              </div>
              <div className="mt-1 text-muted-foreground text-xs">Create sample messages</div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={10} className="z-[60] mb-1">Generate outreach copy (mock)</TooltipContent>
        </Tooltip>
      </div>

      <div className="mt-3 whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-xs">
        {/* Output will be set by parent via state */}
      </div>
    </DialogContent>
  );
}
