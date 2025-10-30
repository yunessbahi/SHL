"use client";
import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type Option = { label: string; value: string };

export default function MultiSelect({
  label,
  options,
  values,
  onChange,
  placeholder = "Select options",
  emptyText = "No options available",
  maxCount,
}: {
  label?: string;
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  maxCount?: number;
}) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    const exists = values.includes(value);
    const next = exists
      ? values.filter((v) => v !== value)
      : [...values, value];
    onChange(next);
  };

  const selectedLabels = React.useMemo(() => {
    return options
      .filter((opt) => values.includes(opt.value))
      .map((opt) => opt.label);
  }, [options, values]);

  const displayedText = React.useMemo(() => {
    if (selectedLabels.length === 0) {
      return placeholder;
    }
    if (maxCount && selectedLabels.length > maxCount) {
      return `${selectedLabels.slice(0, maxCount).join(", ")} +${
        selectedLabels.length - maxCount
      } more`;
    }
    return selectedLabels.join(", ");
  }, [selectedLabels, placeholder, maxCount]);

  return (
    <div className="space-y-1">
      {label && <label className="block text-sm mb-1">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-sm"
          >
            {displayedText}
            <ChevronsUpDown className="opacity-50 h-4 w-4 ml-2 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-full">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    onSelect={() => handleSelect(opt.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        values.includes(opt.value)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
