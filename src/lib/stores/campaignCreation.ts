import { create } from "zustand";

// Types for agent selection
export interface Agent {
	id: string;
	name: string;
	email: string;
	status: "active" | "inactive" | "away";
}

// Mock data for available agents
const MOCK_AGENTS: Agent[] = [
	{
		id: "1",
		name: "John Doe",
		email: "john@example.com",
		status: "active",
	},
	{
		id: "2",
		name: "Jane Smith",
		email: "jane@example.com",
		status: "active",
	},
	{
		id: "3",
		name: "Mike Johnson",
		email: "mike@example.com",
		status: "away",
	},
];

// * Campaign Creation Store for multi-step modal context
export interface CampaignCreationState {
	// Step 1: Channel Selection
	primaryChannel: "directmail" | "call" | "text" | "social" | null;
	setPrimaryChannel: (channel: "directmail" | "call" | "text" | "social") => void;

	// Campaign Name
	campaignName: string;
	setCampaignName: (name: string) => void;

	// Agent Selection
	selectedAgentId: string | null;
	setSelectedAgentId: (id: string | null) => void;
	availableAgents: Agent[];
	setAvailableAgents: (agents: Agent[]) => void;

	// Step 2: Area & Lead List
	areaMode: "zip" | "leadList";
	setAreaMode: (mode: "zip" | "leadList") => void;
	selectedLeadListId: string;
	setSelectedLeadListId: (id: string) => void;
	campaignArea: string;
	setCampaignArea: (area: string) => void;
	leadCount: number;
	includeWeekends: boolean;
	setIncludeWeekends: (v: boolean) => void;
	setLeadCount: (count: number) => void;

	// Step 3: Timing Preferences
	daysSelected: number;
	setDaysSelected: (days: number) => void;

	startDate: Date;
	setStartDate: (date: Date) => void;
	endDate: Date | null;
	setEndDate: (date: Date | null) => void;
	reachBeforeBusiness: boolean;
	setReachBeforeBusiness: (v: boolean) => void;
	reachAfterBusiness: boolean;
	setReachAfterBusiness: (v: boolean) => void;
	reachOnWeekend: boolean;
	setReachOnWeekend: (v: boolean) => void;
	reachOnHolidays: boolean;
	setReachOnHolidays: (v: boolean) => void;

	// Utility: Reset
	reset: () => void;
}

export const useCampaignCreationStore = create<CampaignCreationState>((set) => ({
	// Step 1: Channel Selection
	primaryChannel: null,
	setPrimaryChannel: (primaryChannel) => set({ primaryChannel }),

	// Campaign Name
	campaignName: "",
	setCampaignName: (campaignName) => set({ campaignName }),

	// Agent selection
	selectedAgentId: null,
	setSelectedAgentId: (selectedAgentId) => set({ selectedAgentId }),
	availableAgents: MOCK_AGENTS,
	setAvailableAgents: (availableAgents) => set({ availableAgents }),

	// Step 2: Area & Lead List
	areaMode: "leadList",
	setAreaMode: (areaMode) => set({ areaMode }),
	selectedLeadListId: "",
	setSelectedLeadListId: (selectedLeadListId) => set({ selectedLeadListId }),
	campaignArea: "",
	setCampaignArea: (campaignArea) => set({ campaignArea }),
	leadCount: 0,
	setLeadCount: (leadCount) => set({ leadCount }),
	includeWeekends: false,
	setIncludeWeekends: (includeWeekends) => set({ includeWeekends }),

	// Step 3: Timing Preferences
	daysSelected: 7,
	setDaysSelected: (daysSelected) => set({ daysSelected }),
	startDate: new Date(),
	setStartDate: (startDate) => set({ startDate }),
	endDate: null,
	setEndDate: (endDate) => set({ endDate }),
	reachBeforeBusiness: false,
	setReachBeforeBusiness: (reachBeforeBusiness) => set({ reachBeforeBusiness }),
	reachAfterBusiness: false,
	setReachAfterBusiness: (reachAfterBusiness) => set({ reachAfterBusiness }),
	reachOnWeekend: false,
	setReachOnWeekend: (reachOnWeekend) => set({ reachOnWeekend }),
	reachOnHolidays: false,
	setReachOnHolidays: (reachOnHolidays) => set({ reachOnHolidays }),

	// Reset function
	reset: () =>
		set({
			// Step 1
			primaryChannel: null,
			campaignName: "",

			// Agent Selection
			selectedAgentId: null,
			availableAgents: MOCK_AGENTS,

			// Step 2
			areaMode: "leadList",
			selectedLeadListId: "",
			campaignArea: "",
			leadCount: 0,
			includeWeekends: false,

			// Step 3
			daysSelected: 7,
			startDate: new Date(),
			endDate: null,
			reachBeforeBusiness: false,
			reachAfterBusiness: false,
			reachOnWeekend: false,
			reachOnHolidays: false,
		}),
}));
