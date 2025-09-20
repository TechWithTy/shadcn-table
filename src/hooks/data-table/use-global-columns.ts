"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { buildGlobalDncColumn } from "./build-global-dnc-column";
import { buildGlobalDncSourceColumn } from "./build-global-dnc-source-column";
import { buildGlobalScriptColumn } from "./build-global-script-column";
import { buildGlobalAgentColumn } from "./build-global-agent-column";
import { buildGlobalTransferAgentColumn } from "./build-global-transfer-agent-column";
import { buildGlobalGoalColumn } from "./build-global-goal-column";
import { buildGlobalTimingPrefsColumn } from "./build-global-timing-prefs-column";

interface GlobalColumnConfig {
  dnc?: boolean;
  dncSource?: boolean;
  script?: boolean;
  agent?: boolean;
  transfer?: boolean;
  goal?: boolean;
  timing?: boolean;
}

interface GlobalColumnsProps<TData> {
  providedColumns: ColumnDef<TData>[];
  disableGlobalColumns?: boolean | Partial<GlobalColumnConfig>;
  tableProps: {
    data?: unknown[];
  };
}

export function useGlobalColumns<TData>(props: GlobalColumnsProps<TData>) {
  const { providedColumns, disableGlobalColumns, tableProps } = props;

  // Augment columns with global columns unless disabled by consumer
  const columns = React.useMemo<ColumnDef<TData>[]>(() => {
    const disableAll = disableGlobalColumns === true;
    const disabled = (
      (typeof disableGlobalColumns === "object" && disableGlobalColumns) ||
      {}
    ) as Record<string, boolean>;

    const hasDnc = (providedColumns ?? []).some(
      (c) => c.id === "globalDnc" || c.id === "dnc" || ("accessorKey" in c && c.accessorKey === "dnc"),
    );
    const hasDncSource = (providedColumns ?? []).some(
      (c) => c.id === "globalDncSource" || ("accessorKey" in c && c.accessorKey === "dncSource"),
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
    const goalCol = disableAll || disabled.goal ? undefined : hasGoal ? undefined : buildGlobalGoalColumn<TData>();
    const timingCol = disableAll || disabled.timing ? undefined : hasTiming ? undefined : buildGlobalTimingPrefsColumn<TData>();
    let transferCol: ColumnDef<TData> | undefined = undefined;
    if (!hasTransfer && !(disableAll || disabled.transfer)) {
      const rows = tableProps.data as unknown[] | undefined;
      const hasAnyTransfer = Array.isArray(rows)
        ? rows.some((row) => {
            const r = row as Record<string, unknown>;
            const explicit = r.transferAgentTitle ?? r.transferAgentName;
            const transfer = r.transfer as { agentId?: string; agent?: string } | undefined;
            const nested = transfer?.agentId ?? transfer?.agent;
            return (
              (typeof explicit === "string" && explicit.trim().length > 0) ||
              (typeof nested === "string" && nested.trim().length > 0)
            );
          })
        : false;
      if (hasAnyTransfer) transferCol = buildGlobalTransferAgentColumn<TData>();
    }

    const out = providedColumns.slice();
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
        (c) => c.id === "globalDnc" || c.id === "dnc" || ("accessorKey" in c && c.accessorKey === "dnc")
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
  }, [providedColumns, disableGlobalColumns, tableProps.data]);

  return columns;
}
