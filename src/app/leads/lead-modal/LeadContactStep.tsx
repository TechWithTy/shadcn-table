"use client";

import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import type { FC } from "react";

interface LeadContactStepProps {
  phoneNumber: string;
  email: string;
  isIphone: boolean;
  preferCall: boolean;
  preferSms: boolean;
  bestContactTime: "morning" | "afternoon" | "evening" | "any";
  leadNotes: string;
  onPhoneNumberChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onIsIphoneChange: (value: boolean) => void;
  onPreferCallChange: (value: boolean) => void;
  onPreferSmsChange: (value: boolean) => void;
  onBestContactTimeChange: (value: "morning" | "afternoon" | "evening" | "any") => void;
  onLeadNotesChange: (value: string) => void;
  errors?: Record<string, string>;
  showBestTime?: boolean;
  showLeadNotes?: boolean;
}

const LeadContactStep: FC<LeadContactStepProps> = ({
  phoneNumber,
  email,
  isIphone,
  preferCall,
  preferSms,
  bestContactTime,
  leadNotes,
  onPhoneNumberChange,
  onEmailChange,
  onIsIphoneChange,
  onPreferCallChange,
  onPreferSmsChange,
  onBestContactTimeChange,
  onLeadNotesChange,
  errors = {},
  showBestTime = true,
  showLeadNotes = true,
}) => (
  <div className="space-y-4">
    <div>
      <label className="mb-1 block text-sm" htmlFor="phoneNumber">Phone Number</label>
      <Input
        id="phoneNumber"
        value={phoneNumber}
        onChange={(e) => onPhoneNumberChange(e.target.value)}
        placeholder="Enter phone number"
        aria-invalid={Boolean(errors.phoneNumber)}
      />
    </div>
    <div>
      <label className="mb-1 block text-sm" htmlFor="email">Email</label>
      <Input
        id="email"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder="Enter email"
        aria-invalid={Boolean(errors.email)}
      />
    </div>

    <div className="flex items-center gap-2">
      <input
        id="isIphone"
        type="checkbox"
        className="h-4 w-4"
        checked={isIphone}
        onChange={(e) => onIsIphoneChange(e.target.checked)}
      />
      <label htmlFor="isIphone" className="text-sm">Device is iPhone</label>
    </div>

    <div className="space-y-2">
      <p className="font-medium text-sm">Communication Preferences</p>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={preferCall}
            onChange={(e) => onPreferCallChange(e.target.checked)}
          />
          Call
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={preferSms}
            onChange={(e) => onPreferSmsChange(e.target.checked)}
          />
          SMS
        </label>
      </div>
      {showBestTime && (
        <div>
          <label className="mb-1 block text-sm" htmlFor="bestTime">Best Time to Contact</label>
          <Select value={bestContactTime} onValueChange={(v) => onBestContactTimeChange(v as any)}>
            <SelectTrigger id="bestTime">
              <SelectValue placeholder="Select best time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="afternoon">Afternoon</SelectItem>
              <SelectItem value="evening">Evening</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {showLeadNotes && (
        <div>
          <label htmlFor="leadNotes" className="mb-1 block text-sm">Lead Notes</label>
          <textarea
            id="leadNotes"
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            rows={3}
            value={leadNotes}
            onChange={(e) => onLeadNotesChange(e.target.value)}
            placeholder="Any notes about contacting this lead"
          />
        </div>
      )}
    </div>
  </div>
);

export default LeadContactStep;
