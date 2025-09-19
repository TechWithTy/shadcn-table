import type { SocialRow } from "./build-columns/types";

// Minimal interfaces to avoid `any` while remaining framework-agnostic
interface RowLike {
  getValue: (id: string) => unknown;
}
type FilterValue = unknown;

// Utility function for date range filtering
export const dateRangeFilterFn = (row: RowLike, id: string, value: FilterValue) => {
	const raw = String(row.getValue(id) ?? "");
	const ts = raw ? new Date(raw).getTime() : Number.NaN;
	const [start, end] = Array.isArray(value) ? (value as [unknown, unknown]) : [];
	const lo = start
		? new Date(start as string).getTime()
		: Number.NEGATIVE_INFINITY;
	const hi = end ? new Date(end as string).getTime() : Number.POSITIVE_INFINITY;
	return Number.isNaN(ts) ? false : ts >= lo && ts <= hi;
};

// Utility function for number range filtering
export const numberRangeFilterFn = (row: RowLike, id: string, value: FilterValue) => {
	const n = Number(row.getValue(id) ?? 0);
	const [min, max] = Array.isArray(value) ? (value as [unknown, unknown]) : [];
	const lo = typeof min === "number" ? min : Number.NEGATIVE_INFINITY;
	const hi = typeof max === "number" ? max : Number.POSITIVE_INFINITY;
	return n >= lo && n <= hi;
};

// Utility function for select filtering
export const selectFilterFn = (row: RowLike, id: string, value: FilterValue) => {
	const v = String(row.getValue(id) ?? "");
	return Array.isArray(value) ? value.includes(v) : String(value) === v;
};

// Utility function for canSend filtering
export const canSendFilterFn = (row: RowLike, id: string, value: FilterValue) => {
	const v = String(row.getValue(id) ?? "");
	return Array.isArray(value) ? value.includes(v) : String(value) === v;
};

// Utility function to determine if a campaign can send
export const canSendAccessorFn = (row: SocialRow) => {
	const o = row;
	const platform = o.platform as string | undefined;
	let ok = false;

	if (platform === "facebook") {
		const hasAudience = Boolean(o.facebookSubscriberId || o.facebookExternalId);
		const hasFlow = Boolean(o.manychatFlowId || o.manychatFlowName);
		ok = hasAudience && hasFlow;
	} else if (platform === "linkedin") {
		const hasAudience = Boolean(
			o.linkedinChatId || o.linkedinProfileUrl || o.linkedinPublicId,
		);
		const hasTemplate = Boolean(o.liTemplateType || o.liTemplateName);
		ok = hasAudience && hasTemplate;
	}

	return ok ? "yes" : "no";
};
