import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";

import type { LeadList } from "@/constants/_faker/_api/mockLeadListApi";
import { fetchFakeLeadLists } from "@/constants/_faker/_api/mockLeadListApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormItem, FormLabel, FormControl, FormMessage } from "../../../../../components/ui/form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeadListSelectorProps {
  value: string;
  onChange: (value: string, recordCount: number) => void;
  disabled?: boolean;
}

const LeadListSelector: FC<LeadListSelectorProps> = ({ value, onChange, disabled = false }) => {
  const [items, setItems] = useState<LeadList[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMoreLeadLists = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;
    const { items: newItems, hasMore: newHasMore } = await fetchFakeLeadLists(nextPage);
    setItems((prev) => [...prev, ...newItems]);
    setPage(nextPage);
    setHasMore(newHasMore);
    setLoading(false);
  }, [loading, hasMore, page]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { items: newItems, hasMore: newHasMore } = await fetchFakeLeadLists(0);
      setItems(newItems);
      setPage(0);
      setHasMore(newHasMore);
      setLoading(false);
    };
    void init();
  }, []);

  const handleValueChange = (selectedValue: string) => {
    const selectedItem = items.find((item) => item.id === selectedValue);
    if (selectedItem) {
      onChange(selectedValue, selectedItem.records);
    }
  };

  return (
    <FormItem>
      <FormLabel>Select Lead List</FormLabel>
      <Select disabled={disabled} onValueChange={handleValueChange} value={value} defaultValue={value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="-- Select a lead list --" />
          </SelectTrigger>
        </FormControl>
        <SelectContent
          position="popper"
          side="bottom"
          sideOffset={4}
          avoidCollisions={false}
          className="max-h-72 overflow-y-auto overscroll-contain"
          onWheel={(e) => {
            // Ensure scrolling is captured by the dropdown, not the dialog/page
            e.stopPropagation();
          }}
        >
          {items.map((list) => (
            <SelectItem key={list.id} value={list.id}>
              {list.listName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="mt-2 flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled={loading || !hasMore} onClick={() => void loadMoreLeadLists()}>
          {loading ? (
            <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading...</span>
          ) : hasMore ? (
            "Load more"
          ) : (
            "No more"
          )}
        </Button>
      </div>
      <FormMessage />
    </FormItem>
  );
};

export default LeadListSelector;
