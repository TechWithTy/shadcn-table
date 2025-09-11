"use client";

import {
  type ColumnFiltersState,
  type ColumnDef,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type TableState,
  type Updater,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  type Parser,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  type UseQueryStateOptions,
  useQueryState,
  useQueryStates,
} from "nuqs";
import * as React from "react";
import { Badge } from "@/components/ui/badge";

import { useDebouncedCallback } from "./use-debounced-callback";
import { getSortingStateParser } from "../lib/parsers";
import type { ExtendedColumnSort } from "../types/data-table";

const PAGE_KEY = "page";
const PER_PAGE_KEY = "perPage";
const SORT_KEY = "sort";
const ARRAY_SEPARATOR = ",";
const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;

interface UseDataTableProps<TData>
  extends Omit<
      TableOptions<TData>,
      | "state"
      | "pageCount"
      | "getCoreRowModel"
      | "manualFiltering"
      | "manualPagination"
      | "manualSorting"
    >,
    Required<Pick<TableOptions<TData>, "pageCount">> {
  initialState?: Omit<Partial<TableState>, "sorting"> & {
    sorting?: ExtendedColumnSort<TData>[];
  };
  history?: "push" | "replace";
  debounceMs?: number;
  throttleMs?: number;
  clearOnDefault?: boolean;
  enableAdvancedFilter?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  startTransition?: React.TransitionStartFunction;
  // Allows consumers to opt-out of injected global columns or be selective
  disableGlobalColumns?:
    | boolean
    | Partial<{
        dnc: boolean;
        dncSource: boolean;
        script: boolean;
        agent: boolean;
        transfer: boolean;
        goal: boolean;
        timing: boolean;
      }>;
}

// Global Script title column
function buildGlobalScriptColumn<TData>(): ColumnDef<TData> {
  return {
    id: "globalSalesScriptTitle",
    header: "Script",
    accessorFn: (row) => {
      const r = row as unknown as Record<string, unknown>;
      // Prefer explicit script name fields first; fall back to aiScript if names are unavailable
      const v =
        (r["scriptTitle"] as string | undefined) ??
        (r["scriptName"] as string | undefined) ??
        (r["script"] as string | undefined) ??
        (r["aiScript"] as string | undefined) ??
        "";
      return typeof v === "string" ? v : "";
    },
    cell: ({ getValue, row }) => {
      const label = String(getValue() ?? "").trim();
      if (!label) return "—";

      const r = row.original as Record<string, any>;
      const rawStatus = (r["scriptStatus"] ?? r["scriptState"] ?? r["script_state"] ?? r["aiScriptStatus"]) as
        | string
        | undefined;
      const status = typeof rawStatus === "string" ? rawStatus.toLowerCase() : undefined;
      let chip = "I"; // Default to Active/In-use
      let title = "Active";
      if (status?.startsWith("draft") || status === "d") {
        chip = "D";
        title = "Draft";
      } else if (status?.startsWith("archiv") || status === "a") {
        chip = "A";
        title = "Archived";
      } else if (status?.startsWith("active") || status?.startsWith("in-use") || status === "i") {
        chip = "I";
        title = "Active";
      }

      const children: any[] = [];
      children.push(
        React.createElement(Badge as any, { key: "name", variant: "secondary" }, label),
      );
      children.push(
        React.createElement(
          Badge as any,
          { key: "status", variant: "outline", className: "ml-1", title },
          chip,
        ),
      );

      return React.createElement("div", { className: "flex items-center" }, ...children);
    },
    enableColumnFilter: true,
    meta: { label: "Script", variant: "text", placeholder: "Search script" },
    size: 160,
  } satisfies ColumnDef<TData>;
}

// Global Agent title column
function buildGlobalAgentColumn<TData>(): ColumnDef<TData> {
  return {
    id: "globalAgentTitle",
    header: "Agent",
    accessorFn: (row) => {
      const r = row as unknown as Record<string, unknown>;
      const v =
        (r["aiAvatarAgent"] as string | undefined) ??
        (r["agentTitle"] as string | undefined) ??
        (r["agentName"] as string | undefined) ??
        (r["agent"] as string | undefined) ??
        "";
      return typeof v === "string" ? v : "";
    },
    cell: ({ getValue, row }) => {
      const label = String(getValue() ?? "");
      const hasAgent = Boolean(label.trim());
      if (!hasAgent) return "Unassigned";

      const r = row.original as Record<string, any>;
      const aiName = r["aiAvatarAgent"];
      const isAi = typeof aiName === "string" && aiName.trim().length > 0;

      // Heuristic inference for AI channel type
      const inferAiType = (rowObj: Record<string, any>): string | null => {
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
        const canonical = (rowObj["campaignType"] || rowObj["channel"] || rowObj["primaryType"]) as string | undefined;
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
        const role = (r["agentRole"] || r["role"] || r["humanRole"]) as string | undefined;
        if (typeof role === "string" && role.trim()) return role;
        return "Closer";
      })();

      const aiType = isAi ? inferAiType(r) : null;

      // Build children: label + primary chip + secondary chip
      const children: any[] = [];
      children.push(React.createElement("span", { key: "label", className: "truncate max-w-[12rem]" }, label));
      children.push(
        React.createElement(
          Badge as any,
          { key: "primary", variant: isAi ? "secondary" : "outline" },
          isAi ? "AI" : "Human",
        ),
      );
      children.push(
        React.createElement(
          Badge as any,
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

// Global Transfer Agent column
function buildGlobalTransferAgentColumn<TData>(): ColumnDef<TData> {
  return {
    id: "globalTransferAgentTitle",
    header: "Transfer Agent",
    accessorFn: (row) => {
      const r = row as unknown as Record<string, any>;
      const transfer = (r["transfer"] as { agentId?: string } | undefined) ?? undefined;
      const v =
        (r["transferAgentTitle"] as string | undefined) ??
        (r["transferAgentName"] as string | undefined) ??
        transfer?.agentId ??
        "";
      return typeof v === "string" ? v : String(v ?? "");
    },
    cell: ({ getValue }) => String(getValue() ?? ""),
    enableColumnFilter: true,
    meta: { label: "Transfer Agent", variant: "text", placeholder: "Search transfer" },
    size: 180,
  } satisfies ColumnDef<TData>;
}

// Global Goal column (truncated)
function buildGlobalGoalColumn<TData>(): ColumnDef<TData> {
  const truncate = (s: string, max = 40) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);
  return {
    id: "globalCampaignGoal",
    header: "Goal",
    accessorFn: (row) => {
      const r = row as unknown as Record<string, unknown>;
      const v = (r["goal"] as string | undefined) ?? (r["campaignGoal"] as string | undefined) ?? "";
      return typeof v === "string" ? v : "";
    },
    cell: ({ getValue }) => {
      const v = String(getValue() ?? "");
      return truncate(v, 60);
    },
    enableColumnFilter: true,
    meta: { label: "Goal", variant: "text", placeholder: "Search goal" },
    size: 220,
  } satisfies ColumnDef<TData>;
}

// Global Timing Preferences column (compact summary)
function buildGlobalTimingPrefsColumn<TData>(): ColumnDef<TData> {
  return {
    id: "globalTimingPrefs",
    header: "Timing Prefs",
    accessorFn: (row) => {
      const r = row as unknown as Record<string, unknown>;
      // 1) New modal fields (preferred)
      const minPerDay = r["minDailyAttempts"] as number | undefined;
      const maxPerDay = r["maxDailyAttempts"] as number | undefined;
      const reachBefore = r["reachBeforeBusiness"] as boolean | undefined;
      const reachAfter = r["reachAfterBusiness"] as boolean | undefined;
      const reachWeekend = r["reachOnWeekend"] as boolean | undefined;
      const reachHolidays = r["reachOnHolidays"] as boolean | undefined;
      const tzFromLead = r["getTimezoneFromLeadLocation"] as boolean | undefined;
      const start = r["startDate"] as Date | string | undefined;
      const end = r["endDate"] as Date | string | null | undefined;

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
        if (s || e) parts.push(`Range=${s ?? "?"}${e ? ` – ${e}` : ""}`);

        const headerLine = `${prefName} • ${parts.join(", ")}`.trim();
        const beforeLine = `Before business hours=${reachBefore ? "Yes" : "No"}`;
        const afterLine = `After business hours=${reachAfter ? "Yes" : "No"}`;
        const weekendsLine = `Weekends=${reachWeekend ? "Yes" : "No"}`;
        const holidaysLine = `Holidays=${reachHolidays ? "Yes" : "No"}`;

        return `${headerLine}\n${beforeLine}\n${afterLine}\n${weekendsLine}\n${holidaysLine}`;
      }

      // 2) Legacy explicit dialing settings
      const total = r["totalDialAttempts"] as number | undefined;
      const daily = r["maxDailyAttempts"] as number | undefined;
      const cooldown = r["minMinutesBetweenCalls"] as number | undefined;
      const vmAsAns = r["countVoicemailAsAnswered"] as boolean | undefined;

      // reset parts/prefName for legacy path
      parts.length = 0;
      prefName = null;
      if (typeof total === "number") parts.push(`A=${total}`);
      if (typeof daily === "number") parts.push(`D=${daily}`);
      if (typeof cooldown === "number") parts.push(`C=${cooldown}m`);
      if (typeof vmAsAns === "boolean") parts.push(`VM=${vmAsAns ? "Yes" : "No"}`);

      // If explicit fields are missing, derive from campaign goal text
      if (parts.length === 0) {
        const goal = ((r["goal"] as string | undefined) ?? (r["campaignGoal"] as string | undefined) ?? "").toLowerCase();
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

      return parts.length > 0 ? `${prefName ? `${prefName} • ` : ""}${parts.join(", ")}` : "";
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

// Build a global DNC column that attempts to read common opt-out flags on the row
function buildGlobalDncColumn<TData>(): ColumnDef<TData> {
  return {
    id: "globalDnc",
    header: "DNC",
    accessorFn: (row) => {
      const r = row as unknown as Record<string, unknown>;
      // Common flags across app types
      const v =
        (r["dncList"] as boolean | undefined) ??
        (r["dnc"] as boolean | number | undefined) ??
        (r["optedOut"] as boolean | undefined) ??
        (r["optOut"] as boolean | undefined) ??
        (r["doNotContact"] as boolean | undefined) ??
        (r["globalDnc"] as boolean | undefined) ??
        false;
      // If numeric (e.g., campaigns summary), treat >0 as true
      if (typeof v === "number") return v > 0;
      return Boolean(v);
    },
    cell: ({ getValue, row }) => {
      // Prefer numeric count when present on the raw row
      const r = row.original as Record<string, any>;
      if (typeof r["dnc"] === "number") {
        const n = r["dnc"] as number;
        return n > 0 ? String(n) : "0";
      }
      return Boolean(getValue()) ? "Yes" : "No";
    },
    enableColumnFilter: true,
    filterFn: (row, id, value) => {
      const raw = row.getValue(id);
      const is = Boolean(raw);
      if (!Array.isArray(value)) return true;
      // value expected to be ["true"] or ["false"] or both
      const v = is ? "true" : "false";
      return value.includes(v);
    },
    meta: {
      label: "DNC",
      variant: "select",
      options: [
        { label: "Yes", value: "true" },
        { label: "No", value: "false" },
      ],
    },
    size: 70,
  } satisfies ColumnDef<TData>;
}

// Build a companion column that shows the source/reason for DNC when applicable
function buildGlobalDncSourceColumn<TData>(): ColumnDef<TData> {
  return {
    id: "globalDncSource",
    header: "DNC Source",
    accessorFn: (row) => {
      const r = row as unknown as Record<string, unknown>;
      // Explicit source fields take precedence
      const explicit =
        (r["dncSource"] as string | undefined) ??
        (r["dnc_source"] as string | undefined) ??
        (r["unsubscribeSource"] as string | undefined) ??
        (r["source"] as string | undefined);
      if (explicit && typeof explicit === "string" && explicit.trim()) return explicit;

      // Canonical type, if provided
      const canonical =
        (r["dncSourceType"] as string | undefined) ??
        (r["dnc_source_type"] as string | undefined) ??
        (r["campaignType"] as string | undefined) ??
        (r["channel"] as string | undefined) ??
        (r["primaryType"] as string | undefined);
      if (canonical && typeof canonical === "string") {
        const c = canonical.toLowerCase();
        if (c.includes("text") || c === "sms") return "Text";
        if (c.includes("email")) return "Email";
        if (c.includes("call") || c.includes("voice")) return "Call";
        if (c.includes("dm") || c.includes("social")) return "DM";
      }

      // Heuristics based on common flags
      const dncList = Boolean(r["dncList"]);
      const dncNum = typeof r["dnc"] === "number" ? (r["dnc"] as number) : undefined;
      const optedOut = Boolean(r["optedOut"] ?? r["optOut"] ?? r["doNotContact"]);
      const emailOptOut = Boolean(
        r["emailOptOut"] || r["unsubscribed"] || r["unsub"] || (r["emailOptIn"] === false)
      );
      const callOptOut = Boolean(r["scaCall"] ?? r["sca_call"] ?? r["callOptOut"] ?? r["call_opt_out"]);
      const textOptOut = Boolean(
        r["smsOptOut"] || r["textOptOut"] || r["sms_opt_out"] || r["text_opt_out"] || (r["smsOptIn"] === false)
      );
      const manualPopIn = Boolean(
        r["manualDnc"] || r["manual_dnc"] || r["manuallyAddedToDnc"] || r["addedToDnc"]
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
      const r = row.original as Record<string, any>;
      // If breakdown exists, render per-source counts
      const breakdown = (r["dncBreakdown"] ?? r["dnc_source_breakdown"]) as
        | Partial<Record<string, number>>
        | undefined;
      if (breakdown && typeof breakdown === "object") {
        const text = breakdown["text"] ?? 0;
        const email = breakdown["email"] ?? 0;
        const call = breakdown["call"] ?? 0;
        const dm = (breakdown["dm"] ?? breakdown["social"]) ?? 0;
        const manual = (breakdown["manual"] ?? breakdown["popin"]) ?? 0;
        const scrub = breakdown["scrub"] ?? 0;
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
      return v && v.trim() ? v : "—";
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
    size: 130,
  } satisfies ColumnDef<TData>;
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const {
    columns: providedColumns,
    pageCount = -1,
    initialState,
    history = "replace",
    debounceMs = DEBOUNCE_MS,
    throttleMs = THROTTLE_MS,
    clearOnDefault = false,
    enableAdvancedFilter = false,
    scroll = false,
    shallow = true,
    startTransition,
    disableGlobalColumns,
    ...tableProps
  } = props;

  const queryStateOptions = React.useMemo<
    Omit<UseQueryStateOptions<string>, "parse">
  >(
    () => ({
      history,
      scroll,
      shallow,
      throttleMs,
      debounceMs,
      clearOnDefault,
      startTransition,
    }),
    [
      history,
      scroll,
      shallow,
      throttleMs,
      debounceMs,
      clearOnDefault,
      startTransition,
    ],
  );

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    initialState?.rowSelection ?? {},
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialState?.columnVisibility ?? {});

  const [page, setPage] = useQueryState(
    PAGE_KEY,
    parseAsInteger.withOptions(queryStateOptions).withDefault(1),
  );
  const [perPage, setPerPage] = useQueryState(
    PER_PAGE_KEY,
    parseAsInteger
      .withOptions(queryStateOptions)
      .withDefault(initialState?.pagination?.pageSize ?? 10),
  );

  const pagination: PaginationState = React.useMemo(() => {
    return {
      pageIndex: page - 1, // zero-based index -> one-based index
      pageSize: perPage,
    };
  }, [page, perPage]);

  const onPaginationChange = React.useCallback(
    (updaterOrValue: Updater<PaginationState>) => {
      if (typeof updaterOrValue === "function") {
        const newPagination = updaterOrValue(pagination);
        void setPage(newPagination.pageIndex + 1);
        void setPerPage(newPagination.pageSize);
      } else {
        void setPage(updaterOrValue.pageIndex + 1);
        void setPerPage(updaterOrValue.pageSize);
      }
    },
    [pagination, setPage, setPerPage],
  );

  // Augment columns with global columns unless disabled by consumer
  const columns = React.useMemo<ColumnDef<TData>[]>(() => {
    const disableAll = disableGlobalColumns === true;
    const disabled = (
      (typeof disableGlobalColumns === "object" && disableGlobalColumns) ||
      {}
    ) as Record<string, boolean>;

    const hasDnc = (providedColumns ?? []).some(
      (c) => c.id === "globalDnc" || c.id === "dnc" || ("accessorKey" in (c as any) && (c as any).accessorKey === "dnc"),
    );
    const hasDncSource = (providedColumns ?? []).some(
      (c) => c.id === "globalDncSource" || ("accessorKey" in (c as any) && (c as any).accessorKey === "dncSource"),
    );
    const hasScript = (providedColumns ?? []).some((c) => c.id === "globalSalesScriptTitle");
    const hasAgent = (providedColumns ?? []).some((c) => c.id === "globalAgentTitle");
    const hasTransfer = (providedColumns ?? []).some((c) => c.id === "globalTransferAgentTitle");
    const hasGoal = (providedColumns ?? []).some((c) => c.id === "globalCampaignGoal");
    const hasTiming = (providedColumns ?? []).some((c) => c.id === "globalTimingPrefs");

    // Always make sure DNC column exists; if user already has one, keep as-is but still consider injecting source next to it
    const dncCol = disableAll || disabled.dnc ? undefined : hasDnc ? undefined : buildGlobalDncColumn<TData>();
    const sourceCol = disableAll || disabled.dncSource ? undefined : hasDncSource ? undefined : buildGlobalDncSourceColumn<TData>();
    const scriptCol = disableAll || disabled.script ? undefined : hasScript ? undefined : buildGlobalScriptColumn<TData>();
    const agentCol = disableAll || disabled.agent ? undefined : hasAgent ? undefined : buildGlobalAgentColumn<TData>();
    // Only inject Transfer Agent if any row appears to have transfer metadata
    let transferCol: ColumnDef<TData> | undefined = undefined;
    if (!hasTransfer && !(disableAll || disabled.transfer)) {
      const rows = (tableProps as any)?.data as unknown[] | undefined;
      const hasAnyTransfer = Array.isArray(rows)
        ? rows.some((row) => {
            const r = row as Record<string, any>;
            const explicit = r["transferAgentTitle"] ?? r["transferAgentName"]; 
            const nested = (r["transfer"] && (r["transfer"].agentId || r["transfer"].agent)) ?? undefined;
            return (
              (typeof explicit === "string" && explicit.trim().length > 0) ||
              (typeof nested === "string" && nested.trim().length > 0)
            );
          })
        : false;
      if (hasAnyTransfer) transferCol = buildGlobalTransferAgentColumn<TData>();
    }
    const goalCol = disableAll || disabled.goal ? undefined : hasGoal ? undefined : buildGlobalGoalColumn<TData>();
    const timingCol = disableAll || disabled.timing ? undefined : hasTiming ? undefined : buildGlobalTimingPrefsColumn<TData>();

    let out = providedColumns.slice();
    const controlsIdx = out.findIndex((c) => c.id === "controls");
    const selectIdx = out.findIndex((c) => c.id === "select");
    let insertBaseIdx =
      controlsIdx >= 0
        ? controlsIdx + 1
        : selectIdx >= 0
          ? selectIdx + 1
          : 0;

    if (dncCol) {
      out.splice(insertBaseIdx, 0, dncCol);
      insertBaseIdx += 1;
    } else {
      // If DNC already exists, place source right after the existing DNC
      const existingDncIdx = out.findIndex(
        (c) => c.id === "globalDnc" || c.id === "dnc" || ((c as any).accessorKey === "dnc")
      );
      if (existingDncIdx >= 0) insertBaseIdx = existingDncIdx + 1;
    }

    if (sourceCol) {
      out.splice(insertBaseIdx, 0, sourceCol);
      insertBaseIdx += 1;
    }
    // Insert additional global columns following the DNC pair
    const tailCols = [scriptCol, agentCol, transferCol, goalCol, timingCol].filter(Boolean) as ColumnDef<TData>[];
    if (tailCols.length > 0) {
      out.splice(insertBaseIdx, 0, ...tailCols);
    }

    return out;
  }, [providedColumns, disableGlobalColumns]);

  const columnIds = React.useMemo(() => {
    return new Set(
      columns.map((column) => column.id).filter(Boolean) as string[],
    );
  }, [columns]);

  const [sorting, setSorting] = useQueryState(
    SORT_KEY,
    getSortingStateParser<TData>(columnIds)
      .withOptions(queryStateOptions)
      .withDefault(initialState?.sorting ?? []),
  );

  const onSortingChange = React.useCallback(
    (updaterOrValue: Updater<SortingState>) => {
      if (typeof updaterOrValue === "function") {
        const newSorting = updaterOrValue(sorting);
        setSorting(newSorting as ExtendedColumnSort<TData>[]);
      } else {
        setSorting(updaterOrValue as ExtendedColumnSort<TData>[]);
      }
    },
    [sorting, setSorting],
  );

  const filterableColumns = React.useMemo(() => {
    if (enableAdvancedFilter) return [];

    return columns.filter((column) => column.enableColumnFilter);
  }, [columns, enableAdvancedFilter]);

  const filterParsers = React.useMemo(() => {
    if (enableAdvancedFilter) return {};

    return filterableColumns.reduce<
      Record<string, Parser<string> | Parser<string[]>>
    >((acc, column) => {
      if (column.meta?.options) {
        acc[column.id ?? ""] = parseAsArrayOf(
          parseAsString,
          ARRAY_SEPARATOR,
        ).withOptions(queryStateOptions);
      } else {
        acc[column.id ?? ""] = parseAsString.withOptions(queryStateOptions);
      }
      return acc;
    }, {});
  }, [filterableColumns, queryStateOptions, enableAdvancedFilter]);

  const [filterValues, setFilterValues] = useQueryStates(filterParsers);

  const debouncedSetFilterValues = useDebouncedCallback(
    (values: typeof filterValues) => {
      void setPage(1);
      void setFilterValues(values);
    },
    debounceMs,
  );

  const initialColumnFilters: ColumnFiltersState = React.useMemo(() => {
    if (enableAdvancedFilter) return [];

    return Object.entries(filterValues).reduce<ColumnFiltersState>(
      (filters, [key, value]) => {
        if (value !== null) {
          const processedValue = Array.isArray(value)
            ? value
            : typeof value === "string" && /[^a-zA-Z0-9]/.test(value)
              ? value.split(/[^a-zA-Z0-9]+/).filter(Boolean)
              : [value];

          filters.push({
            id: key,
            value: processedValue,
          });
        }
        return filters;
      },
      [],
    );
  }, [filterValues, enableAdvancedFilter]);

  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(initialColumnFilters);

  const onColumnFiltersChange = React.useCallback(
    (updaterOrValue: Updater<ColumnFiltersState>) => {
      if (enableAdvancedFilter) return;

      setColumnFilters((prev) => {
        const next =
          typeof updaterOrValue === "function"
            ? updaterOrValue(prev)
            : updaterOrValue;

        const filterUpdates = next.reduce<
          Record<string, string | string[] | null>
        >((acc, filter) => {
          if (filterableColumns.find((column) => column.id === filter.id)) {
            acc[filter.id] = filter.value as string | string[];
          }
          return acc;
        }, {});

        for (const prevFilter of prev) {
          if (!next.some((filter) => filter.id === prevFilter.id)) {
            filterUpdates[prevFilter.id] = null;
          }
        }

        debouncedSetFilterValues(filterUpdates);
        return next;
      });
    },
    [debouncedSetFilterValues, filterableColumns, enableAdvancedFilter],
  );

  // If consumer provided a custom columnOrder, optionally insert global columns after 'select' unless disabled
  const adjustedInitialState = React.useMemo(() => {
    if (!initialState?.columnOrder) return initialState;
    const order = initialState.columnOrder.slice();
    const disableAll = disableGlobalColumns === true;
    const disabled = (
      (typeof disableGlobalColumns === "object" && disableGlobalColumns) ||
      {}
    ) as Record<string, boolean>;
    const has = order.includes("globalDnc");
    const hasSrc = order.includes("globalDncSource");
    const ensure = (id: string, at: number) => {
      if (!order.includes(id)) order.splice(at, 0, id);
      return order.indexOf(id) + 1;
    };
    const controlsIdx = order.indexOf("controls");
    const selectIdx = order.indexOf("select");
    let insertAt = controlsIdx >= 0 ? controlsIdx + 1 : selectIdx >= 0 ? selectIdx + 1 : 0;

    if (!has && !(disableAll || disabled.dnc)) {
      order.splice(insertAt, 0, "globalDnc");
      insertAt += 1;
    } else {
      // If DNC exists, ensure source is placed right after it when adding
      const dncIdx = order.indexOf("globalDnc");
      if (dncIdx >= 0) insertAt = dncIdx + 1;
    }

    if (!hasSrc && !(disableAll || disabled.dncSource)) {
      order.splice(insertAt, 0, "globalDncSource");
      insertAt += 1;
    }

    // Add the rest in sequence
    if (!(disableAll || disabled.script)) insertAt = ensure("globalSalesScriptTitle", insertAt);
    if (!(disableAll || disabled.agent)) insertAt = ensure("globalAgentTitle", insertAt);
    if (!(disableAll || disabled.transfer)) insertAt = ensure("globalTransferAgentTitle", insertAt);
    if (!(disableAll || disabled.goal)) insertAt = ensure("globalCampaignGoal", insertAt);
    if (!(disableAll || disabled.timing)) insertAt = ensure("globalTimingPrefs", insertAt);

    return { ...initialState, columnOrder: order };
  }, [initialState, disableGlobalColumns]);

  const table = useReactTable({
    ...tableProps,
    columns,
    initialState: adjustedInitialState,
    pageCount,
    state: {
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    defaultColumn: {
      ...tableProps.defaultColumn,
      enableColumnFilter: false,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: true,
    manualSorting: false,
    manualFiltering: false,
  });

  return { table, shallow, debounceMs, throttleMs };
}
