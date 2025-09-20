"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import * as React from "react";

// Global Agent title column
export function buildGlobalAgentColumn<TData>(): ColumnDef<TData> {
  return {
    id: "globalAgentTitle",
    header: "Agent",
    accessorFn: (row) => {
      const r = row as unknown as Record<string, unknown>;
      const v =
        r.aiAvatarAgent ??
        r.agentTitle ??
        r.agentName ??
        r.agent ??
        "";
      return typeof v === "string" ? v : "";
    },
    cell: ({ getValue, row }) => {
      const label = String(getValue() ?? "");
      const hasAgent = Boolean(label.trim());
      if (!hasAgent) return "Unassigned";

      const r = row.original as Record<string, unknown>;
      const aiName = r.aiAvatarAgent;
      const isAi = typeof aiName === "string" && aiName.trim().length > 0;

      // Heuristic inference for AI channel type
      const inferAiType = (rowObj: Record<string, unknown>): string | null => {
        const keys = Object.keys(rowObj);
        const hasAny = (names: string[]) => names.some((n) => keys.includes(n));
        // Voice/Call indicators
        const isVoice = hasAny([
          "callInformation",
          "callType",
          "callerNumber",
          "phoneCallProvider",
          "phoneCallTransport",
        ]);
        if (isVoice) return "Voice";
        // Text/SMS indicators
        const isText = hasAny([
          "messages",
          "message",
          "smsOptOut",
          "smsOptIn",
          "textOptOut",
        ]);
        if (isText) return "Text";
        // Direct Mail indicators
        const isDm = hasAny(["mailType", "mailSize", "template", "dm", "directMail"]);
        if (isDm) return "Direct Mail";
        // Social indicators
        const isSocial = hasAny(["platform", "actions", "social"]);
        if (isSocial) return "Social";
        // Campaign type hints
        const canonical = (rowObj.campaignType || rowObj.channel || rowObj.primaryType) as string | undefined;
        if (canonical && typeof canonical === "string") {
          const c = canonical.toLowerCase();
          if (c.includes("call") || c.includes("voice")) return "Voice";
          if (c.includes("text") || c === "sms") return "Text";
          if (c.includes("mail")) return "Direct Mail";
          if (c.includes("social") || c.includes("dm")) return "Social";
        }
        return null;
      };

      // Human role label (fallback to Closer)
      const humanRole = ((): string => {
        const role = (r.agentRole || r.role || r.humanRole) as string | undefined;
        if (typeof role === "string" && role.trim()) return role;
        return "Closer";
      })();

      const aiType = isAi ? inferAiType(r) : null;

      // Build children: label + primary chip + secondary chip
      const children: React.ReactNode[] = [];
      children.push(React.createElement("span", { key: "label", className: "truncate max-w-[12rem]" }, label));
      children.push(
        React.createElement(
          Badge,
          { key: "primary", variant: isAi ? "secondary" : "outline" },
          isAi ? "AI" : "Human",
        ),
      );
      children.push(
        React.createElement(
          Badge,
          { key: "secondary", variant: isAi ? "outline" : "secondary", className: "ml-0.5" },
          isAi ? (aiType ?? "Agent") : humanRole,
        ),
      );

      return React.createElement("div", { className: "flex items-center gap-2" }, ...children);
    },
    enableColumnFilter: true,
    meta: { label: "Agent", variant: "text", placeholder: "Search agent" },
    size: 140,
  } satisfies ColumnDef<TData>;
}
