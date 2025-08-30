"use client";

import { useState, type FC } from "react";
import { Dialog, DialogContent } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

interface AddLeadListModalMainProps {
  isOpen: boolean;
  onClose: () => void;
  onAddList?: (list: { id: string; name: string }) => void;
}

const AddLeadListModalMain: FC<AddLeadListModalMainProps> = ({ isOpen, onClose, onAddList }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    console.log("Create Lead List", { name: name.trim(), description: description.trim() });
    await new Promise((r) => setTimeout(r, 800));
    if (onAddList) {
      onAddList({ id: String(Date.now()), name: name.trim() });
    }
    setSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Add Lead List</h2>
          <div>
            <label htmlFor="listName" className="block text-sm font-medium">List Name</label>
            <Input id="listName" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!canSubmit} placeholder="e.g., Absentee Owners - Aug" />
          </div>
          <div>
            <label htmlFor="listDesc" className="block text-sm font-medium">Description (optional)</label>
            <Input id="listDesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={handleSubmit} disabled={!canSubmit || submitting}>
              {submitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddLeadListModalMain;
