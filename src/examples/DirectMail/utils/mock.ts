import {
	generateCallCampaignData,
	mockCallCampaignData,
} from "../../../../../../constants/_faker/calls/callCampaign";
import type { CallCampaign, CampaignBase } from "../../../../../../types/_dashboard/campaign";

export type DirectMailMailing = {
	id: string;
	template: { id: string; name: string };
	mailType: "postcard" | "letter" | "self_mailer";
	mailSize: "4x6" | "6x9" | "8.5x11";
	pdfFilename: string;
	pdfContent: string;
	sendDate: string; // when it was sent
	expectedDeliveryAt: string; // estimated/actual delivery
	status: "queued" | "in_transit" | "delivered" | "returned" | "failed";
	transfers: number;
};

export type DirectMailLead = {
	id: string;
	name: string;
	address: string;
	// Back-compat summary of latest mailing
	pdfFilename: string;
	pdfContent: string;
	transfers: number;
	// Full thread of mailings over time
	mailings: DirectMailMailing[];
};

export type DirectMailLobAddress = {
	id: string;
	description: string | null;
	name: string | null;
	company: string | null;
	phone: string | null;
	email: string | null;
	address_line1: string | null;
	address_line2: string | null;
	address_city: string | null;
	address_state: string | null;
	address_zip: string | null;
	address_country: string | null;
	metadata?: Record<string, unknown> | null;
	date_created: string | null;
	date_modified: string | null;
	deleted?: boolean | null;
	object: string | null;
};

type DirectMailLobBase = {
	id: string;
	description: string | null;
	metadata?: Record<string, unknown> | null;
	url: string | null;
	carrier: string | null;
	date_created: string | null;
	date_modified: string | null;
	send_date: string | null;
	use_type: string | null;
	fsc: boolean | null;
	sla: string | null;
	to: DirectMailLobAddress | null;
	from?: DirectMailLobAddress | null;
};

export type DirectMailLobInfo =
	| (DirectMailLobBase & {
			object: "postcard";
			front_template_id: string | null;
			back_template_id: string | null;
	  })
	| (DirectMailLobBase & {
			object: "letter";
			template_id: string | null;
			envelope_type: "standard" | "window" | null;
			page_count: number | null;
			color: boolean | null;
			double_sided: boolean | null;
			address_placement: "top_left" | "top_right" | "center" | null;
			return_envelope_included: boolean | null;
	  })
	| (DirectMailLobBase & {
			object: "snap_pack";
			outside_template_id: string | null;
			inside_template_id: string | null;
			inside_template_version_id: string | null;
			outside_template_version_id: string | null;
			thumbnails: { small: string; medium: string; large: string }[] | null;
			merge_variables?: Record<string, unknown> | null;
			size: "8.5x11" | "11x17" | string | null;
			mail_type: string | null;
			expected_delivery_date: string | null;
			color: boolean | null;
			tracking_events?: unknown[] | null;
	  });

export type DirectMailCampaign = CampaignBase & {
	template: { id: string; name: string };
	mailType: "postcard" | "letter" | "self_mailer";
	mailSize: "4x6" | "6x9" | "8.5x11";
	addressVerified: boolean;
	expectedDeliveryAt: string;
	lastEventAt: string;
	deliveredCount: number;
	returnedCount: number;
	failedCount: number;
	cost: number;
	leadsDetails: DirectMailLead[];
	lob?: DirectMailLobInfo | null;
};

export function generateDirectMailCampaignData(): DirectMailCampaign[] {
	const base: CallCampaign[] =
		(mockCallCampaignData as CallCampaign[] | false) ||
		generateCallCampaignData();

	const templates = [
		{ id: "tmpl_postcard_std", name: "Postcard - Promo" },
		{ id: "tmpl_letter_bw", name: "Letter - BW" },
		{ id: "tmpl_selfmailer_color", name: "Self Mailer - Color" },
	] as const;
	const mailTypes = ["postcard", "letter", "self_mailer"] as const;
	const mailSizes = ["4x6", "6x9", "8.5x11"] as const;
	const now = Date.now();
	const day = 24 * 60 * 60 * 1000;

	return base.map((r, i) => {
		const delivered = Math.max(0, (r.calls ?? 0) - ((i * 3) % 15));
		const returned = (i * 2) % 7;
		const failed = i % 5;
		const cost =
			Math.round((r.calls ?? 0) * (0.45 + (i % 3) * 0.1) * 100) / 100;

		const leadCount = Math.max(
			1,
			Math.min(8, (r.leads ?? Math.floor((r.calls ?? 5) / 2)) || 3),
		);
		const leadsDetails: DirectMailLead[] = Array.from({
			length: leadCount,
		}).map((_, idx) => {
			const id = `lead_${i + 1}_${idx + 1}`;
			const name = `Lead ${idx + 1}`;
			const address = `${(idx + 1) * 10} Main St, Springfield`;
			// Create a thread of 1-3 mailings over time
			const mailingCount = 1 + ((i + idx) % 3);
			const mailings: DirectMailMailing[] = Array.from({
				length: mailingCount,
			}).map((__, m) => {
				const tIndex = (i + idx + m) % templates.length;
				const chosenTmpl = templates[tIndex] ?? templates[0];
				const chosenType = mailTypes[
					(i + idx + m) % mailTypes.length
				] as DirectMailMailing["mailType"];
				const chosenSize = mailSizes[
					(i + m) % mailSizes.length
				] as DirectMailMailing["mailSize"];
				const sendOffset = (m + 1) * ((idx % 5) + 1) * day; // spaced apart
				const sendDate = new Date(now - sendOffset).toISOString();
				const expectedDeliveryAt = new Date(
					new Date(sendDate).getTime() + (2 + (m % 5)) * day,
				).toISOString();
				const status: DirectMailMailing["status"] =
					m === mailingCount - 1 && (i + idx) % 4 === 0
						? "in_transit"
						: (m + i + idx) % 7 === 0
							? "returned"
							: (m + i) % 9 === 0
								? "failed"
								: "delivered";
				const pdfFilename = `mailer_${id}_v${m + 1}.pdf`;
				const pdfContent = `Direct Mail Document v${m + 1} for ${name} (Campaign ${r.name})`;
				const transfers =
					(idx + m) % 4 === 0 ? Math.floor(Math.random() * 3) : 0;
				return {
					id: `${id}_ml_${m + 1}`,
					template: { id: chosenTmpl.id, name: chosenTmpl.name },
					mailType: chosenType,
					mailSize: chosenSize,
					pdfFilename,
					pdfContent,
					sendDate,
					expectedDeliveryAt,
					status,
					transfers,
				};
			});
			const latest = mailings[mailings.length - 1];
			return {
				id,
				name,
				address,
				pdfFilename: latest?.pdfFilename ?? "—",
				pdfContent: latest?.pdfContent ?? "",
				transfers: latest?.transfers ?? 0,
				mailings,
			};
		});

		const created = new Date(now - ((i % 14) + 1) * day).toISOString();
		const modified = new Date(now - ((i % 10) + 1) * day).toISOString();
		const sendDate = new Date(now - ((i % 7) + 1) * day).toISOString();
		const address: DirectMailLobAddress = {
			id: `adr_${(9000 + i).toString(16)}d7eec`,
			description: null,
			name: `${leadsDetails[0]?.name ?? "Alex"} ${i}`,
			company: i % 2 === 0 ? "DealScale LLC" : null,
			phone: null,
			email: null,
			address_line1: "210 KING ST STE 6100",
			address_line2: null,
			address_city: "San Francisco",
			address_state: "CA",
			address_zip: `94107-${1700 + i}`,
			address_country: "UNITED STATES",
			metadata: {},
			date_created: created,
			date_modified: modified,
			deleted: i % 11 === 0 ? true : null,
			object: "address",
		};
		const fromAddress: DirectMailLobAddress = {
			...address,
			id: `adr_${(7000 + i).toString(16)}d7eec`,
			name: "DealScale Ops",
			company: "DealScale",
		};
		const chosenMailType = mailTypes[i % mailTypes.length];
		const isLetter = i % 3 === 1 || chosenMailType === "letter";
		const isSnap = i % 5 === 0 || chosenMailType === "self_mailer";
		const lob: DirectMailLobInfo = isLetter
			? {
					id: `ltr_${(200000 + i).toString(16)}e45e48d271294`,
					description: null,
					metadata: {},
					url: `https://lob-assets.com/letters/ltr_${(200000 + i).toString(16)}.pdf`,
					carrier: "USPS",
					date_created: created,
					date_modified: modified,
					send_date: sendDate,
					use_type: "marketing",
					fsc: false,
					sla: String(2 + (i % 3)),
					object: "letter",
					template_id: "tmpl_letter_bw",
					envelope_type: i % 2 === 0 ? "window" : "standard",
					page_count: 1 + (i % 3),
					color: false,
					double_sided: i % 2 === 0,
					address_placement: "top_left",
					return_envelope_included: i % 4 === 0,
					to: address,
					from: fromAddress,
				}
			: isSnap
				? {
						id: `ord_${(300000 + i).toString(16)}e45e48d271294`,
						description: "Campaign Snap Pack",
						metadata: {},
						url: `https://lob-assets.com/order-creatives/ord_${(300000 + i).toString(16)}.pdf`,
						carrier: "USPS",
						date_created: created,
						date_modified: modified,
						send_date: sendDate,
						use_type: "marketing",
						fsc: false,
						sla: String(2 + (i % 3)),
						object: "snap_pack",
						outside_template_id: "tmpl_outside_sp",
						inside_template_id: "tmpl_inside_sp",
						inside_template_version_id: "vrsn_inside_1",
						outside_template_version_id: "vrsn_outside_1",
						thumbnails: [
							{
								small: `https://lob-assets.com/order-creatives/ord_${(300000 + i).toString(16)}_thumb_small_1.png`,
								medium: `https://lob-assets.com/order-creatives/ord_${(300000 + i).toString(16)}_thumb_medium_1.png`,
								large: `https://lob-assets.com/order-creatives/ord_${(300000 + i).toString(16)}_thumb_large_1.png`,
							},
							{
								small: `https://lob-assets.com/order-creatives/ord_${(300000 + i).toString(16)}_thumb_small_2.png`,
								medium: `https://lob-assets.com/order-creatives/ord_${(300000 + i).toString(16)}_thumb_medium_2.png`,
								large: `https://lob-assets.com/order-creatives/ord_${(300000 + i).toString(16)}_thumb_large_2.png`,
							},
						],
						merge_variables: { name: null },
						size: "8.5x11",
						mail_type: "usps_first_class",
						expected_delivery_date: new Date(now + ((i % 10) + 2) * day)
							.toISOString()
							.slice(0, 10),
						color: false,
						tracking_events: [],
						to: address,
						from: fromAddress,
					}
				: {
						id: `psc_${(200000 + i).toString(16)}e45e48d271294`,
						description: null,
						metadata: {},
						url: `https://lob-assets.com/postcards/psc_${(200000 + i).toString(16)}.pdf`,
						carrier: "USPS",
						date_created: created,
						date_modified: modified,
						send_date: sendDate,
						use_type: "marketing",
						fsc: false,
						sla: String(2 + (i % 3)),
						object: "postcard",
						front_template_id: "tmpl_postcard_std",
						back_template_id: null,
						to: address,
						from: fromAddress,
					};

		return {
			...(r as CallCampaign),
			template: templates[i % templates.length],
			mailType: chosenMailType,
			mailSize: mailSizes[i % mailSizes.length],

			addressVerified: i % 4 !== 0,
			expectedDeliveryAt: new Date(now + ((i % 14) + 1) * day).toISOString(),
			lastEventAt: new Date(now - ((i % 21) + 1) * day).toISOString(),
			deliveredCount: delivered,
			returnedCount: returned,
			failedCount: failed,
			cost,
			leadsDetails,
			lob,
		} as DirectMailCampaign;
	});
}
