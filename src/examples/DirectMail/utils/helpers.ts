import type { CallCampaign } from "../../../../../../types/_dashboard/campaign";

export function filterCampaigns<T extends CallCampaign>(data: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return data;
  return data.filter((r) =>
    [
      r.name,
      r.status,
      String(r.calls),
      String(r.leads),
      String(r.inQueue),
      // Direct Mail additions
      (r as any)?.template?.name,
      (r as any)?.template?.id ?? (r as any)?.templateId,
      (r as any)?.transfer?.type,
    ]
      .filter(Boolean)
      .map((v) => String(v).toLowerCase())
      .some((s) => s.includes(q)),
  );
}

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
    `Mailers: ${totals.calls} (avg ${avg(totals.calls)})`,
    `Leads: ${totals.leads} (avg ${avg(totals.leads)})`,
    `Queued: ${totals.inQueue} (avg ${avg(totals.inQueue)})`,
  ].join("\n");
}
