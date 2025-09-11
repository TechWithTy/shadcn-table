import type { ActivityEvent, DemoLead, DemoRow } from "./types";

const DEMO_LISTS = [
	"Austin Leads",
	"Dallas Buyers",
	"Houston Sellers",
	"Direct Mail Outreach",
	"Phone Sweep",
] as const;

const FIRST = [
	"Ruth",
	"Hollie",
	"Jennie",
	"Marcus",
	"Angela",
	"Tom",
	"Sara",
	"Peter",
] as const;
const LAST = [
	"Paucek",
	"Schaden",
	"Kunde",
	"Smith",
	"Johnson",
	"Lee",
	"Brown",
	"Nguyen",
] as const;
const STREETS = [
	"Bath Road",
	"Constance Spring",
	"Allen Valley",
	"King St",
	"2nd Ave",
] as const;
const KINDS: ActivityEvent["kind"][] = ["call", "email", "social", "note"];

export const pick = <T>(arr: readonly T[]): T =>
	arr[Math.floor(Math.random() * arr.length)]!;

export const randPhone = (): string => {
	const a = Math.floor(100 + Math.random() * 900);
	const b = Math.floor(100 + Math.random() * 900);
	const c = Math.floor(1000 + Math.random() * 9000);
	return `${a}-${b}-${c}`;
};

export function makeLeads(n: number, listName: string): DemoLead[] {
	return Array.from({ length: n }).map((_, i) => {
		const name = `${pick(FIRST)} ${pick(LAST)}`;
		const address = `${Math.floor(10 + Math.random() * 9900)} ${pick(STREETS)}`;
		const email = `${name.replace(/\s+/g, "_")}${i}@example.com`;
		const baseHandle = name.replace(/\s+/g, "").toLowerCase();
		const now = Date.now();
		const activity: ActivityEvent[] = Array.from(
			{ length: Math.floor(Math.random() * 7) + 5 },
			() => {
				const daysAgo = Math.floor(Math.random() * 90);
				const ts = new Date(now - daysAgo * 86_400_000).toISOString();
				const kind = pick(KINDS);
				const summaryBase = {
					call: "Phone call",
					email: "Email",
					social: "Social touch",
					note: "Note",
				}[kind];
				return {
					ts,
					kind,
					summary: `${summaryBase} with ${name.split(" ")[0]}`,
				};
			},
		).sort((a, b) => a.ts.localeCompare(b.ts));

		return {
			id: `${listName}-${i + 1}`,
			name,
			address,
			phone: randPhone(),
			email,
			socials: [
				{
					label: "Facebook",
					url: `https://facebook.com/${name.replace(/\s+/g, "")}`,
				},
				{ label: "LinkedIn", url: `https://linkedin.com/in/${baseHandle}` },
				{
					label: "Instagram",
					url: `https://instagram.com/${name.split(" ")[0].toLowerCase()}`,
				},
			],
			status: pick([
				"New Lead",
				"Contacted",
				"Qualified",
				"Do Not Contact",
			] as const),
			possiblePhones: Array.from(
				{ length: Math.floor(Math.random() * 3) },
				() => randPhone(),
			),
			possibleEmails: Array.from(
				{ length: Math.floor(Math.random() * 2) },
				(_, k) => `${name.replace(/\s+/g, ".").toLowerCase()}${k}@altmail.com`,
			),
			possibleHandles: [
				{
					platform: "Facebook",
					username: baseHandle,
					url: `https://facebook.com/${baseHandle}`,
				},
				{
					platform: "LinkedIn",
					username: `${baseHandle}`,
					url: `https://linkedin.com/in/${baseHandle}`,
				},
				{
					platform: "Instagram",
					username: name.split(" ")[0].toLowerCase(),
					url: `https://instagram.com/${name.split(" ")[0].toLowerCase()}`,
				},
				{
					platform: "Twitter",
					username: `${baseHandle.slice(0, 12)}`,
					url: `https://x.com/${baseHandle.slice(0, 12)}`,
				},
			],
			activity,
			isIPhone: Math.random() < 0.5,
			phoneVerified: Math.random() < 0.6,
			emailVerified: Math.random() < 0.7,
			socialVerified: Math.random() < 0.5,
			associatedAddress: `${address} Apt ${Math.floor(1 + Math.random() * 20)}`,
			addressVerified: Math.random() < 0.65,
		} satisfies DemoLead;
	});
}

export function makeRow(i: number): DemoRow {
	const list = DEMO_LISTS[i % DEMO_LISTS.length] as string;
	return {
		id: `${i + 1}`,
		list,
		uploadDate: new Date(Date.now() - i * 86_400_000).toISOString(),
		records: Math.floor(Math.random() * 5000) + 100,
		phone: Math.floor(Math.random() * 2000),
		emails: Math.floor(Math.random() * 1500),
		socials: Math.floor(Math.random() * 800),
		leads: makeLeads(3, list),
	} satisfies DemoRow;
}

export const makeData = (count = 123): DemoRow[] =>
	Array.from({ length: count }, (_, i) => makeRow(i));
