"use client";

import { useEffect, useState, type FC } from "react";
import { Dialog, DialogContent } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import ListTraceFlow from "./flows/ListTraceFlow";
import SingleTraceFlow from "./flows/SingleTraceFlow";

type Flow = "list" | "single" | null;

interface SkipTraceModalMainProps {
  isOpen: boolean;
  onClose: () => void;
  existingLists?: { id: string; name: string }[];
  initialData?:
    | { type: "list"; file?: File }
    | ({ type: "single" } & Partial<
        Record<
          | "firstName"
          | "lastName"
          | "address"
          | "email"
          | "phone"
          | "socialMedia"
          | "domain",
          string
        >
      >);
}

const SkipTraceModalMain: FC<SkipTraceModalMainProps> = ({ isOpen, onClose, initialData, existingLists = [] }) => {
  const [currentFlow, setCurrentFlow] = useState<Flow>(null);

  useEffect(() => {
    if (initialData) setCurrentFlow(initialData.type);
  }, [initialData]);

  const handleClose = () => {
    setCurrentFlow(null);
    onClose();
  };

  const handleBack = () => setCurrentFlow(null);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl">
        {!currentFlow && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Skip Trace</h2>
            <p className="text-sm text-muted-foreground">Choose an option to begin.</p>
            <div className="flex flex-col gap-2">
              <Button type="button" variant="outline" onClick={() => setCurrentFlow("list")}>Skip Trace a List</Button>
              <Button type="button" variant="outline" onClick={() => setCurrentFlow("single")}>Skip Trace a Single Contact</Button>
            </div>
          </div>
        )}

        {currentFlow === "list" && (
          <ListTraceFlow
            onClose={handleClose}
            onBack={handleBack}
            initialFile={initialData?.type === "list" ? initialData.file : undefined}
            existingLists={existingLists}
          />
        )}

        {currentFlow === "single" && (
          <SingleTraceFlow onClose={handleClose} onBack={handleBack} initialData={initialData?.type === "single" ? initialData : undefined} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SkipTraceModalMain;
