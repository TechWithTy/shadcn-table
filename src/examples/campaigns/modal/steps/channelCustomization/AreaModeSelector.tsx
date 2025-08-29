import type { FC } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface AreaModeSelectorProps {
  value: "zip" | "leadList";
  onValueChange: (mode: "zip" | "leadList") => void;
}

const AreaModeSelector: FC<AreaModeSelectorProps> = ({ value, onValueChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="area-mode-checkbox"
        checked={value === "leadList"}
        onCheckedChange={(checked) => onValueChange(checked ? "leadList" : "zip")}
      />
      <Label htmlFor="area-mode-checkbox">
        {value === "leadList" ? "Lead List" : "US Zip Code"}
      </Label>
    </div>
  );
};

export default AreaModeSelector;
