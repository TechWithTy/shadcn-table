import type * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "../../../../components/ui/button";
import { Pause, Play, Square } from "lucide-react";
import { stopRowClick, withStopPropagation } from "../../../../utils/events";
import type { SocialRow } from "./types";
interface ControlsColumnCellProps {
	row: { original: SocialRow };
	table: {
		options: {
			meta?: {
				onPause?: (r: SocialRow) => void;
				onResume?: (r: SocialRow) => void;
				onStop?: (r: SocialRow) => void;
			};
		};
	};
}

export const ControlsColumnCell = ({ row, table }: ControlsColumnCellProps) => {
	const r = row.original;
	const status = String(r.status ?? "");
	const isActive = ["queued", "delivering", "pending"].includes(status);
	const isPaused = status === "paused";
	const canControl = isActive || isPaused;
	const meta = table.options?.meta ?? {};

	return (
		<div
			className="flex items-center gap-2"
			onMouseDown={stopRowClick}
			onKeyDown={(e) => {
				// Only intercept activation keys to mirror click behavior
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					e.stopPropagation();
				}
			}}
			onKeyUp={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					e.stopPropagation();
				}
			}}
		>
			<Button
				type="button"
				size="icon"
				variant="outline"
				aria-label={isPaused ? "Resume" : "Pause"}
				disabled={!canControl}
				onClick={withStopPropagation(() => {
					if (!canControl) return;
					if (isPaused) meta.onResume?.(r);
					else meta.onPause?.(r);
				})}
			>
				{isPaused ? (
					<Play className="h-4 w-4" />
				) : (
					<Pause className="h-4 w-4" />
				)}
			</Button>
			<Button
				type="button"
				size="icon"
				variant="outline"
				aria-label="Stop"
				disabled={!canControl}
				onClick={withStopPropagation(() => {
					if (!canControl) return;
					meta.onStop?.(r);
				})}
			>
				<Square className="h-4 w-4" />
			</Button>
		</div>
	);
};

export const controlsColumn: ColumnDef<SocialRow> = {
	id: "controls",
	header: ({ column }) => <div className="text-left font-medium">Controls</div>,
	cell: ({ row, table }) => <ControlsColumnCell row={row} table={table} />,
	enableSorting: false,
	size: 92,
};
