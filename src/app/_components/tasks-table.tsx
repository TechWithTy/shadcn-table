"use client";

import * as React from "react";
import { DataTable } from "../../components/data-table/data-table";
import { DataTableAdvancedToolbar } from "../../components/data-table/data-table-advanced-toolbar";
import { DataTableExportButton } from "../../components/data-table/data-table-export-button";
import { DataTableFilterList } from "../../components/data-table/data-table-filter-list";
import { DataTableFilterMenu } from "../../components/data-table/data-table-filter-menu";
import { DataTableSortList } from "../../components/data-table/data-table-sort-list";
import { DataTableToolbar } from "../../components/data-table/data-table-toolbar";
import { DataTableRowModalCarousel } from "../../components/data-table/data-table-row-modal-carousel";
import type { Task } from "../../db/schema";
import { useDataTable } from "../../hooks/use-data-table";
import { useRowCarousel } from "../../hooks/use-row-carousel";
import type { DataTableRowAction } from "../../types/data-table";
import type {
  getEstimatedHoursRange,
  getTaskPriorityCounts,
  getTaskStatusCounts,
  getTasks,
} from "../_lib/queries";
import { DeleteTasksDialog } from "./delete-tasks-dialog";
import { useFeatureFlags } from "./feature-flags-provider";
import { TasksTableActionBar } from "./tasks-table-action-bar";
import { getTasksTableColumns } from "./tasks-table-columns";
import { UpdateTaskSheet } from "./update-task-sheet";

interface TasksTableProps {
  promises: Promise<
    [
      Awaited<ReturnType<typeof getTasks>>,
      Awaited<ReturnType<typeof getTaskStatusCounts>>,
      Awaited<ReturnType<typeof getTaskPriorityCounts>>,
      Awaited<ReturnType<typeof getEstimatedHoursRange>>,
    ]
  >;
}

export function TasksTable({ promises }: TasksTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  const [
    { data, pageCount },
    statusCounts,
    priorityCounts,
    estimatedHoursRange,
  ] = React.use(promises);

  const [rowAction, setRowAction] =
    React.useState<DataTableRowAction<Task> | null>(null);

  const columns = React.useMemo(
    () =>
      getTasksTableColumns({
        statusCounts,
        priorityCounts,
        estimatedHoursRange,
        setRowAction,
      }),
    [statusCounts, priorityCounts, estimatedHoursRange],
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      columnPinning: { right: ["actions"] },
    },
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  });

  // Modal carousel state bound to the current filtered row model
  const carousel = useRowCarousel(table, { loop: true });

  return (
    <>
      <DataTable
        table={table}
        onRowClick={(row) => carousel.openAt(row)}
        actionBar={<TasksTableActionBar table={table} />}
      >
        {enableAdvancedFilter ? (
          <DataTableAdvancedToolbar table={table}>
            <DataTableSortList table={table} align="start" />
            <DataTableExportButton table={table} filename="tasks" />
            {filterFlag === "advancedFilters" ? (
              <DataTableFilterList
                table={table}
                shallow={shallow}
                debounceMs={debounceMs}
                throttleMs={throttleMs}
                align="start"
              />
            ) : (
              <DataTableFilterMenu
                table={table}
                shallow={shallow}
                debounceMs={debounceMs}
                throttleMs={throttleMs}
              />
            )}
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} align="end" />
            <DataTableExportButton table={table} filename="tasks" />
          </DataTableToolbar>
        )}
      </DataTable>
      <DataTableRowModalCarousel
        table={table}
        open={carousel.open}
        onOpenChange={carousel.setOpen}
        index={carousel.index}
        setIndex={carousel.setIndex}
        rows={carousel.rows}
        onPrev={carousel.prev}
        onNext={carousel.next}
        title={(row) => row.original.title ?? row.original.code}
        description={(row) => `Status: ${row.original.status} • Priority: ${row.original.priority}`}
        render={(row) => (
          <div className="grid gap-2">
            <div className="text-sm"><strong>Code:</strong> {row.original.code}</div>
            <div className="text-sm"><strong>Title:</strong> {row.original.title}</div>
            <div className="text-sm"><strong>Status:</strong> {row.original.status}</div>
            <div className="text-sm"><strong>Priority:</strong> {row.original.priority}</div>
            <div className="text-sm"><strong>Estimated Hours:</strong> {row.original.estimatedHours}</div>
            <div className="text-muted-foreground text-xs">Created: {new Date(row.original.createdAt as unknown as string).toLocaleString()}</div>
          </div>
        )}
      />
      <UpdateTaskSheet
        open={rowAction?.variant === "update"}
        onOpenChange={() => setRowAction(null)}
        task={rowAction?.row.original ?? null}
      />
      <DeleteTasksDialog
        open={rowAction?.variant === "delete"}
        onOpenChange={() => setRowAction(null)}
        tasks={rowAction?.row.original ? [rowAction?.row.original] : []}
        showTrigger={false}
        onSuccess={() => rowAction?.row.toggleSelected(false)}
      />
    </>
  );
}
