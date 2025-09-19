import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../../../../components/ui/badge";
import type { SocialRow } from "./types";

interface TransferColumnCellProps {
	row: { original: SocialRow };
}

export const TransferColumnCell = ({ row }: TransferColumnCellProps) => {
	const t = row.original.transfer;
	if (!t) return <span>-</span>;

	const label =
		t.type === "chat_agent"
			? "Chat"
			: t.type === "voice_inbound"
				? "Voice (In)"
				: t.type === "voice_outbound"
					? "Voice (Out)"
					: t.type === "text"
						? "Text"
						: t.type === "social_media"
							? "Social"
							: t.type === "appraisal"
								? "Appraisal"
								: t.type === "live_person"
									? "Live Person"
									: t.type === "live_person_calendar"
										? "Live Person Calendar"
										: t.type;

	return <Badge title={t.agentId}>{label}</Badge>;
};

export const transferColumn: ColumnDef<SocialRow> = {
	id: "transfer",
	header: ({ column }) => <div className="text-left font-medium">Transfer</div>,
	accessorFn: (row) => row.transfer?.type ?? "-",
	enableColumnFilter: true,
	filterFn: (row, id, value) => {
		const v = String(row.getValue(id) ?? "");
		return Array.isArray(value) ? value.includes(v) : String(value) === v;
	},
	meta: {
		label: "Transfer",
		variant: "select",
		options: [
			{ label: "Chat", value: "chat_agent" },
			{ label: "Voice (In)", value: "voice_inbound" },
			{ label: "Voice (Out)", value: "voice_outbound" },
			{ label: "Text", value: "text" },
			{ label: "Social", value: "social_media" },
			{ label: "Appraisal", value: "appraisal" },
			{ label: "Live Person", value: "live_person" },
			{ label: "Live Person Calendar", value: "live_person_calendar" },
		],
	},
	cell: ({ row }) => <TransferColumnCell row={row} />,
	size: 140,
};
