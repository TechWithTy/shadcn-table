"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";

interface SingleInitialData {
  type: "single";
  firstName?: string;
  lastName?: string;
  address?: string;
  email?: string;
  phone?: string;
  socialMedia?: string;
  domain?: string;
}

interface SingleTraceFlowProps {
  onClose: () => void;
  onBack: () => void;
  initialData?: SingleInitialData;
}

const SingleTraceFlow: React.FC<SingleTraceFlowProps> = ({ onClose, onBack, initialData }) => {
  const [firstName, setFirstName] = useState(initialData?.firstName ?? "");
  const [lastName, setLastName] = useState(initialData?.lastName ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [socialMedia, setSocialMedia] = useState(initialData?.socialMedia ?? "");
  const [domain, setDomain] = useState(initialData?.domain ?? "");
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const emailRe = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/;
    const phoneRe = /^\+?\d{7,15}$/;
    if (!firstName.trim()) e.firstName = "First name is required";
    if (!lastName.trim()) e.lastName = "Last name is required";
    if (!email.trim() && !phone.trim() && !socialMedia.trim() && !domain.trim() && !address.trim()) {
      e.contact = "Provide at least one contact detail (email, phone, social, domain, or address)";
    }
    if (email && !emailRe.test(email)) e.email = "Invalid email";
    if (phone && !phoneRe.test(phone)) e.phone = "Invalid phone";
    return e;
  }, [firstName, lastName, email, phone, socialMedia, domain, address]);

  const canSubmit = Object.keys(errors).length === 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    console.log("Submitting Single:", { firstName, lastName, address, email, phone, socialMedia, domain });
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Single Contact</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium">First Name</label>
          <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} aria-invalid={!!errors.firstName} />
          {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>}
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium">Last Name</label>
          <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} aria-invalid={!!errors.lastName} />
          {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium">Phone</label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!errors.phone} />
          {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="social" className="block text-sm font-medium">Social Handle or URL</label>
          <Input id="social" value={socialMedia} onChange={(e) => setSocialMedia(e.target.value)} />
        </div>
        <div>
          <label htmlFor="domain" className="block text-sm font-medium">Domain</label>
          <Input id="domain" value={domain} onChange={(e) => setDomain(e.target.value)} />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium">Address</label>
        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>

      {errors.contact && <p className="text-xs text-destructive">{errors.contact}</p>}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="button" onClick={handleSubmit} disabled={!canSubmit || submitting}>
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
};

export default SingleTraceFlow;
