"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type * as z from "zod";

import ChannelCustomizationStep, { FormSchema } from "./steps/ChannelCustomizationStep";
import ChannelSelectionStep from "./steps/ChannelSelectionStep";
import FinalizeCampaignStep from "./steps/FinalizeCampaignStep";
import { TimingPreferencesStep } from "./steps/TimingPreferencesStep";
import { useCampaignCreationStore } from "@/lib/stores/campaignCreation";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// * Centralized Campaign Main Component
const allChannels: ("directmail" | "call" | "text" | "social")[] = ["call", "text", "directmail", "social"];
const disabledChannels: ("directmail" | "call" | "text" | "social")[] = [];

export default function CampaignModalMain({
  open: controlledOpen,
  onOpenChange,
  defaultChannel,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultChannel?: "directmail" | "call" | "text" | "social";
}) {
  const {
    areaMode,
    selectedLeadListId,
    leadCount,
    daysSelected,
    setDaysSelected,
    reachBeforeBusiness,
    reachAfterBusiness,
    reachOnWeekend,
    startDate,
    endDate,
    primaryChannel,
    setPrimaryChannel,
    reset,
  } = useCampaignCreationStore();

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 0;

  const mutatedDays = days > 0 ? Math.round(days * (reachOnWeekend ? 1.35 : 1)) : 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: sync derived state
  useEffect(() => {
    setDaysSelected(mutatedDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mutatedDays, reachOnWeekend]);

  const estimatedCredits = leadCount > 0 && mutatedDays > 0 ? Math.round(leadCount * mutatedDays) : 0;

  // Controlled/uncontrolled open
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setUncontrolledOpen(v);
  };

  const [step, setStep] = useState(0);

  const customizationForm = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      primaryPhoneNumber: "+11234567890",
      areaMode: (areaMode as any) || "leadList",
      selectedLeadListId: selectedLeadListId || "",
      templates: [],
      transferEnabled: true,
      transferType: "inbound_call",
      transferAgentId: "",
    },
  });

  const nextStep = async () => {
    if (step === 1) {
      const isValid = await customizationForm.trigger();
      if (!isValid) return;
    }
    setStep((s) => s + 1);
  };
  const prevStep = () => setStep((s) => Math.max(0, s - 1));
  const closeModal = () => setOpen(false);
  const launchCampaign = () => {
    // TODO: hook up real launch
    closeModal();
  };

  // Reset step and relevant store-derived form values when the dialog opens/closes
  useEffect(() => {
    if (open) {
      // ensure we always start at step 0 when opening
      setStep(0);
      // If caller provided a default channel and none is set, select it
      if (!primaryChannel && defaultChannel) {
        setPrimaryChannel(defaultChannel);
      }
    } else {
      // On close, reset to step 0 for the next open and clear transient errors
      setStep(0);
      // Reset store to initial state so new sessions are clean
      reset();
      customizationForm.reset({
        primaryPhoneNumber: "+11234567890",
        areaMode: (areaMode as any) || "leadList",
        selectedLeadListId: selectedLeadListId || "",
        templates: [],
        transferEnabled: true,
        transferType: "inbound_call",
        transferAgentId: "",
      });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background text-foreground shadow-lg outline-none h-[85vh] max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        <div className="p-6 pb-0">
          {/* Optional header space for title/actions if needed */}
        </div>
        {/* Body scroll area: max height subtracts header (approx 56px) and small gaps */}
        <div className="px-6 pb-6 pr-7 max-h-[calc(85vh-64px)] overflow-y-auto">
          {step === 0 && (
            <ChannelSelectionStep
              onNext={nextStep}
              onClose={closeModal}
              allChannels={allChannels}
              disabledChannels={disabledChannels}
            />
          )}
          {step === 1 && (
            <ChannelCustomizationStep onNext={nextStep} onBack={prevStep} form={customizationForm} />
          )}
          {step === 2 && <TimingPreferencesStep onBack={prevStep} onNext={nextStep} />}
          {process.env.NODE_ENV === "development" && (
            <p className="mt-3 text-xs text-muted-foreground">
              DEBUG: leadCount={leadCount}, startDate={String(startDate)}, endDate={String(endDate)}, days={days}, mutatedDays={mutatedDays}, reachBeforeBusiness={String(reachBeforeBusiness)}, reachAfterBusiness={String(reachAfterBusiness)}, reachOnWeekend={String(reachOnWeekend)}, estimatedCredits={estimatedCredits}
            </p>
          )}
          {step === 3 && (
            <FinalizeCampaignStep onBack={prevStep} onLaunch={launchCampaign} estimatedCredits={estimatedCredits} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
