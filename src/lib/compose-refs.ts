/**
 * @see https://github.com/radix-ui/primitives/blob/main/packages/react/compose-refs/src/compose-refs.tsx
 */

import * as React from "react";

type PossibleRef<T> = React.Ref<T> | undefined;

/**
 * Set a given ref to a given value
 * This utility takes care of different types of refs: callback refs and RefObject(s)
 */
function setRef<T>(ref: PossibleRef<T>, value: T | null): (() => void) | undefined {
  if (typeof ref === "function") {
    // In React 19, a ref callback can optionally return a cleanup function
    const ret = (ref as (instance: T | null) => undefined | (() => void))(value);
    return typeof ret === "function" ? (ret as () => void) : undefined;
  }

  if (ref !== null && ref !== undefined) {
    // React's RefObject<T> types `current` as readonly, but at runtime React updates it.
    // When composing refs we intentionally set `current` on mutable refs.
    // Cast to MutableRefObject to satisfy TypeScript while preserving runtime behavior.
    (ref as unknown as React.MutableRefObject<T | null>).current = value as unknown as T | null;
  }
}

/**
 * A utility to compose multiple refs together
 * Accepts callback refs and RefObject(s)
 */
function composeRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  return (node: T | null) => {
    let hasCleanup = false;
    const cleanups = refs.map((ref) => {
      const cleanup = setRef(ref, node);
      if (!hasCleanup && typeof cleanup === "function") {
        hasCleanup = true;
      }
      return cleanup;
    });

    // React <19 will log an error to the console if a callback ref returns a
    // value. We don't use ref cleanups internally so this will only happen if a
    // user's ref callback returns a value, which we only expect if they are
    // using the cleanup functionality added in React 19.
    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i];
          if (typeof cleanup === "function") {
            (cleanup as () => void)();
          } else {
            setRef(refs[i], null);
          }
        }
      };
    }
  };
}

/**
 * A custom hook that composes multiple refs
 * Accepts callback refs and RefObject(s)
 */
function useComposedRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T> {
  // biome-ignore lint/correctness/useExhaustiveDependencies: we don't want to re-run this callback when the refs change
  return React.useCallback(composeRefs(...refs), refs);
}

export { composeRefs, useComposedRefs };
