import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../../../../components/ui/badge";
import type { SocialRow } from "./types";

interface Subscriber {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tags?: Array<{ id: number; name: string }>;
  lastSeen?: string;
  lastInteraction?: string;
}

interface SubscribersColumnCellProps {
  row: { original: SocialRow };
}

export const SubscribersColumnCell = ({ row }: SubscribersColumnCellProps) => {
  const o = row.original;
  if (o.platform !== "facebook") return <span>-</span>;
  const subs: Subscriber[] = o.subscribers || [];
  const count = subs.length;
  
  return (
    <div className="flex max-w-[260px] flex-wrap items-center gap-1">
      <Badge variant="secondary">{count}</Badge>
      {subs.slice(0, 3).map((s) => {
        const parts: string[] = [
          `ID: ${s.id}`,
          s.email ? `Email: ${s.email}` : undefined,
          s.phone ? `Phone: ${s.phone}` : undefined,
          Array.isArray(s.tags) && s.tags.length
            ? `Tags: ${s.tags.map((t) => t.name).join(", ")}`
            : undefined,
          s.lastSeen ? `Last seen: ${s.lastSeen}` : undefined,
          s.lastInteraction
            ? `Last interaction: ${s.lastInteraction}`
            : undefined,
        ].filter(Boolean) as string[];
        const title = parts.join("\n");
        return (
          <Badge key={s.id} variant="outline" title={title || s.id}>
            {s.name}
          </Badge>
        );
      })}
      {count > 3 ? (
        <span className="text-muted-foreground text-xs">
          +{count - 3} more
        </span>
      ) : null}
    </div>
  );
};

export const subscribersColumn: ColumnDef<SocialRow> = {
  id: "subscribers",
  header: ({ column }) => (
    <div className="text-left font-medium">Subscribers</div>
  ),
  meta: { label: "Subscribers", variant: "text" },
  cell: ({ row }) => <SubscribersColumnCell row={row} />,
  size: 260,
};
