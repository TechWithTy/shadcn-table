import type { FC } from "react";
import { useEffect, useState } from "react";
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
import AllRecipientDropdown from "../../../../../../ai-avatar-dropdown/AllRecipientDropdown";

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
    transferGuidelines: z.string().default(""),
    transferPrompt: z.string().default(""),
    // Number Pooling (Calls/Text only)
    numberPoolingEnabled: z.boolean().default(false),
    messagingServiceSid: z
      .string()
      .trim()
      .optional()
      .refine((val) => !val || /^MG[a-zA-Z0-9]{32}$/.test(val), {
        message: "Must start with 'MG' and be a valid Twilio SID",
      }),
    senderPoolNumbersCsv: z.string().default(""), // CSV of E.164 numbers
    smartEncodingEnabled: z.boolean().default(true),
    optOutHandlingEnabled: z.boolean().default(true),
    perNumberDailyLimit: z.number().int().nonnegative().default(75),
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

// Additional conditional validations for transfer text fields
export const TransferConditionalSchema = FormSchema.superRefine((data, ctx) => {
  if (data.transferEnabled) {
    if (!data.transferGuidelines || data.transferGuidelines.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Transfer guidelines are required when transfer is enabled.", path: ["transferGuidelines"] });
    }
    if (!data.transferPrompt || data.transferPrompt.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Transfer prompt/message is required when transfer is enabled.", path: ["transferPrompt"] });
    }
  }
});

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
    // Number pooling store fields
    numberPoolingEnabled,
    setNumberPoolingEnabled,
    messagingServiceSid,
    setMessagingServiceSid,
    senderPoolNumbersCsv,
    setSenderPoolNumbersCsv,
    smartEncodingEnabled,
    setSmartEncodingEnabled,
    optOutHandlingEnabled,
    setOptOutHandlingEnabled,
    perNumberDailyLimit,
    setPerNumberDailyLimit,
    availableSenderNumbers,
    selectedSenderNumbers,
    setSelectedSenderNumbers,
    numberSelectionStrategy,
    setNumberSelectionStrategy,
    setAvailableSenderNumbers,
  } = useCampaignCreationStore();

  const watchedAreaMode = form.watch("areaMode");
  const watchedDirectMailType = form.watch("directMailType");
  const watchedPrimaryChannel = primaryChannel;
  const poolingEnabled = form.watch("numberPoolingEnabled");

  const [poolingExpanded, setPoolingExpanded] = useState(false);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  const [numbersError, setNumbersError] = useState<string | null>(null);

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

  // Initialize form with store-backed defaults for number pooling
  useEffect(() => {
    form.setValue("numberPoolingEnabled", numberPoolingEnabled);
    form.setValue("messagingServiceSid", messagingServiceSid || "");
    form.setValue("senderPoolNumbersCsv", senderPoolNumbersCsv || "");
    form.setValue("smartEncodingEnabled", smartEncodingEnabled);
    form.setValue("optOutHandlingEnabled", optOutHandlingEnabled);
    form.setValue("perNumberDailyLimit", perNumberDailyLimit ?? 75);
    // Expand if enabled to show current values
    if (numberPoolingEnabled) setPoolingExpanded(true);
    // If CSV had values but no explicit selections, hydrate selection from CSV
    if ((senderPoolNumbersCsv?.trim()?.length || 0) > 0 && (selectedSenderNumbers?.length || 0) === 0) {
      const parsed = senderPoolNumbersCsv
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      setSelectedSenderNumbers(parsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync form -> store for number pooling fields
  useEffect(() => {
    const sub = form.watch((vals, { name }) => {
      switch (name) {
        case "numberPoolingEnabled":
          setNumberPoolingEnabled(Boolean(vals.numberPoolingEnabled));
          break;
        case "messagingServiceSid":
          setMessagingServiceSid(vals.messagingServiceSid || "");
          break;
        case "senderPoolNumbersCsv":
          setSenderPoolNumbersCsv(vals.senderPoolNumbersCsv || "");
          break;
        case "smartEncodingEnabled":
          setSmartEncodingEnabled(Boolean(vals.smartEncodingEnabled));
          break;
        case "optOutHandlingEnabled":
          setOptOutHandlingEnabled(Boolean(vals.optOutHandlingEnabled));
          break;
        case "perNumberDailyLimit":
          setPerNumberDailyLimit(Number(vals.perNumberDailyLimit ?? 75));
          break;
        default:
          break;
      }
    });
    return () => sub.unsubscribe();
  }, [form, setNumberPoolingEnabled, setMessagingServiceSid, setSenderPoolNumbersCsv, setSmartEncodingEnabled, setOptOutHandlingEnabled, setPerNumberDailyLimit]);

  // On first expand, fetch connected numbers from server and populate store
  useEffect(() => {
    if (!poolingExpanded) return;
    // Only fetch once if list is empty or still mocked
    if ((availableSenderNumbers?.length || 0) > 0) return;
    let isActive = true;
    (async () => {
      try {
        setLoadingNumbers(true);
        setNumbersError(null);
        const res = await fetch("/api/twilio/numbers", { cache: "no-store" });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed: ${res.status}`);
        }
        const data: { numbers?: string[] } = await res.json();
        if (isActive) {
          setAvailableSenderNumbers(data.numbers || []);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (isActive) setNumbersError(msg);
      } finally {
        if (isActive) setLoadingNumbers(false);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [poolingExpanded, availableSenderNumbers, setAvailableSenderNumbers]);

  if (!primaryChannel) {
    return <div className="text-red-500">Please select a channel first.</div>;
  }

  const watchedTransferType = form.watch("transferType");
  const isLivePerson = watchedTransferType === "chat_live_person" || watchedTransferType === "appraisal";

  return (
    <Form {...form}>
      <div className="h-full flex flex-col">
        <div className="flex-1 min-h-0 space-y-6 overflow-y-auto pr-1">
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

        {/* Number Pooling (Calls/Text) */}
        {(watchedPrimaryChannel === "text" || watchedPrimaryChannel === "call") && (
          <div className="space-y-2 border rounded-md p-3">
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="numberPoolingEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <Checkbox id="number-pooling-enabled" checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                    <FormLabel className="!m-0" htmlFor="number-pooling-enabled">Enable Number Pooling</FormLabel>
                  </FormItem>
                )}
              />
              <Button type="button" variant="ghost" onClick={() => setPoolingExpanded((s) => !s)}>
                {poolingExpanded ? "Hide" : "Show"}
              </Button>
            </div>

            {poolingExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Selection strategy */}
                <div>
                  <FormLabel>Number selection strategy</FormLabel>
                  <div className="mt-1">
                    <Select
                      value={numberSelectionStrategy}
                      onValueChange={(v) => setNumberSelectionStrategy(v as any)}
                      disabled={!poolingEnabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round_robin">Round-robin</SelectItem>
                        <SelectItem value="sticky_by_lead">Sticky by lead</SelectItem>
                        <SelectItem value="random">Random</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Sender numbers multi-select */}
                <div className="md:col-span-2">
                  <FormLabel>Sender Numbers</FormLabel>
                  <div className="text-xs text-muted-foreground mb-1">
                    Selected {selectedSenderNumbers.length} of {availableSenderNumbers.length}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {availableSenderNumbers.map((num) => {
                      const checked = selectedSenderNumbers.includes(num);
                      return (
                        <label key={num} className={`flex items-center gap-2 border rounded-md px-3 py-2 ${!poolingEnabled ? "opacity-50" : ""}`}>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              if (!poolingEnabled) return;
                              const next = v
                                ? Array.from(new Set([...selectedSenderNumbers, num]))
                                : selectedSenderNumbers.filter((n) => n !== num);
                              setSelectedSenderNumbers(next);
                              // keep CSV in sync under the hood for backward compatibility
                              const csv = next.join(", ");
                              form.setValue("senderPoolNumbersCsv", csv);
                              setSenderPoolNumbersCsv(csv);
                            }}
                            disabled={!poolingEnabled}
                          />
                          <span>{num}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="messagingServiceSid"
                  render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="twilio-messaging-service-sid">Messaging Service SID</FormLabel>
                    <FormControl>
                        <input id="twilio-messaging-service-sid" className="w-full border rounded-md px-3 py-2 bg-background" placeholder="MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" disabled={!poolingEnabled} {...field} />
                    </FormControl>
                    <div className="text-xs text-muted-foreground">Twilio Console → Messaging → Services</div>
                    <FormMessage />
                  </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="perNumberDailyLimit"
                  render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="per-number-daily-limit">Per-number daily limit</FormLabel>
                    <FormControl>
                        <input id="per-number-daily-limit" type="number" min={1} className="w-full border rounded-md px-3 py-2 bg-background" value={field.value ?? 75} onChange={(e) => field.onChange(Number(e.target.value))} disabled={!poolingEnabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smartEncodingEnabled"
                  render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                      <Checkbox id="smart-encoding-toggle" checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} disabled={!poolingEnabled} />
                      <FormLabel className="!m-0" htmlFor="smart-encoding-toggle">Smart Encoding</FormLabel>
                  </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="optOutHandlingEnabled"
                  render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                      <Checkbox id="opt-out-handling-toggle" checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} disabled={!poolingEnabled} />
                      <FormLabel className="!m-0" htmlFor="opt-out-handling-toggle">Opt-out Handling</FormLabel>
                  </FormItem>
                  )}
                />

                {/* Keep CSV field in form for validation/back-compat but hide the input */}
                <FormField
                  control={form.control}
                  name="senderPoolNumbersCsv"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormControl>
                        <input type="hidden" value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        )}

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
                  <FormLabel>{isLivePerson ? "Select Employee/Subuser" : "Select Agent"}</FormLabel>
                  <FormControl>
                    <AllRecipientDropdown
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        setSelectedAgentId(val);
                      }}
                      availablePeople={availableAgents}
                      transferType={watchedTransferType}
                      placeholderAgent="Select an agent"
                      placeholderEmployee="Select an employee or subuser"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Transfer Guidelines */}
            <FormField
              control={form.control}
              name="transferGuidelines"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transfer Guidelines</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide brief guidelines for the live agent (context, do/don'ts, handoff notes)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Transfer Prompt / Message */}
            <FormField
              control={form.control}
              name="transferPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transfer Prompt / Message</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What should be sent or spoken to initiate/announce the transfer?" {...field} />
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
        </div>
        <CampaignNavigation onBack={onBack} onNext={onNext} />
      </div>
    </Form>
  );
};

export default ChannelCustomizationStep;
