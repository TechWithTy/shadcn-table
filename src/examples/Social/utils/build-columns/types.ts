import type { CallCampaign } from "../../../../../../../types/_dashboard/campaign";

export type Reaction = { value: string };
export type Attachment = { type: string };
export type LinkedInMessage = {
	sender_id?: string;
	text?: string;
	timestamp?: string;
	attachments?: Attachment[];
	reactions?: Reaction[];
};
export type InteractionDetail = {
	id?: string | number;
	type?: string;
	user?: string;
	text?: string;
	createdAt?: string | number | Date;
	transfers?: number;
	assetFilename?: string;
	assetContent?: Blob | string;
	linkedinMessage?: LinkedInMessage;
};

export type SocialRow = CallCampaign & {
	platform?: "facebook" | "linkedin" | string;
	subscribers?: Array<{
		id: string;
		name: string;
		email?: string;
		phone?: string;
		tags?: Array<{ id: number; name: string }>;
		lastSeen?: string;
		lastInteraction?: string;
	}>;
	manychatGrowthTools?: Array<{ id: number; name: string; type: string }>;
	manychatFlows?: Array<{ ns: string; name: string; folder_id?: number }>;
	interactionsDetails?: InteractionDetail[];
	manychatFlowName?: string;
	manychatFlowId?: string;
	liTemplateType?: string;
	liTemplateName?: string;
	facebookSubscriberId?: string;
	facebookExternalId?: string;
	linkedinChatId?: string;
	linkedinProfileUrl?: string;
	linkedinPublicId?: string;
  // Optional progress-related fields used by table columns
  queued?: number;
  inQueue?: number;
  sent?: number;
  delivered?: number;
  failed?: number;
  calls?: number;
  leads?: number;
  // Optional date fields used by columns/filters
  lastSentAt?: string | number | Date;
  startDate?: string | number | Date;
};
