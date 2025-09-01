import type { FC } from "react";
import { useCampaignCreationStore } from "@/lib/stores/campaignCreation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
    getTimezoneFromLeadLocation,
    setGetTimezoneFromLeadLocation,
    minDailyAttempts,
    setMinDailyAttempts,
    maxDailyAttempts,
    setMaxDailyAttempts,
    countVoicemailAsAnswered,
    setCountVoicemailAsAnswered,
  } = useCampaignCreationStore();

  // Initialize holidays for default country (US). Adjust if you add UI for country selection.
  const hd = new Holidays("US");

  const isWeekend = (d: Date) => {
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  const minAttemptsError = minDailyAttempts < 1;
  const maxAttemptsError = maxDailyAttempts < minDailyAttempts;

  const isHoliday = (d: Date) => Boolean(hd.isHoliday(d));

  const handleStartSelect = (d?: Date) => {
    if (!d) return;
    if (!reachOnWeekend && isWeekend(d)) return;
    if (!reachOnHolidays && isHoliday(d)) return;
    setStartDate(new Date(d));
  };

  const handleEndSelect = (d?: Date) => {
    if (!d) return;
    if (!reachOnWeekend && isWeekend(d)) return;
    if (!reachOnHolidays && isHoliday(d)) return;
    setEndDate(new Date(d));
  };

  return (
    <div className="space-y-6">
      <h2 className="font-semibold text-lg">Timing Preferences</h2>

      <div className="space-y-1">
        <Label>Select Start Date And End Date</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                {startDate ? startDate.toLocaleDateString() : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-2">
              <Calendar
                mode="single"
                selected={startDate ?? undefined}
                onSelect={handleStartSelect}
                fromDate={new Date()}
                disabled={(date) => {
                  const weekendDisabled = !reachOnWeekend && isWeekend(date);
                  const holidayDisabled = !reachOnHolidays && isHoliday(date);
                  return weekendDisabled || holidayDisabled;
                }}
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                {endDate ? (endDate as Date).toLocaleDateString() : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-2">
              <Calendar
                mode="single"
                selected={(endDate as Date) ?? undefined}
                onSelect={handleEndSelect}
                fromDate={startDate ?? new Date()}
                disabled={(date) => {
                  const weekendDisabled = !reachOnWeekend && isWeekend(date);
                  const holidayDisabled = !reachOnHolidays && isHoliday(date);
                  return weekendDisabled || holidayDisabled;
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Timing preferences</h3>
        {/* Dial attempt limits per day */}
        <h4 className="text-xs font-medium text-muted-foreground">Dialing</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="minDailyAttempts">Min attempts per day</Label>
            <Input
              id="minDailyAttempts"
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              value={minDailyAttempts}
              onChange={(e) => {
                const v = Math.max(1, Number(e.target.value || 0));
                // Only set min; show inline error if max < min instead of auto-adjusting
                setMinDailyAttempts(v);
              }}
            />
            {minAttemptsError && (
              <p className="text-xs text-destructive">Minimum attempts must be at least 1.</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="maxDailyAttempts">Max attempts per day</Label>
            <Input
              id="maxDailyAttempts"
              type="number"
              inputMode="numeric"
              min={0}
              max={50}
              value={maxDailyAttempts}
              onChange={(e) => {
                const v = Math.max(0, Number(e.target.value || 0));
                // Only set max; show inline error if max < min instead of auto-adjusting
                setMaxDailyAttempts(v);
              }}
            />
            {maxAttemptsError && (
              <p className="text-xs text-destructive">Max attempts must be greater than or equal to Min attempts.</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="countVm"
            checked={countVoicemailAsAnswered}
            onCheckedChange={(v) => setCountVoicemailAsAnswered(!!v)}
          />
          <Label htmlFor="countVm">Count voicemail as answered</Label>
        </div>
        <h4 className="text-xs font-medium text-muted-foreground">Reach windows</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <div className="flex items-center gap-2">
            <Checkbox
              id="tzFromLeadLocation"
              checked={getTimezoneFromLeadLocation}
              disabled
              onCheckedChange={(v) => setGetTimezoneFromLeadLocation(!!v)}
            />
            <Label htmlFor="tzFromLeadLocation">Get timezone from lead location</Label>
          </div>
          {getTimezoneFromLeadLocation && (
            <p className="text-xs text-muted-foreground pl-6 sm:col-span-2">
              Timezone will be auto-detected per lead using geo-tz based on their location.
            </p>
          )}
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
