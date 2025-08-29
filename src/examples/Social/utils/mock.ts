import type { CallCampaign } from "../../../../../../types/_dashboard/campaign";
import { generateCallCampaignData, mockCallCampaignData } from "../../../../../../constants/_faker/calls/callCampaign";

// Discriminated union for LinkedIn attachments
export type LinkedInAttachment =
  | { id: string; file_size: number; unavailable: boolean; mimetype: string; url: string; url_expires_at: number; type: "img"; size?: { width: number; height: number }; sticker?: boolean }
  | { id: string; file_size: number; unavailable: boolean; mimetype: string; url: string; url_expires_at: number; type: "video"; size?: { width: number; height: number }; gif?: boolean }
  | { id: string; file_size: number; unavailable: boolean; mimetype: string; url: string; url_expires_at: number; type: "audio"; duration?: number; voice_note?: boolean }
  | { id: string; file_size: number; unavailable: boolean; mimetype: string; url: string; url_expires_at: number; type: "file"; file_name?: string }
  | { id: string; file_size: number; unavailable: boolean; mimetype: string; url: string; url_expires_at: number; type: "linkedin_post" }
  | { id: string; file_size: number; unavailable: boolean; mimetype: string; url: string; url_expires_at: number; type: "video_meeting"; starts_at?: number; expires_at?: number; time_range?: number };

export type SocialInteraction = {
  id: string;
  type: string; // comment | message | reaction | inmail | reply
  user: string;
  text: string;
  createdAt: string; // ISO
  assetFilename?: string;
  assetContent?: string;
  transfers?: number;
  // Optional LinkedIn message payload
  linkedinMessage?: {
    provider_id?: string;
    sender_id?: string;
    text?: string;
    attachments?: LinkedInAttachment[];
    id?: string;
    account_id?: string;
    chat_id?: string;
    chat_provider_id?: string;
    timestamp?: string;
    is_sender?: number;
    reactions?: Array<{ value: string; sender_id: string; is_sender: boolean }>;
    seen?: number;
    hidden?: number;
    deleted?: number;
    edited?: number;
    message_type?: string; // MESSAGE | EVENT
  };
};

export type SocialCampaign = CallCampaign & {
  platform?: "facebook" | "linkedin";
  // Facebook fields
  manychatFlowId?: string;
  manychatFlowName?: string;
  // ManyChat flows (workflows) inventory
  manychatFlows?: Array<{ ns: string; name: string; folder_id?: number }>;
  // ManyChat Growth Tools inventory
  manychatGrowthTools?: Array<{ id: number; name: string; type: string }>;
  // ManyChat Page info (for FB)
  manychatPage?: { id: number; name: string };
  // Subscribers attached to this campaign (FB)
  subscribers?: Array<{
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
  }>;
  facebookSubscriberId?: string;
  facebookExternalId?: string;
  // LinkedIn fields
  liTemplateType?: "DM" | "Invite" | "InMail";
  liTemplateName?: string;
  linkedinChatId?: string;
  linkedinProfileUrl?: string;
  linkedinPublicId?: string;
  // Common progression metrics
  queued?: number;
  sent?: number;
  delivered?: number;
  failed?: number;
  lastSentAt?: string;
  interactionsDetails?: SocialInteraction[];
};

export function generateSocialCampaignData(): CallCampaign[] {
  const base: CallCampaign[] = (mockCallCampaignData as CallCampaign[] | false) || generateCallCampaignData();
  const now = Date.now();
  const hour = 3600_000;
  const FB_INTERACTION_TYPES = ["comment", "message", "reaction"] as const;
  const LI_INTERACTION_TYPES = ["inmail", "comment", "reply"] as const;
  const GT_NAMES = ["Comment Tool", "Landing Page", "QR Code", "Website Widget"] as const;
  const GT_TYPES = ["comment", "landing_page", "qr", "widget"] as const;

  return base.map((r, i) => {
    const isFacebook = i % 2 === 0;
    if (isFacebook) {
      const interactionsCount = Math.max(3, (i % 8) + 3);
      const interactionsDetails: SocialInteraction[] = Array.from({ length: interactionsCount }).map((_, idx) => {
        const id = `fb_${i + 1}_${idx + 1}`;
        const type = FB_INTERACTION_TYPES[idx % FB_INTERACTION_TYPES.length] as string;
        const user = `user_${(i * 37 + idx * 11) % 1000}`;
        const text = type === "reaction" ? "👍 Like" : `Sample ${type} #${idx + 1}`;
        const createdAt = new Date(now - (idx + 1) * hour).toISOString();
        const assetFilename = idx % 4 === 0 ? `asset_${id}.txt` : undefined;
        const assetContent = assetFilename ? `Asset for ${id} - ${text}` : undefined;
        const transfers = idx % 5 === 0 ? ((i + idx) % 3) : 0;
        return { id, type, user, text, createdAt, assetFilename, assetContent, transfers };
      });
      const fb: Partial<SocialCampaign> = {
        platform: "facebook",
        manychatFlowId: i % 3 === 0 ? `flow_${1000 + (i % 9000)}` : undefined,
        manychatFlowName: `Welcome Flow ${(i % 10) + 1}`,
        manychatFlows: Array.from({ length: (i % 3) + 1 }).map((_, k) => ({
          ns: `namespace_${i}_${k}`,
          name: `Flow ${((i + k) % 6) + 1}`,
          folder_id: (k % 2) + 1,
        })),
        manychatGrowthTools: Array.from({ length: (i % 4) + 1 }).map((_, k) => ({
          id: 10_000 + i * 10 + k,
          name: GT_NAMES[k % GT_NAMES.length] as string,
          type: GT_TYPES[k % GT_TYPES.length] as string,
        })),
        manychatPage: { id: 2000 + i, name: `FB Page ${((i % 4) + 1)}` },
        subscribers: Array.from({ length: (i % 5) + 1 }).map((_, k) => ({
          id: `sub_${(i * 12345 + k * 777) % 1_000_000}`,
          name: `Subscriber ${(k + 1)}`,
          firstName: `Sub${k + 1}`,
          lastName: `FB${(i % 10) + 1}`,
          email: k % 2 === 0 ? `sub${k + 1}@example.com` : undefined,
          phone: k % 3 === 0 ? `+1-555-01${(k + 1).toString().padStart(2, "0")}` : undefined,
          tags: k % 2 === 0 ? [{ id: 1, name: "Lead" }] : [{ id: 2, name: "Prospect" }],
          customFields: [
            { id: 10, name: "Source", type: "text", value: "FB" },
          ],
          lastInteraction: new Date(now - (k + 1) * 7200_000).toISOString(),
          lastSeen: new Date(now - (k + 1) * 3600_000).toISOString(),
          liveChatUrl: `https://manychat.com/chat/${2000 + i}/${k + 1}`,
        })),
        facebookSubscriberId: i % 4 !== 0 ? `sub_${(i * 12345) % 1_000_000}` : undefined,
        facebookExternalId: i % 5 === 0 ? `${(i * 99991) % 1_000_000}` : undefined,
        lastSentAt: new Date(now - (i % 7) * 86400000).toISOString(),
        queued: (i % 5),
        sent: (i % 20) + 3,
        delivered: (i % 20) + 2,
        failed: i % 3,
        interactionsDetails,
      };
      return { ...(r as CallCampaign), ...(fb as any) } as CallCampaign;
    }
    const interactionsCount = Math.max(3, (i % 8) + 3);
    const interactionsDetails: SocialInteraction[] = Array.from({ length: interactionsCount }).map((_, idx) => {
      const id = `li_${i + 1}_${idx + 1}`;
      const type = LI_INTERACTION_TYPES[idx % LI_INTERACTION_TYPES.length] as string;
      const user = `user_${(i * 41 + idx * 7) % 1000}`;
      const text = `LinkedIn ${type} #${idx + 1}`;
      const createdAt = new Date(now - (idx + 1) * hour).toISOString();
      const assetFilename = idx % 5 === 0 ? `asset_${id}.txt` : undefined;
      const assetContent = assetFilename ? `Asset for ${id} - ${text}` : undefined;
      const transfers = idx % 6 === 0 ? ((i + idx) % 3) : 0;
      const linkedinMessage = idx % 2 === 0 ? {
        provider_id: `prov_${id}`,
        sender_id: `sender_${(i * 9 + idx) % 1000}`,
        text,
        attachments: [
          { id: `att_${id}_img`, file_size: 1024, unavailable: false, mimetype: "image/png", url: "https://example.com/img.png", url_expires_at: Date.now() + 86_400_000, type: "img", size: { width: 640, height: 480 }, sticker: (idx % 4) === 0 },
          { id: `att_${id}_video`, file_size: 2048, unavailable: false, mimetype: "video/mp4", url: "https://example.com/video.mp4", url_expires_at: Date.now() + 86_400_000, type: "video", size: { width: 1280, height: 720 }, gif: (idx % 3) === 0 },
        ] as LinkedInAttachment[],
        id,
        account_id: `acct_${i}`,
        chat_id: `chat_${(i * 123 + idx) % 9999}`,
        chat_provider_id: "linkedin",
        timestamp: createdAt,
        is_sender: idx % 3 === 0 ? 1 : 0,
        reactions: [{ value: "👍", sender_id: `user_${(idx * 17) % 1000}`, is_sender: false }],
        seen: idx % 2,
        hidden: 0,
        deleted: 0,
        edited: idx % 5 === 0 ? 1 : 0,
        message_type: "MESSAGE",
      } : undefined;
      return { id, type, user, text, createdAt, assetFilename, assetContent, transfers, linkedinMessage };
    });
    const liTypes = ["DM", "Invite", "InMail"] as const;
    const li: Partial<SocialCampaign> = {
      platform: "linkedin",
      liTemplateType: liTypes[i % liTypes.length],
      liTemplateName: `Template ${(i % 5) + 1}`,
      linkedinChatId: i % 3 === 0 ? `li_chat_${(i * 7777) % 1_000_000}` : undefined,
      linkedinProfileUrl: i % 5 === 0 ? `https://www.linkedin.com/in/user${(i * 13) % 10000}/` : undefined,
      linkedinPublicId: i % 7 === 0 ? `user${(i * 19) % 10000}` : undefined,
      lastSentAt: new Date(now - (i % 7) * 86400000).toISOString(),
      queued: (i % 5),
      sent: (i % 20) + 2,
      delivered: (i % 20) + 1,
      failed: i % 3,
      interactionsDetails,
    };
    return { ...(r as CallCampaign), ...(li as any) } as CallCampaign;
  });
}
