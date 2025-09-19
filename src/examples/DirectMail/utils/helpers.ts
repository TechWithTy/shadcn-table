import type { CampaignBase } from "../../../../../../types/_dashboard/campaign";
import type { DirectMailCampaign } from "./mock";

// Support legacy records that may carry a top-level templateId
type LegacyDirectMailCampaign = { templateId?: string };

export function filterCampaigns<
    T extends CampaignBase & Partial<{ calls: number; leads: number; inQueue: number }>,
>(
    data: T[],
    query: string,
): T[] {
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
            (r as Partial<DirectMailCampaign>)?.template?.name,
            (r as Partial<DirectMailCampaign>)?.template?.id ?? (r as LegacyDirectMailCampaign)?.templateId,
            (r as Partial<DirectMailCampaign>)?.transfer?.type,
        ]
            .filter(Boolean)
            .map((v) => String(v).toLowerCase())
            .some((s) => s.includes(q)),
    );
}

export function summarizeRows<
    T extends CampaignBase & Partial<{ calls: number; leads: number; inQueue: number }>,
>(rows: T[]): string {
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
