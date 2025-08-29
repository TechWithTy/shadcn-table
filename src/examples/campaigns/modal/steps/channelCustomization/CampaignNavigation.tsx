import type { FC } from "react";
import { Button } from "@/components/ui/button";

interface CampaignNavigationProps {
  onBack: () => void;
  onNext: () => void;
}

const CampaignNavigation: FC<CampaignNavigationProps> = ({ onBack, onNext }) => {
  return (
    <div className="mt-8 flex justify-between gap-2">
      <Button onClick={onBack} variant="ghost" type="button">
        Back
      </Button>
      <Button onClick={onNext} type="button">
        Next
      </Button>
    </div>
  );
};

export default CampaignNavigation;
