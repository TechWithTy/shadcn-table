import type * as React from "react";
import type { ColumnDef, Table } from "@tanstack/react-table";
import { Button } from "../../../../components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../components/ui/popover";
import { Input } from "../../../../components/ui/input";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { stopRowClick, withStopPropagation } from "../../../../utils/events";
import type { SocialRow } from "./types";

interface FeedbackData {
  sentiment: "up" | "down" | null;
  note: string;
}

interface FeedbackColumnCellProps {
  row: { original: SocialRow };
  table: Table<SocialRow>;
}

type FeedbackMeta = {
  getFeedback?: (r: SocialRow) => FeedbackData | undefined;
  onToggleFeedback?: (r: SocialRow, s: "up" | "down") => void;
  onFeedbackNoteChange?: (r: SocialRow, note: string) => void;
};

export const FeedbackColumnCell = ({ row, table }: FeedbackColumnCellProps) => {
  const r = row.original;
  const status = String(r.status ?? "");
  const isCompleted = status === "completed";
  const meta = (table.options?.meta ?? {}) as FeedbackMeta;
  const fb = meta.getFeedback?.(r) ?? { sentiment: null, note: "" };
  const name = String(r.name ?? "this");
  const upActive = fb.sentiment === "up";
  const downActive = fb.sentiment === "down";

  return (
    <div className="flex items-center gap-2" onMouseDown={stopRowClick}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Thumbs up"
            className={upActive ? "border-green-500 text-green-600" : ""}
            disabled={!isCompleted}
            onClick={withStopPropagation(() => {
              if (!isCompleted) return;
              meta.onToggleFeedback?.(r, "up");
            })}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        {isCompleted ? (
          <PopoverContent
            align="start"
            className="w-64"
            onMouseDown={stopRowClick}
          >
            <Input
              placeholder={`Why did you ${upActive ? "like" : "dislike"} "${name}"?`}
              value={fb.note}
              onChange={(e) =>
                meta.onFeedbackNoteChange?.(r, e.target.value)
              }
            />
          </PopoverContent>
        ) : null}
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Thumbs down"
            className={downActive ? "border-red-500 text-red-600" : ""}
            disabled={!isCompleted}
            onClick={withStopPropagation(() => {
              if (!isCompleted) return;
              meta.onToggleFeedback?.(r, "down");
            })}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        {isCompleted ? (
          <PopoverContent
            align="start"
            className="w-64"
            onMouseDown={stopRowClick}
          >
            <Input
              placeholder={`Why did you ${downActive ? "dislike" : "like"} "${name}"?`}
              value={fb.note}
              onChange={(e) =>
                meta.onFeedbackNoteChange?.(r, e.target.value)
              }
            />
          </PopoverContent>
        ) : null}
      </Popover>
    </div>
  );
};

export const feedbackColumn: ColumnDef<SocialRow> = {
  id: "feedback",
  header: ({ column }) => (
    <div className="text-left font-medium">Feedback</div>
  ),
  cell: ({ row, table }) => <FeedbackColumnCell row={row} table={table} />,
  enableSorting: false,
  size: 120,
};
