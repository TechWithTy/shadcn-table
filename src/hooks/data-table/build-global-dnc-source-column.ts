"use client";

import type { ColumnDef } from "@tanstack/react-table";

// Build a companion column that shows the source/reason for DNC when applicable
export function buildGlobalDncSourceColumn<TData>(): ColumnDef<TData> {
  return {
    id: "globalDncSource",
    header: "DNC Source",
    accessorFn: (row) => {
      const r = row as unknown as Record<string, unknown>;
      // Explicit source fields take precedence
      const explicit =
        r.dncSource ??
        r.dnc_source ??
        r.unsubscribeSource ??
        r.source;
      if (explicit && typeof explicit === "string" && explicit.trim()) return explicit;

      // Canonical type, if provided
      const canonical =
        r.dncSourceType ??
        r.dnc_source_type ??
        r.campaignType ??
        r.channel ??
        r.primaryType;
      if (canonical && typeof canonical === "string") {
        const c = canonical.toLowerCase();
        if (c.includes("text") || c === "sms") return "Text";
        if (c.includes("email")) return "Email";
        if (c.includes("call") || c.includes("voice")) return "Call";
        if (c.includes("dm") || c.includes("social")) return "DM";
      }

      // Heuristics based on common flags
      const dncList = !!r.dncList;
      const dncNum = typeof r.dnc === "number" ? (r.dnc as number) : undefined;
      const optedOut = !!(r.optedOut ?? r.optOut ?? r.doNotContact);
      const emailOptOut = Boolean(
        r.emailOptOut || r.unsubscribed || r.unsub || (r.emailOptIn === false)
      );
      const callOptOut = !!(r.scaCall ?? r.sca_call ?? r.callOptOut ?? r.call_opt_out);
      const textOptOut = Boolean(
        r.smsOptOut || r.textOptOut || r.sms_opt_out || r.text_opt_out || (r.smsOptIn === false)
      );
      const manualPopIn = Boolean(
        r.manualDnc || r.manual_dnc || r.manuallyAddedToDnc || r.addedToDnc
      );

      if (textOptOut) return "Text Opt-out";
      if (emailOptOut) return "Email";
      if (callOptOut) return "Call";
      if (manualPopIn) return "Pop-in to DNC";
      if (dncList) return "Scrub List";
      if (typeof dncNum === "number" && dncNum > 0) {
        // Try to infer campaign type to be specific instead of generic "Campaign DNC"
        const keys = Object.keys(r);
        const hasAnyKey = (names: string[]) => names.some((n) => keys.includes(n));
        const isCallLike = hasAnyKey([
          "callInformation",
          "callType",
          "callerNumber",
          "endedReason",
        ]);
        const isDmLike = hasAnyKey(["platform", "actions"]);
        const isEmailLike = hasAnyKey([
          "subject",
          "from",
          "to",
          "email",
          "emailCampaignId",
        ]);
        const isTextLike = hasAnyKey([
          "smsOptOut",
          "smsOptIn",
          "textOptOut",
          "message",
          "messages",
        ]);

        // Prefer text/email/dm over call so not everything collapses to Call
        if (isTextLike) return "Text";
        if (isEmailLike) return "Email";
        if (isDmLike) return "DM";
        if (isCallLike) return "Call";
        return "";
      }
      if (optedOut) return "Text Opt-out";
      return "";
    },
    cell: ({ getValue, row }) => {
      const r = row.original as Record<string, unknown>;
      // If breakdown exists, render per-source counts
      const breakdown = (r.dncBreakdown ?? r.dnc_source_breakdown) as
        | Partial<Record<string, number>>
        | undefined;
      if (breakdown && typeof breakdown === "object") {
        const text = breakdown.text ?? 0;
        const email = breakdown.email ?? 0;
        const call = breakdown.call ?? 0;
        const dm = (breakdown.dm ?? breakdown.social) ?? 0;
        const manual = (breakdown.manual ?? breakdown.popin) ?? 0;
        const scrub = breakdown.scrub ?? 0;
        const parts: string[] = [];
        if (text) parts.push(`Text:${text}`);
        if (email) parts.push(`Email:${email}`);
        if (call) parts.push(`Call:${call}`);
        if (dm) parts.push(`DM:${dm}`);
        if (manual) parts.push(`Pop-in:${manual}`);
        if (scrub) parts.push(`Scrub:${scrub}`);
        const out = parts.join(" • ");
        return out.trim() ? out : "—";
      }
      const v = (getValue() as string) ?? "";
      return v?.trim() ? v : "—";
    },
    enableColumnFilter: true,
    filterFn: (row, id, value) => {
      const raw = (row.getValue(id) as string) ?? "";
      if (!Array.isArray(value) || value.length === 0) return true;
      return value.includes(raw) || (raw === "" && value.includes("(empty)"));
    },
    meta: {
      label: "DNC Source",
      variant: "select",
      options: [
        { label: "Text Opt-out", value: "Text Opt-out" },
        { label: "Email", value: "Email" },
        { label: "Call", value: "Call" },
        { label: "DM", value: "DM" },
        { label: "Pop-in to DNC", value: "Pop-in to DNC" },
        { label: "Scrub List", value: "Scrub List" },
        { label: "(empty)", value: "(empty)" },
      ],
    },
    size: 140,
  } satisfies ColumnDef<TData>;
}
