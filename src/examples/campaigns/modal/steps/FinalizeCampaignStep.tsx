import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../../../components/ui/form";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { FC } from "react";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCampaignCreationStore } from "@/lib/stores/campaignCreation";
import { finalizeCampaignSchema, type FinalizeCampaignForm } from "@/types/zod/campaign-finalize-schema";

interface FinalizeCampaignStepProps {
  estimatedCredits: number;
  onLaunch: () => void;
  onBack: () => void;
  onCreateAbTest?: () => void;
}

// Simple mock workflows for selection
const MOCK_WORKFLOWS = [
  { id: "wf1", name: "Default: Nurture 7-day" },
  { id: "wf2", name: "Aggressive: 3-day blitz" },
  { id: "wf3", name: "Custom: Follow-up only" },
];

// Simple mock sales scripts for selection
const MOCK_SCRIPTS = [
  { id: "ss1", name: "General Sales Script" },
  { id: "ss2", name: "Appointment Setter Script" },
  { id: "ss3", name: "Appraisal Follow-up Script" },
];

const FinalizeCampaignStep: FC<FinalizeCampaignStepProps> = ({ estimatedCredits, onLaunch, onBack, onCreateAbTest }) => {
  const { campaignName, setCampaignName, selectedAgentId, setSelectedAgentId, availableAgents } =
    useCampaignCreationStore();

  const form: UseFormReturn<FinalizeCampaignForm> = useForm<FinalizeCampaignForm>({
    resolver: zodResolver(finalizeCampaignSchema),
    defaultValues: {
      campaignName: campaignName,
      selectedAgentId: selectedAgentId || undefined,
      selectedWorkflowId: MOCK_WORKFLOWS[0]?.id,
      selectedSalesScriptId: MOCK_SCRIPTS[0]?.id,
      campaignGoal: "",
    },
    mode: "onChange",
  });

  const handleLaunch = (data: FinalizeCampaignForm) => {
    setCampaignName(data.campaignName);
    setSelectedAgentId(data.selectedAgentId);
    onLaunch();
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleLaunch)} className="mx-auto max-w-lg space-y-6">
        <h2 className="font-semibold text-lg dark:text-white">Finalize your campaign</h2>

        <FormField
          control={form.control}
          name="campaignName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter campaign name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="selectedAgentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Assign AI Agent
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircledIcon />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select an AI agent to manage this campaign.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <span>{agent.name}</span>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            agent.status === "active"
                              ? "bg-green-500"
                              : agent.status === "away"
                              ? "bg-yellow-500"
                              : "bg-gray-400"
                          }`}
                          title={agent.status}
                        />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="selectedWorkflowId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">Workflow</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a workflow" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MOCK_WORKFLOWS.map((wf) => (
                    <SelectItem key={wf.id} value={wf.id}>
                      {wf.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="selectedSalesScriptId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">Sales Script</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sales script" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MOCK_SCRIPTS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="campaignGoal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Goal</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter your campaign goal (1 sentence min, 1-2 paragraphs max)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 pt-4">
          <p className="text-gray-500 text-sm dark:text-gray-400">This campaign will cost {estimatedCredits} credits.</p>

          <Button type="submit" className="w-full" disabled={!form.formState.isValid}>
            Launch Campaign
          </Button>
          {onCreateAbTest && (
            <Button
              type="button"
              className="w-full"
              variant="secondary"
              onClick={() => {
                // Keep current form values synced to the store, then trigger A/B creation
                const values = form.getValues();
                setCampaignName(values.campaignName);
                setSelectedAgentId(values.selectedAgentId ?? null);
                onCreateAbTest();
              }}
            >
              Create A/B Test
            </Button>
          )}
          <Button onClick={onBack} className="w-full" variant="outline" type="button">
            Back
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default FinalizeCampaignStep;
