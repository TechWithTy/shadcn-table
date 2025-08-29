import type { CallCampaign } from "../../../../../../types/_dashboard/campaign";

export function summarizeRows(rows: CallCampaign[]): string {
  const count = rows.length;
  const totals = rows.reduce(
    (acc, r) => {
      acc.calls += r.calls ?? 0;
      acc.leads += r.leads ?? 0;
      acc.inQueue += r.inQueue ?? 0;
      return acc;
    },
    { calls: 0, leads: 0, inQueue: 0 },
  );
  const avg = (n: number) => (count ? Math.round((n / count) * 100) / 100 : 0);
  return [
    `Rows: ${count}`,
    `Actions: ${totals.calls} (avg ${avg(totals.calls)})`,
    `Leads: ${totals.leads} (avg ${avg(totals.leads)})`,
    `Queued: ${totals.inQueue} (avg ${avg(totals.inQueue)})`,
  ].join("\n");
}
