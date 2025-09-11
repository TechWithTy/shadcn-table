export type SocialLink = { label: string; url: string };
export type SocialHandle = { platform: string; username: string; url?: string };
export type ActivityEvent = {
  ts: string; // ISO timestamp
  kind: "call" | "email" | "social" | "note";
  summary: string;
};

export type DemoLead = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  socials: SocialLink[];
  status: "New Lead" | "Contacted" | "Qualified" | "Do Not Contact";
  possiblePhones: string[];
  possibleEmails: string[];
  possibleHandles: SocialHandle[];
  activity: ActivityEvent[];
  isIPhone: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  socialVerified: boolean;
  associatedAddress: string;
  addressVerified: boolean;
};

export type DemoRow = {
  id: string;
  list: string;
  uploadDate: string;
  records: number;
  phone: number;
  emails: number;
  socials: number;
  leads: DemoLead[];
};
