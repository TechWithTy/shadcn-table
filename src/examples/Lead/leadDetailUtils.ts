import type { DemoLead } from "./types";

export function formatLeadDossier(lead: DemoLead): string {
  const phones = lead.possiblePhones.length
    ? `Phones: ${lead.possiblePhones.join(", ")}`
    : "Phones: -";
  const emails = lead.possibleEmails.length
    ? `Emails: ${lead.possibleEmails.join(", ")}`
    : "Emails: -";
  const handles = lead.possibleHandles.length
    ? `Usernames: ${lead.possibleHandles
        .map((h) => `${h.platform}:${h.username}${h.url ? `(${h.url})` : ""}`)
        .join(", ")}`
    : "Usernames: -";
  return [
    `Lead: ${lead.name}`,
    `Address: ${lead.address}`,
    `Associated Address: ${lead.associatedAddress}`,
    `Address Verified: ${lead.addressVerified ? "Yes" : "No"}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email}`,
    `Is iPhone: ${lead.isIPhone ? "Yes" : "No"}`,
    `Verified — Phone: ${lead.phoneVerified ? "Yes" : "No"}, Email: ${lead.emailVerified ? "Yes" : "No"}, Social: ${lead.socialVerified ? "Yes" : "No"}`,
    phones,
    emails,
    handles,
  ].join("\n");
}

export function formatLeadDossierSummary(lead: DemoLead): string {
  const phones = lead.possiblePhones.length;
  const emails = lead.possibleEmails.length;
  const platforms = Array.from(new Set(lead.possibleHandles.map((h) => h.platform)));
  const topHandles = lead.possibleHandles
    .slice(0, 3)
    .map((h) => `${h.platform}:${h.username}`);
  const parts: string[] = [];
  parts.push(`Phones: ${phones}`);
  parts.push(`Emails: ${emails}`);
  if (platforms.length) parts.push(`Platforms: ${platforms.join(", ")}`);
  if (topHandles.length)
    parts.push(
      `Top: ${topHandles.join(", ")}${lead.possibleHandles.length > 3 ? "…" : ""}`,
    );
  return parts.join(" • ");
}
