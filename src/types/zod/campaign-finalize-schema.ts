import { z } from "zod";

// * Zod schema for the finalize campaign step
export const finalizeCampaignSchema = z.object({
  campaignName: z
    .string()
    .min(5, "Campaign name must be at least 5 characters.")
    .max(30, "Campaign name must be 30 characters or less.")
    .regex(/^[A-Za-z0-9. ]+$/, "Campaign name can only contain letters, numbers, spaces, and dots."),
  selectedAgentId: z.string({ required_error: "Please select an agent." }),
  selectedWorkflowId: z.string({ required_error: "Please select a workflow." }),
  selectedSalesScriptId: z.string({ required_error: "Please select a sales script." }),
  campaignGoal: z
    .string()
    .min(10, "Campaign goal must be at least 10 characters.")
    .max(300, "Campaign goal cannot exceed 300 characters.")
    .refine((value) => value.includes("."), { message: "Campaign goal must be at least one sentence." }),
});

export type FinalizeCampaignForm = z.infer<typeof finalizeCampaignSchema>;
