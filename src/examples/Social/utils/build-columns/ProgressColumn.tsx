import type { ColumnDef } from "@tanstack/react-table";
import type { SocialRow } from "./types";

interface ProgressSegment {
	key: string;
	value: number;
	color: string;
}

interface ProgressColumnCellProps {
	row: { original: SocialRow };
}

export const ProgressColumnCell = ({ row }: ProgressColumnCellProps) => {
	const o = row.original;
	// Map existing fields for demo if dedicated fields are missing
	const queued = o.queued ?? o.inQueue ?? 0;
	const sent = o.sent ?? o.calls ?? 0;
	const delivered = o.delivered ?? (typeof o.leads === "number" ? o.leads : 0);
	const failed = o.failed ?? 0;
	const total = Math.max(1, queued + sent + delivered + failed);

	const segments: ProgressSegment[] = [
		{ key: "Queued", value: queued, color: "bg-sky-500" },
		{ key: "Sent", value: sent, color: "bg-indigo-500" },
		{ key: "Delivered", value: delivered, color: "bg-emerald-500" },
		{ key: "Failed", value: failed, color: "bg-rose-500" },
	];

	const label = `Queued: ${queued} • Sent: ${sent} • Delivered: ${delivered} • Failed: ${failed}`;

	return (
		<div className="min-w-[240px]" aria-label={label} title={label}>
			<div className="flex h-2 w-full overflow-hidden rounded-md bg-muted">
				{segments.map((s) =>
					s.value > 0 ? (
						<div
							key={s.key}
							className={`${s.color}`}
							style={{ width: `${(s.value / total) * 100}%` }}
							title={`${s.key}: ${s.value}`}
						/>
					) : null,
				)}
			</div>
			<div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground text-xs">
				<span>
					Queued: <span className="tabular-nums">{queued}</span>
				</span>
				<span>
					Sent: <span className="tabular-nums">{sent}</span>
				</span>
				<span>
					Delivered: <span className="tabular-nums">{delivered}</span>
				</span>
				<span>
					Failed: <span className="tabular-nums">{failed}</span>
				</span>
			</div>
		</div>
	);
};

export const progressColumn: ColumnDef<SocialRow> = {
	id: "progress",
	header: ({ column }) => <div className="text-left font-medium">Progress</div>,
	meta: { label: "Progress", variant: "text" },
	cell: ({ row }) => <ProgressColumnCell row={row} />,
	size: 260,
};
