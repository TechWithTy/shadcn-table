"use client";

import { parseAsInteger, type UseQueryStateOptions, useQueryState } from "../../nuqs-shared";
import * as React from "react";
import { useDebouncedCallback } from "../use-debounced-callback";
import { getSortingStateParser } from "../../lib/parsers";
import type { ExtendedColumnSort } from "../../types/data-table";
import type { SortingState, OnChangeFn } from "@tanstack/react-table";

const PAGE_KEY = "page";
const PER_PAGE_KEY = "perPage";
const SORT_KEY = "sort";
const DEBOUNCE_MS = 300;

interface NuqsIntegrationProps<TData> {
  history?: "push" | "replace";
  debounceMs?: number;
  throttleMs?: number;
  clearOnDefault?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  startTransition?: React.TransitionStartFunction;
  initialState?: {
    sorting?: ExtendedColumnSort<TData>[];
    pagination?: {
      pageIndex: number;
      pageSize: number;
    };
  };
  columnIds: Set<string>;
}

export function useNuqsIntegration<TData>(props: NuqsIntegrationProps<TData>) {
  const {
    history = "replace",
    debounceMs = DEBOUNCE_MS,
    throttleMs = 50,
    clearOnDefault = false,
    scroll = false,
    shallow = true,
    startTransition,
    initialState,
    columnIds,
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

  // Safe wrappers: if nuqs adapter is missing, fall back to local state with compatible signatures to avoid crashes.
  type Setter<T> = (value: T | ((old: T | null) => T | null)) => Promise<URLSearchParams>;
  const makeLocalQueryState = <T,>(initial: T): [T, Setter<T>] => {
    const [val, setVal] = React.useState<T>(initial);
    const set: Setter<T> = async (next) => {
      setVal((prev) => (typeof next === "function" ? (next as (o: T | null) => T | null)(prev) ?? prev : next));
      // Return something matching nuqs signature
      return new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    };
    return [val, set];
  };

  let pageTuple: [number, Setter<number>];
  let perPageTuple: [number, Setter<number>];
  try {
    pageTuple = useQueryState(
      PAGE_KEY,
      parseAsInteger.withOptions(queryStateOptions).withDefault(1),
    );
  } catch {
    // Fallback to local state
    pageTuple = makeLocalQueryState<number>(1);
  }

  try {
    perPageTuple = useQueryState(
      PER_PAGE_KEY,
      parseAsInteger
        .withOptions(queryStateOptions)
        .withDefault(initialState?.pagination?.pageSize ?? 10),
    );
  } catch {
    perPageTuple = makeLocalQueryState<number>(initialState?.pagination?.pageSize ?? 10);
  }
  const [page, setPage] = pageTuple;
  const [perPage, setPerPage] = perPageTuple;

  const pagination = React.useMemo(() => {
    return {
      pageIndex: page - 1,
      pageSize: perPage,
    };
  }, [page, perPage]);

  const onPaginationChange = React.useCallback(
    (
      updaterOrValue:
        | ((prev: typeof pagination) => typeof pagination)
        | typeof pagination,
    ) => {
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

  // Store as ExtendedColumnSort[] but present as SortingState for react-table
  // Keep URL/query state as ExtendedColumnSort<TData>[] for stronger typing
  let sortingTuple: [
    ExtendedColumnSort<TData>[] ,
    (value: ExtendedColumnSort<TData>[] | ((old: ExtendedColumnSort<TData>[] | null) => ExtendedColumnSort<TData>[] | null)) => Promise<URLSearchParams>
  ];
  try {
    sortingTuple = useQueryState(
      SORT_KEY,
      getSortingStateParser<TData>(columnIds)
        .withOptions(queryStateOptions)
        .withDefault(initialState?.sorting ?? []),
    ) as unknown as [
      ExtendedColumnSort<TData>[] ,
      (value: ExtendedColumnSort<TData>[] | ((old: ExtendedColumnSort<TData>[] | null) => ExtendedColumnSort<TData>[] | null)) => Promise<URLSearchParams>
    ];
  } catch {
    sortingTuple = makeLocalQueryState<ExtendedColumnSort<TData>[]>(initialState?.sorting ?? []);
  }
  const [sortingUrlState, setSortingUrlState] = sortingTuple;

  // Expose SortingState to react-table to satisfy its types
  const sorting: SortingState = (sortingUrlState as unknown) as SortingState;

  const onSortingChange: OnChangeFn<SortingState> = React.useCallback(
    (updaterOrValue) => {
      if (typeof updaterOrValue === "function") {
        const next = updaterOrValue(sorting) as SortingState;
        setSortingUrlState((next as unknown) as ExtendedColumnSort<TData>[]);
      } else {
        setSortingUrlState((updaterOrValue as unknown) as ExtendedColumnSort<TData>[]);
      }
    },
    [sorting, setSortingUrlState],
  );

  return {
    page,
    setPage,
    perPage,
    setPerPage,
    pagination,
    onPaginationChange,
    sorting,
    setSorting: setSortingUrlState,
    onSortingChange,
    queryStateOptions,
  };
}
