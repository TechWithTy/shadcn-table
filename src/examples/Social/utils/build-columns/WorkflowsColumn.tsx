import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../../../../components/ui/badge";
import type { SocialRow } from "./types";

interface Workflow {
	ns: string;
	name: string;
	folder_id?: number;
}

interface WorkflowsColumnCellProps {
	row: { original: SocialRow };
}

export const WorkflowsColumnCell = ({ row }: WorkflowsColumnCellProps) => {
	const o = row.original;
	if (o.platform !== "facebook") return <span>-</span>;

	const flows: Workflow[] = o.manychatFlows || [];
	const count = flows.length;

	return (
		<div className="flex max-w-[260px] flex-wrap items-center gap-1">
			<Badge variant="secondary">{count}</Badge>
			{flows.slice(0, 3).map((f) => (
				<Badge key={f.ns} variant="outline" title={f.ns}>
					{f.name}
				</Badge>
			))}
			{count > 3 ? (
				<span className="text-muted-foreground text-xs">+{count - 3} more</span>
			) : null}
		</div>
	);
};

export const workflowsColumn: ColumnDef<SocialRow> = {
	id: "workflows",
	header: ({ column }) => (
		<div className="text-left font-medium">Workflows</div>
	),
	meta: { label: "Workflows", variant: "text" },
	cell: ({ row }) => <WorkflowsColumnCell row={row} />,
	size: 280,
};
