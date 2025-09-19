import { Button } from "@/components/ui/button";
import type { FC } from "react";
import { toast } from "sonner";
import { useCampaignCreationStore } from "@/lib/stores/campaignCreation";

interface ChannelSelectionStepProps {
  onNext: () => void;
  onClose: () => void;
  allChannels: ("directmail" | "call" | "text" | "social")[];
  disabledChannels?: ("directmail" | "call" | "text" | "social")[];
}

const ChannelSelectionStep: FC<ChannelSelectionStepProps> = ({
  onNext,
  onClose,
  allChannels,
  disabledChannels = [],
}) => {
  const { primaryChannel, setPrimaryChannel } = useCampaignCreationStore();
  const validateChannel = () => !!primaryChannel;

  const handleNextStep = () => {
    if (validateChannel()) onNext();
    else toast("Please select a primary channel.");
  };

  return (
    <div>
      <h2 className="mb-4 font-semibold text-lg">Select Primary Channel</h2>
      <div className="mb-4 flex flex-col gap-3">
        {allChannels.map((channel) => {
          // Normalize store channel (which uses 'email' for direct mail) to UI channel label
          type StoreChannel = "email" | "call" | "text" | "social";
          type UiChannel = "directmail" | "call" | "text" | "social";
          const toUi = (c: StoreChannel | null): UiChannel | null =>
            c === "email" ? "directmail" : c;
          const toStore = (c: UiChannel): StoreChannel =>
            c === "directmail" ? "email" : c;

          const storePrimary = primaryChannel as StoreChannel | null;
          const uiPrimary: UiChannel | null = toUi(storePrimary);
          const isActive = uiPrimary === channel;
          return (
            <Button
              key={channel}
              onClick={() => {
                (setPrimaryChannel as (c: StoreChannel) => void)(
                  toStore(channel),
                );
              }}
              variant={isActive ? "default" : "outline"}
              className="flex items-center justify-between capitalize"
              type="button"
            >
              <span>{channel}</span>
            </Button>
          );
        })}
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onClose} variant="ghost" type="button">
          Cancel
        </Button>
        <Button onClick={handleNextStep} type="button">
          Next
        </Button>
      </div>
    </div>
  );
};

export default ChannelSelectionStep;
