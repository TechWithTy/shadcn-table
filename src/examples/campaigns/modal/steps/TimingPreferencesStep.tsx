import type { FC } from "react";
import { useCampaignCreationStore } from "@/lib/stores/campaignCreation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TimingPreferencesStepProps {
  onNext: () => void;
  onBack: () => void;
}

export const TimingPreferencesStep: FC<TimingPreferencesStepProps> = ({ onNext, onBack }) => {
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    reachBeforeBusiness,
    reachAfterBusiness,
    reachOnWeekend,
    setReachBeforeBusiness,
    setReachAfterBusiness,
    setReachOnWeekend,
  } = useCampaignCreationStore();

  return (
    <div className="space-y-6">
      <h2 className="font-semibold text-lg">Timing Preferences</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="start-date">Start Date</Label>
          <input
            id="start-date"
            type="date"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={startDate ? new Date(startDate).toISOString().slice(0, 10) : ""}
            onChange={(e) => setStartDate(new Date(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="end-date">End Date</Label>
          <input
            id="end-date"
            type="date"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={endDate ? new Date(endDate).toISOString().slice(0, 10) : ""}
            onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox id="beforeBiz" checked={reachBeforeBusiness} onCheckedChange={(v) => setReachBeforeBusiness(!!v)} />
          <Label htmlFor="beforeBiz">Reach before business hours</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="afterBiz" checked={reachAfterBusiness} onCheckedChange={(v) => setReachAfterBusiness(!!v)} />
          <Label htmlFor="afterBiz">Reach after business hours</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="weekend" checked={reachOnWeekend} onCheckedChange={(v) => setReachOnWeekend(!!v)} />
          <Label htmlFor="weekend">Reach on weekends</Label>
        </div>
      </div>

      <div className="mt-6 flex justify-between gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
        <Button type="button" onClick={onNext}>Next</Button>
      </div>
    </div>
  );
};
