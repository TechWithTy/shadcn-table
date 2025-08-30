"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { Button } from "../../../../components/ui/button";

interface ListTraceFlowProps {
  onClose: () => void;
  onBack: () => void;
  initialFile?: File;
  existingLists?: { id: string; name: string }[];
}

const ListTraceFlow: React.FC<ListTraceFlowProps> = ({ onClose, onBack, initialFile, existingLists = [] }) => {
  const [step, setStep] = useState(0);
  const [listMode, setListMode] = useState<"create" | "select">("create");
  const [listName, setListName] = useState("");
  const [selectedListId, setSelectedListId] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [selectedHeaders, setSelectedHeaders] = useState<string[]>([]);
  const [selectedEnrichmentOptions, setSelectedEnrichmentOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialFile) {
      handleFile(initialFile);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile]);

  const canNextUpload = !!uploadedFile && parsedHeaders.length > 0 && listName.trim().length > 0;
  const headerOptions = useMemo(() => parsedHeaders, [parsedHeaders]);

  const handleFile = (file: File) => {
    setUploadedFile(file);
    setListName((prev) => prev || file.name.replace(/\.csv$/i, ""));
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const fields = (results.meta.fields ?? []).filter(Boolean) as string[];
        setParsedHeaders(fields);
        setSelectedHeaders(fields.slice(0, Math.min(fields.length, 5)));
      },
    });
  };

  const handleHeaderToggle = (hdr: string) => {
    setSelectedHeaders((prev) => (prev.includes(hdr) ? prev.filter((h) => h !== hdr) : [...prev, hdr]));
  };

  const enrichmentList = [
    { id: "phones", label: "Append Phones" },
    { id: "emails", label: "Append Emails" },
    { id: "addresses", label: "Append Addresses" },
    { id: "social", label: "Append Social Profiles" },
  ];

  const handleEnrichmentToggle = (id: string) => {
    setSelectedEnrichmentOptions((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    console.log("Submitting List:", {
      listName,
      uploadedFile,
      selectedHeaders,
      selectedEnrichmentOptions,
    });
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="flex-1 space-y-6">
      {step === 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Upload CSV</h3>
          <div className="space-y-3">
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="list-mode"
                  className="h-4 w-4"
                  checked={listMode === "create"}
                  onChange={() => setListMode("create")}
                />
                Create new list
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="list-mode"
                  className="h-4 w-4"
                  checked={listMode === "select"}
                  onChange={() => setListMode("select")}
                />
                Select existing list
              </label>
            </div>

            <label className="block text-sm font-medium" htmlFor="listName">List Name</label>
            {listMode === "create" ? (
              <input
                id="listName"
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g., August - High Equity"
              />
            ) : (
              <select
                id="listName"
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
              >
                <option value="">Select a list...</option>
                {existingLists.map((l: { id: string; name: string }) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="csvFile">CSV File</label>
            <input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
          {parsedHeaders.length > 0 && (
            <p className="text-xs text-muted-foreground">Detected {parsedHeaders.length} columns</p>
          )}
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onBack}>Back</Button>
            <Button
              type="button"
              disabled={!(uploadedFile && parsedHeaders.length > 0 && (listMode === "create" ? listName.trim().length > 0 : !!selectedListId))}
              onClick={() => setStep(1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Map Headers</h3>
          <p className="text-sm text-muted-foreground">Choose which columns to include.</p>
          <div className="grid grid-cols-2 gap-2">
            {headerOptions.map((hdr) => (
              <label key={hdr} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={selectedHeaders.includes(hdr)}
                  onChange={() => handleHeaderToggle(hdr)}
                />
                {hdr}
              </label>
            ))}
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(0)}>Back</Button>
            <Button type="button" onClick={() => setStep(2)} disabled={selectedHeaders.length === 0}>Next</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Enrichment</h3>
          <div className="grid grid-cols-2 gap-2">
            {enrichmentList.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={selectedEnrichmentOptions.includes(opt.id)}
                  onChange={() => handleEnrichmentToggle(opt.id)}
                />
                {opt.label}
              </label>
            ))}
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button type="button" onClick={() => setStep(3)}>Next</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Review & Submit</h3>
          <ul className="text-sm space-y-1">
            <li>
              <strong>List:</strong>{" "}
              {listMode === "create"
                ? (listName || "(unnamed)")
                : (existingLists.find((l: { id: string; name: string }) => l.id === selectedListId)?.name ?? "(none)")}
            </li>
            <li><strong>File:</strong> {uploadedFile?.name ?? "(none)"}</li>
            <li><strong>Columns:</strong> {selectedHeaders.join(", ") || "(none)"}</li>
            <li><strong>Enrichment:</strong> {selectedEnrichmentOptions.join(", ") || "(none)"}</li>
          </ul>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListTraceFlow;
