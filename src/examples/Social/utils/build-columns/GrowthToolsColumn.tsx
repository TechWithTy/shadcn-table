import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../../../../components/ui/badge";
import type { SocialRow } from "./types";

interface GrowthTool {
  id: number;
  name: string;
  type: string;
}

interface GrowthToolsColumnCellProps {
  row: { original: SocialRow };
}

export const GrowthToolsColumnCell = ({ row }: GrowthToolsColumnCellProps) => {
  const o = row.original;
  if (o.platform !== "facebook") return <span>-</span>;
  
  const tools: GrowthTool[] = o.manychatGrowthTools || [];
  const count = tools.length;
  
  return (
    <div className="flex max-w-[260px] flex-wrap items-center gap-1">
      <Badge variant="secondary">{count}</Badge>
      {tools.slice(0, 3).map((t) => (
        <Badge
          key={t.id}
          variant="outline"
          title={`${t.name} (${t.type})`}
        >
          {t.name}
        </Badge>
      ))}
      {count > 3 ? (
        <span className="text-muted-foreground text-xs">
          +{count - 3} more
        </span>
      ) : null}
    </div>
  );
};

export const growthToolsColumn: ColumnDef<SocialRow> = {
  id: "growthTools",
  header: ({ column }) => (
    <div className="text-left font-medium">Growth Tools</div>
  ),
  meta: { label: "Growth Tools", variant: "text" },
  cell: ({ row }) => <GrowthToolsColumnCell row={row} />,
  size: 280,
};
