import type { FC } from "react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useCampaignCreationStore } from "@/lib/stores/campaignCreation";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "../../../../components/ui/form";
import PhoneNumberInput from "./channelCustomization/PhoneNumberInput";
import AreaModeSelector from "./channelCustomization/AreaModeSelector";
import LeadListSelector from "./channelCustomization/LeadListSelector";
import CampaignNavigation from "./channelCustomization/CampaignNavigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Button } from "../../../../components/ui/button";
import { Textarea } from "../../../../components/ui/textarea";
import { Checkbox } from "../../../../components/ui/checkbox";

// * Step 2: Channel Customization
import type { UseFormReturn } from "react-hook-form";

interface ChannelCustomizationStepProps {
  onNext: () => void;
  onBack: () => void;
  form: UseFormReturn<z.infer<typeof FormSchema>>;
}

export const FormSchema = z
  .object({
    primaryPhoneNumber: z
      .string()
      .transform((val) => {
        let digits = val.replace(/\D/g, "");
        if (digits.startsWith("1")) {
          digits = digits.substring(1);
        }
        return `+1${digits}`;
      })
      .refine((val) => /^\+1\d{10}$/.test(val), {
        message: "Phone number must be 10 digits after the +1 country code.",
      }),
    areaMode: z.enum(["zip", "leadList"], {
      required_error: "You must select an area mode.",
    }),
    selectedLeadListId: z.string().optional(),
    // Social-specific
    socialPlatform: z.enum(["facebook", "linkedin"]).optional(),
    // Direct mail-specific
    directMailType: z.enum(["postcard", "letter_front", "letter_front_back", "snap_pack"]).optional(),
    templates: z
      .array(
        z.object({
          templateId: z.string({ required_error: "Please select a template." }),
          description: z.string().max(200).optional(),
        }),
      )
      .default([]),
    // Transfer
    transferEnabled: z.boolean().default(true),
    transferType: z
      .enum(["inbound_call", "outbound_call", "social", "text", "chat_live_person", "appraisal", "live_avatar"])
      .default("inbound_call"),
    transferAgentId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.areaMode === "leadList") {
        return !!data.selectedLeadListId;
      }
      return true;
    },
    { message: "Please select a lead list.", path: ["selectedLeadListId"] },
  )
  .refine(
    (data) => {
      // When direct mail type requires two sides, enforce at least 2 templates
      const needsTwo = data.directMailType === "letter_front_back" || data.directMailType === "snap_pack";
      if (!data.directMailType) return true;
      if (needsTwo) return (data.templates?.length || 0) >= 2;
      return (data.templates?.length || 0) >= 1;
    },
    {
      message: "Please add the required number of templates for the selected mail type.",
      path: ["templates"],
    },
  )
  .refine(
    (data) => {
      if (data.transferEnabled) {
        return Boolean(data.transferAgentId && data.transferAgentId.length > 0);
      }
      return true;
    },
    { message: "Please select an agent to transfer to.", path: ["transferAgentId"] },
  );

const ChannelCustomizationStep: FC<ChannelCustomizationStepProps> = ({ onNext, onBack, form }) => {
  const {
    primaryChannel,
    areaMode,
    setAreaMode,
    selectedLeadListId,
    setSelectedLeadListId,
    setLeadCount,
    availableAgents,
    setSelectedAgentId,
  } = useCampaignCreationStore();

  const watchedAreaMode = form.watch("areaMode");
  const watchedDirectMailType = form.watch("directMailType");

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "templates" });

  useEffect(() => {
    setAreaMode(watchedAreaMode);
  }, [watchedAreaMode, setAreaMode]);

  useEffect(() => {
    if (watchedAreaMode !== "leadList") {
      setLeadCount(0);
      setSelectedLeadListId("");
      form.setValue("selectedLeadListId", "");
    }
  }, [watchedAreaMode, setLeadCount, setSelectedLeadListId, form]);

  if (!primaryChannel) {
    return <div className="text-red-500">Please select a channel first.</div>;
  }

  return (
    <Form {...form}>
      <div className="space-y-6">
        <h2 className="font-semibold text-lg">Channel Customization</h2>
        <p className="text-gray-500 text-sm">Customize settings for your {primaryChannel} campaign.</p>

        <FormField
          control={form.control}
          name="primaryPhoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <PhoneNumberInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Transfer toggle and agent selection */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="transferEnabled"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <Checkbox id="transfer-enabled" checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                <FormLabel className="!m-0" htmlFor="transfer-enabled">Enable Transfer to Agent</FormLabel>
              </FormItem>
            )}
          />

          {form.watch("transferEnabled") && (
            <>
              <FormField
                control={form.control}
                name="transferType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transfer Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transfer type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inbound_call">Inbound Call</SelectItem>
                          <SelectItem value="outbound_call">Outbound Call</SelectItem>
                          <SelectItem value="social">Social</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="chat_live_person">Chat (Live Person)</SelectItem>
                          <SelectItem value="appraisal">Appraisal</SelectItem>
                          <SelectItem value="live_avatar">Live Avatar</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="transferAgentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Agent</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        setSelectedAgentId(val);
                      }}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an agent" />
                      </SelectTrigger>
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </>
          )}
        </div>

        {primaryChannel === "social" && (
          <FormField
            control={form.control}
            name="socialPlatform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Social Platform</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {primaryChannel === "directmail" && (
          <>
            <FormField
              control={form.control}
              name="directMailType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Direct Mail Type</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="postcard">Postcard</SelectItem>
                        <SelectItem value="letter_front">Letter (Front only)</SelectItem>
                        <SelectItem value="letter_front_back">Letter (Front & Back)</SelectItem>
                        <SelectItem value="snap_pack">Snap Pack</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Templates</FormLabel>
              {fields.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  <div className="md:col-span-5">
                    <FormField
                      control={form.control}
                      name={`templates.${index}.templateId` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a template" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tpl_basic">Basic Template</SelectItem>
                                <SelectItem value="tpl_pro">Professional Template</SelectItem>
                                <SelectItem value="tpl_modern">Modern Template</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="md:col-span-6">
                    <FormField
                      control={form.control}
                      name={`templates.${index}.description` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea placeholder="Description (optional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="md:col-span-1 flex items-start">
                    <Button type="button" variant="ghost" onClick={() => remove(index)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {watchedDirectMailType === "letter_front_back" || watchedDirectMailType === "snap_pack"
                    ? "Requires at least 2 templates (front and back)."
                    : "Requires at least 1 template."}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ templateId: "", description: "" })}
                >
                  Add more
                </Button>
              </div>
            </div>
          </>
        )}

        <FormField
          control={form.control}
          name="areaMode"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormControl>
                <AreaModeSelector onValueChange={field.onChange} value={field.value} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchedAreaMode === "leadList" && (
          <FormField
            control={form.control}
            name="selectedLeadListId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <LeadListSelector
                    value={field.value || ""}
                    onChange={(selectedValue: string, recordCount: number) => {
                      field.onChange(selectedValue);
                      setSelectedLeadListId(selectedValue);
                      setLeadCount(recordCount);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <CampaignNavigation onBack={onBack} onNext={onNext} />
      </div>
    </Form>
  );
};

export default ChannelCustomizationStep;
