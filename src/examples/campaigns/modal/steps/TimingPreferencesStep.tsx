import type { FC } from "react";
import { useCampaignCreationStore } from "@/lib/stores/campaignCreation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import Holidays from "date-holidays";

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
    reachOnHolidays,
    setReachOnHolidays,
  } = useCampaignCreationStore();

  // Initialize holidays for default country (US). Adjust if you add UI for country selection.
  const hd = new Holidays("US");

  const isWeekend = (d: Date) => {
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  const isHoliday = (d: Date) => Boolean(hd.isHoliday(d));

  const handleDateSelection = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return;
    const { from, to } = range;
    if (from) {
      if (!reachOnWeekend && isWeekend(from)) return;
      if (!reachOnHolidays && isHoliday(from)) return;
      setStartDate(new Date(from));
    }
    if (typeof to !== "undefined") {
      if (!to) {
        setEndDate(null);
      } else {
        if (!reachOnWeekend && isWeekend(to)) return;
        if (!reachOnHolidays && isHoliday(to)) return;
        setEndDate(new Date(to));
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-semibold text-lg">Timing Preferences</h2>

      <div className="space-y-1">
        <Label>Select Start Date And End Date</Label>
        <div className="flex justify-center">
          <Calendar
            mode="range"
            selected={{ from: startDate, to: endDate ?? undefined }}
            onSelect={handleDateSelection}
            numberOfMonths={2}
            fromDate={new Date()}
            orientation="horizontal"
            disabled={(date) => {
              const weekendDisabled = !reachOnWeekend && isWeekend(date);
              const holidayDisabled = !reachOnHolidays && isHoliday(date);
              return weekendDisabled || holidayDisabled;
            }}
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
        <div className="flex items-center gap-2">
          <Checkbox id="holidays" checked={reachOnHolidays} onCheckedChange={(v) => setReachOnHolidays(!!v)} />
          <Label htmlFor="holidays">Reach on holidays</Label>
        </div>
      </div>

      {/* Debug: Show skipped dates within selected range */}
      {startDate && endDate && (
        <div className="mx-auto max-w-md text-left text-xs text-muted-foreground">
          {(() => {
            const skipped: string[] = [];
            const d = new Date(startDate);
            while (d <= (endDate as Date)) {
              if ((!reachOnWeekend && isWeekend(d)) || (!reachOnHolidays && isHoliday(d))) {
                skipped.push(new Date(d).toISOString().slice(0, 10));
              }
              d.setDate(d.getDate() + 1);
            }
            if (skipped.length) {
              // eslint-disable-next-line no-console
              console.debug("Skipped dates (weekends/holidays):", skipped);
            }
            return skipped.length ? (
              <p>Skipping {skipped.length} day(s): {skipped.join(", ")}</p>
            ) : null;
          })()}
        </div>
      )}

      <div className="mt-6 flex justify-between gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
        <Button type="button" onClick={onNext}>Next</Button>
      </div>
    </div>
  );
};
