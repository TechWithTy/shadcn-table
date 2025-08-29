"use client";
import * as React from "react";
import { Button } from "../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Sparkles } from "lucide-react";

export function AIMenu(props: {
  selectedCount: number;
  allCount: number;
  onUseSelected: () => void;
  onUseAll: () => void;
  size?: "sm" | "default";
}) {
  const { selectedCount, allCount, onUseAll, onUseSelected, size = "sm" } = props;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size={size} className="bg-purple-600 text-white hover:bg-purple-700">
          <Sparkles className="mr-1 h-4 w-4" /> AI
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Run AI on</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={selectedCount === 0} onSelect={onUseSelected}>
          Use Selected ({selectedCount})
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onUseAll}>Use All ({allCount})</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
