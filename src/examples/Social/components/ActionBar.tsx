import * as React from "react";
import { Button } from "../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Sparkles } from "lucide-react";
import { DataTableExportButton } from "../../../components/data-table/data-table-export-button";
import type { Table } from "@tanstack/react-table";
import type { CallCampaign } from "../../../../../../types/_dashboard/campaign";

interface ActionBarProps {
  table: Table<CallCampaign>;
  getSelectedRows: () => CallCampaign[];
  getAllRows: () => CallCampaign[];
  setAiRows: (rows: CallCampaign[]) => void;
  setAiOpen: (v: boolean) => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  table,
  getSelectedRows,
  getAllRows,
  setAiRows,
  setAiOpen,
}) => {
  const [sending, setSending] = React.useState<null | "fb" | "li">(null);

  function canSendFB(row: CallCampaign): boolean {
    const o: any = row;
    if (o.platform !== "facebook") return false;
    const hasAudience = Boolean(o.facebookSubscriberId || o.facebookExternalId);
    const hasFlow = Boolean(o.manychatFlowId || o.manychatFlowName);
    return hasAudience && hasFlow;
  }

  function canSendLI(row: CallCampaign): boolean {
    const o: any = row;
    if (o.platform !== "linkedin") return false;
    const hasAudience = Boolean(o.linkedinChatId || o.linkedinProfileUrl || o.linkedinPublicId);
    const hasTemplate = Boolean(o.liTemplateType || o.liTemplateName);
    return hasAudience && hasTemplate;
  }

  function mockSend(
    network: "fb" | "li",
    rows: CallCampaign[],
  ) {
    if (rows.length === 0) return;
    setSending(network);
    // Simulate a short network call and log payload
    window.setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log(`Mock send to ${network === "fb" ? "Facebook (ManyChat)" : "LinkedIn (Unipile)"}`,
        {
          count: rows.length,
          sample: rows.slice(0, 3).map((r) => ({ id: r.id, name: r.name })),
        },
      );
      setSending(null);
      // Optional: simple feedback without adding a toast provider
      // Feel free to replace with your toast solution
      try { window.dispatchEvent(new CustomEvent("social-mock-sent", { detail: { network, count: rows.length } })); } catch {}
    }, 600);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">
        {table.getFilteredSelectedRowModel().rows.length} selected
      </span>
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() => table.resetRowSelection()}
      >
        Clear
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" className="bg-purple-600 text-white hover:bg-purple-700">
            <Sparkles className="mr-1 h-4 w-4" /> AI
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Run AI on</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={table.getFilteredSelectedRowModel().rows.length === 0}
            onSelect={() => {
              const rows = getSelectedRows();
              if (rows.length === 0) return;
              setAiRows(rows);
              setAiOpen(true);
            }}
          >
            Use Selected ({table.getFilteredSelectedRowModel().rows.length})
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              const rows = getAllRows();
              setAiRows(rows);
              setAiOpen(true);
            }}
          >
            Use All ({table.getFilteredRowModel().rows.length})
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Social mock actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" variant="outline" disabled={!!sending}>
            {sending ? (sending === "fb" ? "Sending FB..." : "Sending LI...") : "Social Send"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Facebook (ManyChat)</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={(() => {
              if (!!sending) return true;
              const eligible = getSelectedRows().filter(canSendFB).length;
              return eligible === 0;
            })()}
            onSelect={() => {
              const rows = getSelectedRows().filter(canSendFB);
              if (rows.length === 0) return;
              mockSend("fb", rows);
            }}
          >
            {(() => {
              const eligible = getSelectedRows().filter(canSendFB).length;
              return `Send Selected (${eligible})`;
            })()}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={(() => {
              if (!!sending) return true;
              const eligible = getAllRows().filter(canSendFB).length;
              return eligible === 0;
            })()}
            onSelect={() => {
              const rows = getAllRows().filter(canSendFB);
              if (rows.length === 0) return;
              mockSend("fb", rows);
            }}
          >
            {(() => {
              const eligible = getAllRows().filter(canSendFB).length;
              return `Send All (${eligible})`;
            })()}
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>LinkedIn (Unipile)</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={(() => {
              if (!!sending) return true;
              const eligible = getSelectedRows().filter(canSendLI).length;
              return eligible === 0;
            })()}
            onSelect={() => {
              const rows = getSelectedRows().filter(canSendLI);
              if (rows.length === 0) return;
              mockSend("li", rows);
            }}
          >
            {(() => {
              const eligible = getSelectedRows().filter(canSendLI).length;
              return `Send Selected (${eligible})`;
            })()}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={(() => {
              if (!!sending) return true;
              const eligible = getAllRows().filter(canSendLI).length;
              return eligible === 0;
            })()}
            onSelect={() => {
              const rows = getAllRows().filter(canSendLI);
              if (rows.length === 0) return;
              mockSend("li", rows);
            }}
          >
            {(() => {
              const eligible = getAllRows().filter(canSendLI).length;
              return `Send All (${eligible})`;
            })()}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DataTableExportButton
        table={table}
        filename="social-campaigns"
        excludeColumns={["select"]}
      />
    </div>
  );
};
