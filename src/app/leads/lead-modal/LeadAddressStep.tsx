"use client";

import { Input } from "../../../components/ui/input";
import { US_STATES } from "../../../constants/usStates";
import { City } from "country-state-city";
import { useMemo, useState, type FC } from "react";

interface LeadAddressStepProps {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  onAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onZipCodeChange: (value: string) => void;
  errors?: Record<string, string>;
}

const LeadAddressStep: FC<LeadAddressStepProps> = ({
  address,
  city,
  state,
  zipCode,
  onAddressChange,
  onCityChange,
  onStateChange,
  onZipCodeChange,
  errors = {},
}) => {
  const cityOptions = useMemo(() => {
    if (!state) return [] as string[];
    try {
      return City.getCitiesOfState("US", state).map((c) => c.name);
    } catch {
      return [] as string[];
    }
  }, [state]);

  type Option = { label: string; value: string };

  const InlineDropdown: FC<{
    id: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    options: Option[];
    disabled?: boolean;
  }> = ({ id, value, onChange, placeholder, options, disabled }) => {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value)?.label ?? "";
    return (
      <div className="relative">
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={selected ? "" : "text-muted-foreground"}>
            {selected || placeholder || "Select"}
          </span>
          <svg className="h-4 w-4 opacity-50" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
          </svg>
        </button>
        {open && (
          <div className="absolute left-0 right-0 z-[80] mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground ${
                  opt.value === value ? "bg-accent text-accent-foreground" : ""
                }`}
              >
                {opt.label}
              </button>
            ))}
            {options.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No options</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block font-medium text-sm" htmlFor="streetAddress">
          Street Address
        </label>
        <Input
          id="streetAddress"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Enter street address"
          aria-invalid={Boolean(errors.address)}
        />
      </div>
      <div>
        <label className="mb-1 block font-medium text-sm" htmlFor="state">
          State
        </label>
        <InlineDropdown
          id="state"
          value={state}
          onChange={(val) => {
            onStateChange(val);
            onCityChange("");
          }}
          placeholder="Select state"
          options={US_STATES.map((s) => ({ label: s.label, value: s.value }))}
        />
        {errors.state && (
          <p className="mt-1 text-destructive text-sm">{errors.state}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block font-medium text-sm" htmlFor="city">
          City
        </label>
        {!state ? (
          <Input id="city" value="" readOnly disabled placeholder="Select a state first" />
        ) : cityOptions.length > 0 ? (
          <InlineDropdown
            id="city"
            value={city}
            onChange={onCityChange}
            placeholder="Select city"
            options={cityOptions.map((ct) => ({ label: ct, value: ct }))}
          />
        ) : (
          <Input
            id="city"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="Enter city"
            aria-invalid={Boolean(errors.city)}
          />
        )}
      </div>
      <div>
        <label className="mb-1 block font-medium text-sm" htmlFor="zipCode">
          Zip Code
        </label>
        <Input
          id="zipCode"
          value={zipCode}
          onChange={(e) => onZipCodeChange(e.target.value)}
          placeholder="Enter zip code"
          aria-invalid={Boolean(errors.zipCode)}
        />
      </div>
    </div>
  );
};

export default LeadAddressStep;
