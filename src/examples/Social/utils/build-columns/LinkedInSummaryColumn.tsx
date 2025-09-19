import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../../../../components/ui/badge";
import type {
	SocialRow,
	InteractionDetail,
	Attachment,
	Reaction,
} from "./types";

interface LinkedInSummaryColumnCellProps {
	row: { original: SocialRow };
}

export const LinkedInSummaryColumnCell = ({
	row,
}: LinkedInSummaryColumnCellProps) => {
	const o = row.original;
	if (o.platform !== "linkedin") return <span>-</span>;

	const items: InteractionDetail[] = Array.isArray(o.interactionsDetails)
		? o.interactionsDetails
		: [];

	const li = items.filter((it) => it?.linkedinMessage);
	const msgCount = li.length;

	const attCounts = li.reduce(
		(acc: Record<string, number>, it: InteractionDetail) => {
			const atts: Attachment[] = it.linkedinMessage?.attachments || [];
			for (const a of atts) {
				const t = String(a?.type ?? "unknown");
				acc[t] = (acc[t] ?? 0) + 1;
			}
			return acc;
		},
		{} as Record<string, number>,
	);

	const totalReactions = li.reduce((sum: number, it: InteractionDetail) => {
		const rs: Reaction[] = it.linkedinMessage?.reactions || [];
		return sum + rs.length;
	}, 0);

	const attTitle = Object.entries(attCounts)
		.map(([t, n]) => `${t}: ${n}`)
		.join("\n");

	return (
		<div className="flex max-w-[280px] flex-wrap items-center gap-1">
			<Badge variant="secondary" title="LinkedIn messages with payload">
				Msgs: {msgCount}
			</Badge>
			{Object.keys(attCounts).length > 0 ? (
				<Badge variant="outline" title={attTitle || "Attachments"}>
					Att: {Object.values(attCounts).reduce((a, b) => a + b, 0)}
				</Badge>
			) : (
				<Badge variant="outline">Att: 0</Badge>
			)}
			{totalReactions > 0 ? (
				<Badge variant="outline" title="Total reactions across messages">
					Reacts: {totalReactions}
				</Badge>
			) : null}
		</div>
	);
};

export const linkedInSummaryColumn: ColumnDef<SocialRow> = {
	id: "liSummary",
	header: ({ column }) => <div className="text-left font-medium">LinkedIn</div>,
	meta: { label: "LinkedIn", variant: "text" },
	cell: ({ row }) => <LinkedInSummaryColumnCell row={row} />,
	size: 300,
};
