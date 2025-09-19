import type { ColumnDef } from "@tanstack/react-table";
import type { SocialRow } from "./types";

interface AudienceColumnCellProps {
  row: { original: SocialRow };
}

export const AudienceColumnCell = ({ row }: AudienceColumnCellProps) => {
  const o = row.original;
  const platform = o.platform as string | undefined;
  let val: string | undefined;
  
  if (platform === "facebook") {
    val = o.facebookSubscriberId || o.facebookExternalId;
  } else if (platform === "linkedin") {
    val = o.linkedinChatId || o.linkedinProfileUrl || o.linkedinPublicId;
  }
  
  const text = val ? String(val) : "-";
  return (
    <span className="max-w-[260px] truncate" title={text}>
      {text}
    </span>
  );
};

export const audienceColumn: ColumnDef<SocialRow> = {
  id: "audience",
  header: ({ column }) => (
    <div className="text-left font-medium">Audience</div>
  ),
  meta: { label: "Audience", variant: "text" },
  cell: ({ row }) => <AudienceColumnCell row={row} />,
  size: 280,
};
