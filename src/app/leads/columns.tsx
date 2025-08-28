"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../../components/ui/badge";
import { DataTableColumnHeader } from "../../components/data-table/data-table-column-header";
import { format } from "date-fns";
import type { Lead } from "./_lib/mock";

export function getLeadColumns(): ColumnDef<Lead>[] {
  return [
    {
      id: "select",
      header: ({ table }) => null,
      cell: ({ row }) => null,
      enableSorting: false,
      enableHiding: false,
      size: 24,
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => <span className="font-medium">{row.getValue("name")}</span>,
      enableColumnFilter: true,
      meta: { label: "Name", variant: "text" },
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("email")}</span>,
      enableColumnFilter: true,
      meta: { label: "Email", variant: "text" },
    },
    {
      id: "phone",
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => <span>{row.getValue("phone")}</span>,
      enableColumnFilter: true,
      meta: { label: "Phone", variant: "text" },
    },
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ cell }) => (
        <Badge variant="outline" className="capitalize">{cell.getValue<string>()}</Badge>
      ),
      enableColumnFilter: true,
      meta: {
        label: "Status",
        variant: "multiSelect",
        options: ["new", "contacted", "qualified", "lost"].map((s) => ({ label: s, value: s })),
      },
    },
    {
      id: "score",
      accessorKey: "score",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Score" />
      ),
      cell: ({ cell }) => <div className="w-12 text-right">{cell.getValue<number>()}</div>,
      enableColumnFilter: true,
      meta: { label: "Score", variant: "range", range: [0, 100] },
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ cell }) => format(cell.getValue<Date>(), "yyyy-MM-dd"),
      enableColumnFilter: true,
      meta: { label: "Created", variant: "dateRange" },
    },
  ];
}
