import type { DemoLead, DemoRow } from "../types";

// Local type mirror to avoid cross-package imports
export type InputFieldLocal =
  | "firstName"
  | "lastName"
  | "address"
  | "email"
  | "phone"
  | "socialTag";

export type SingleSkipTraceInit = {
  type: "single";
  availableListNames?: string[];
  listName?: string;
} & Partial<
  Record<
    | "firstName"
    | "lastName"
    | "address"
    | "email"
    | "phone"
    | "socialMedia"
    | "domain",
    string
  >
>;

export type ListSkipTraceInit = {
  type: "list";
  file?: File;
  availableListNames?: string[];
  availableFields?: InputFieldLocal[];
  availableLeadCount?: number;
  listCounts?: Record<string, number>;
  availableLists?: { name: string; count: number }[];
};

export type SkipTraceInit = ListSkipTraceInit | SingleSkipTraceInit;

// Prefer nested lead length if present, else fall back to row.records
export const getRowLeadCount = (row: DemoRow): number => {
  const nested = (row as unknown as { leads?: DemoLead[] }).leads;
  if (Array.isArray(nested)) return nested.length;
  const rec = (row as unknown as { records?: number }).records;
  return typeof rec === "number" && Number.isFinite(rec) ? rec : 0;
};

export const computeAvailableFields = (rows: DemoRow[]): InputFieldLocal[] => {
  const have: Record<InputFieldLocal, boolean> = {
    firstName: false,
    lastName: false,
    address: false,
    email: false,
    phone: false,
    socialTag: false,
  };
  for (const row of rows) {
    const leads: DemoLead[] = row.leads ?? [];
    for (const lead of leads) {
      const nameParts = (lead.name || "").trim().split(/\s+/);
      if ((nameParts[0] ?? "").length) have.firstName = true;
      if ((nameParts.slice(1).join(" ") || "").length) have.lastName = true;
      if (lead.address && String(lead.address).length) have.address = true;
      if (lead.email && String(lead.email).length) have.email = true;
      if (lead.phone && String(lead.phone).length) have.phone = true;
      const social = lead.socials?.[0]?.url || lead.possibleHandles?.[0]?.username;
      if (social && String(social).length) have.socialTag = true;
    }
  }
  return (Object.keys(have) as InputFieldLocal[]).filter((k) => have[k]);
};

export const summarizeRows = (rows: DemoRow[]) => {
  const count = rows.length;
  const totals = rows.reduce(
    (acc, r) => ({
      records: acc.records + r.records,
      phone: acc.phone + r.phone,
      emails: acc.emails + r.emails,
      socials: acc.socials + r.socials,
    }),
    { records: 0, phone: 0, emails: 0, socials: 0 },
  );
  const avg = (n: number) => (count ? Math.round((n / count) * 100) / 100 : 0);
  return [
    `Lists: ${count}`,
    `Leads: ${totals.records}`,
    `Phones: ${totals.phone} (avg ${avg(totals.phone)})`,
    `Emails: ${totals.emails} (avg ${avg(totals.emails)})`,
    `Socials: ${totals.socials} (avg ${avg(totals.socials)})`,
  ].join("\n");
};
