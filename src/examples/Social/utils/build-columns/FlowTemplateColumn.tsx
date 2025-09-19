import type { ColumnDef } from "@tanstack/react-table";
import type { SocialRow } from "./types";

interface FlowTemplateColumnCellProps {
  row: { original: SocialRow };
}

export const FlowTemplateColumnCell = ({ row }: FlowTemplateColumnCellProps) => {
  const original = row.original;
  const platform = original.platform as string | undefined;
  
  if (platform === "facebook") {
    const name = original.manychatFlowName ?? "Flow";
    const flowId = original.manychatFlowId ?? undefined;
    return (
      <div
        className="max-w-[220px] truncate"
        title={flowId ? `${name} (${flowId})` : name}
      >
        {name}
      </div>
    );
  }
  
  if (platform === "linkedin") {
    const t = original.liTemplateType ?? "DM";
    const templateName = original.liTemplateName ?? "Template";
    return (
      <div
        className="max-w-[220px] truncate"
        title={`${t} - ${templateName}`}
      >
        {t} · {templateName}
      </div>
    );
  }
  
  return <span>-</span>;
};

export const flowTemplateColumn: ColumnDef<SocialRow> = {
  id: "flowTemplate",
  header: ({ column }) => (
    <div className="text-left font-medium">Flow / Template</div>
  ),
  meta: { label: "Flow / Template", variant: "text" },
  cell: ({ row }) => <FlowTemplateColumnCell row={row} />,
};
