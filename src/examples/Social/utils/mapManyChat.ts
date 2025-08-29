// Minimal mappers for ManyChat API payloads to our internal SocialCampaign subscriber/page shapes
// These are pure utilities and can be used wherever we ingest ManyChat data.

export type ManyChatSubscriberAPI = {
  id: string;
  page_id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  optin_email?: boolean;
  optin_phone?: boolean;
  live_chat_url?: string;
  last_interaction?: string;
  last_seen?: string;
  custom_fields?: Array<{ id: number; name: string; type: string; description?: string; value?: unknown }>;
  tags?: Array<{ id: number; name: string }>;
};

export type ManyChatPageAPI = {
  id: number | string;
  name?: string;
};

export type InternalSubscriber = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tags?: Array<{ id: number; name: string }>;
  customFields?: Array<{ id: number; name: string; type: string; value: unknown }>;
  lastInteraction?: string;
  lastSeen?: string;
  liveChatUrl?: string;
};

export function mapManyChatSubscriber(s: ManyChatSubscriberAPI): InternalSubscriber {
  const firstName = s.first_name?.trim();
  const lastName = s.last_name?.trim();
  const name = (s.name?.trim() || [firstName, lastName].filter(Boolean).join(" ")).trim() || s.id;
  return {
    id: String(s.id),
    name,
    firstName,
    lastName,
    email: s.optin_email ? s.email : undefined,
    phone: s.optin_phone ? s.phone : undefined,
    tags: Array.isArray(s.tags) ? s.tags.map(t => ({ id: Number(t.id), name: String(t.name) })) : undefined,
    customFields: Array.isArray(s.custom_fields)
      ? s.custom_fields.map(cf => ({ id: Number(cf.id), name: String(cf.name), type: String(cf.type), value: cf.value }))
      : undefined,
    lastInteraction: s.last_interaction,
    lastSeen: s.last_seen,
    liveChatUrl: s.live_chat_url,
  };
}

export function mapManyChatPage(p: ManyChatPageAPI): { id: number | string; name?: string } {
  return { id: p.id, name: p.name };
}
