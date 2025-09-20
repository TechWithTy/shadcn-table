"use client";

import * as React from "react";
import type { TableState } from "@tanstack/react-table";

interface GlobalColumnConfig {
  dnc?: boolean;
  dncSource?: boolean;
  script?: boolean;
  agent?: boolean;
  transfer?: boolean;
  goal?: boolean;
  timing?: boolean;
}

interface AdjustedInitialStateProps {
  initialState?: Partial<TableState>;
  disableGlobalColumns?: boolean | Partial<GlobalColumnConfig>;
}

export function useAdjustedInitialState(props: AdjustedInitialStateProps) {
  const { initialState, disableGlobalColumns } = props;

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

  return adjustedInitialState;
}
