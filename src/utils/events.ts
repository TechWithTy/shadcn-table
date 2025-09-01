import type React from "react";

/**
 * Stop propagation for clicks inside interactive cells so row-level handlers
 * (e.g., open summary modal) are not triggered.
 */
export function stopRowClick(e: React.MouseEvent) {
  e.stopPropagation();
}

/**
 * Wrap a handler to always stop propagation before invoking it.
 */
export function withStopPropagation<T extends React.SyntheticEvent>(
  handler?: (e: T) => void,
) {
  return (e: T) => {
    e.stopPropagation();
    handler?.(e);
  };
}
