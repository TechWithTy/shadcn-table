"use client";

import type { ColumnDef } from "@tanstack/react-table";

// Global Timing Preferences column (compact summary)
export function buildGlobalTimingPrefsColumn<TData>(): ColumnDef<TData> {
  return {
    id: "globalTimingPrefs",
    header: "Timing Prefs",
    accessorFn: (row) => {
      const r = row as unknown as Record<string, unknown>;
      // 1) New modal fields (preferred)
      const minPerDay = r.minDailyAttempts as number | undefined;
      const maxPerDay = r.maxDailyAttempts as number | undefined;
      const reachBefore = r.reachBeforeBusiness as boolean | undefined;
      const reachAfter = r.reachAfterBusiness as boolean | undefined;
      const reachWeekend = r.reachOnWeekend as boolean | undefined;
      const reachHolidays = r.reachOnHolidays as boolean | undefined;
      const tzFromLead = r.getTimezoneFromLeadLocation as boolean | undefined;
      const start = r.startDate as Date | string | undefined;
      const end = r.endDate as Date | string | null | undefined;

      const parts: string[] = [];
      let prefName: string | null = null;

      const fmtDate = (d?: Date | string | null) => {
        if (!d) return undefined;
        const val = typeof d === "string" ? new Date(d) : (d as Date);
        // fallback if invalid
        if (Number.isNaN(val.getTime())) return undefined;
        return val.toLocaleDateString();
      };

      // If any of the modal fields are present, build a labeled summary from them
      const hasModalSignals =
        minPerDay !== undefined ||
        maxPerDay !== undefined ||
        reachBefore !== undefined ||
        reachAfter !== undefined ||
        reachWeekend !== undefined ||
        reachHolidays !== undefined ||
        tzFromLead !== undefined ||
        start !== undefined ||
        end !== undefined;

      if (hasModalSignals) {
        prefName = "Planned";
        if (typeof minPerDay === "number") parts.push(`Min/day=${minPerDay}`);
        if (typeof maxPerDay === "number") parts.push(`Max/day=${maxPerDay}`);

        if (typeof tzFromLead === "boolean") parts.push(`Timezone=${tzFromLead ? "Lead location" : "Account default"}`);

        const s = fmtDate(start);
        const e = fmtDate(end ?? undefined);
        if (s || e) parts.push(`Range=${s ?? "?"}${e ? `  – ${e}` : ""}`);

        const headerLine = `${prefName} • ${parts.join(", ")}`.trim();
        const beforeLine = `Before business hours=${reachBefore ? "Yes" : "No"}`;
        const afterLine = `After business hours=${reachAfter ? "Yes" : "No"}`;
        const weekendsLine = `Weekends=${reachWeekend ? "Yes" : "No"}`;
        const holidaysLine = `Holidays=${reachHolidays ? "Yes" : "No"}`;

        return `${headerLine}\n${beforeLine}\n${afterLine}\n${weekendsLine}\n${holidaysLine}`;
      }

      // 2) Legacy explicit dialing settings
      const total = r.totalDialAttempts as number | undefined;
      const daily = r.maxDailyAttempts as number | undefined;
      const cooldown = r.minMinutesBetweenCalls as number | undefined;
      const vmAsAns = r.countVoicemailAsAnswered as boolean | undefined;

      // reset parts/prefName for legacy path
      parts.length = 0;
      prefName = null;
      if (typeof total === "number") parts.push(`A=${total}`);
      if (typeof daily === "number") parts.push(`D=${daily}`);
      if (typeof cooldown === "number") parts.push(`C=${cooldown}m`);
      if (typeof vmAsAns === "boolean") parts.push(`VM=${vmAsAns ? "Yes" : "No"}`);

      // If explicit fields are missing, derive from campaign goal text
      if (parts.length === 0) {
        const goal = (r.goal ?? r.campaignGoal ?? "").toString().toLowerCase();
        if (goal) {
          const isAggressive = /(aggressive|speed|speed\s*to\s*lead|fast|hot|urgent)/.test(goal);
          const isBalanced = /(balanced|standard|follow[-\s]?up|convert|appointment)/.test(goal);
          const isNurture = /(nurture|long[-\s]?term|light|drip|awareness)/.test(goal);

          if (isAggressive) {
            prefName = "Aggressive";
            parts.push("A=7", "D=3", "C=15m", "VM=No");
          } else if (isBalanced) {
            prefName = "Balanced";
            parts.push("A=5", "D=2", "C=90m", "VM=No");
          } else if (isNurture) {
            prefName = "Nurture";
            parts.push("A=3", "D=1", "C=240m", "VM=No");
          }
        }
      }

      // If explicit fields existed but no mapping name, mark as Custom
      if (!prefName && parts.length > 0) {
        prefName = "Custom";
      }

      return parts.length > 0 ? `${prefName ? ` ${prefName} • ` : ""}${parts.join(", ")}` : "";
    },
    cell: ({ getValue }) => {
      const v = String(getValue() ?? "");
      return v.trim() ? v : "—";
    },
    enableColumnFilter: true,
    meta: { label: "Timing Prefs", variant: "text", placeholder: "Search timing" },
    size: 160,
  } satisfies ColumnDef<TData>;
}
