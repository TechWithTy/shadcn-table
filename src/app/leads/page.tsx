"use client";

import * as React from "react";
import { LeadsTable } from "./leads-table";

export default function LeadsPage() {
  return (
    <main className="p-6">
      <div className="mb-4">
        <h1 className="font-semibold text-2xl">Leads</h1>
        <p className="text-muted-foreground">Demo lead list with modal carousel and export options.</p>
      </div>
      <LeadsTable />
    </main>
  );
}
