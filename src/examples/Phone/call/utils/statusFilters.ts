import type { Table } from "@tanstack/react-table";
import type { CallCampaign } from "@/types/_dashboard/campaign";

export const STATUS_GROUPS: Record<string, string[] | undefined> = {
  All: undefined,
  Scheduled: ["pending", "queued"],
  Active: ["delivering"],
  Completed: ["completed", "delivered", "read", "unread"],
  Canceled: ["failed", "missed"],
};

export function sameSet(a?: string[], b?: string[]) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  const A = new Set(a);
  for (const v of b) if (!A.has(v)) return false;
  return true;
}

export function getStatusColumn(table: Table<CallCampaign>) {
  return table.getColumn("status");
}

export function setStatusGroup(table: Table<CallCampaign>, vals?: string[]) {
  getStatusColumn(table)?.setFilterValue(vals);
}

export function isGroupActive(table: Table<CallCampaign>, vals?: string[]) {
  const statusColumn = getStatusColumn(table);
  const current = (statusColumn?.getFilterValue() as string[] | undefined) ?? undefined;
  return sameSet(current, vals);
}
