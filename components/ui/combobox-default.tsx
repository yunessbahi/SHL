"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

export interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

interface ComboboxProps {
  options: Option[];
  value?: string | number | null;
  onValueChange: (value: string | number | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  allowClear?: boolean;
  showGlobalBadge?: boolean;
  selectedOptionData?: any;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  className,
  disabled = false,
  allowClear = true,
  showGlobalBadge = false,
  selectedOptionData,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((option) => {
    const optionValue = String(option.value);
    const targetValue = String(value);
    return optionValue === targetValue;
  });

  const handleSelect = (searchValue: string) => {
    // Find the option by label (what user searched for)
    const option = options.find((opt) => opt.label === searchValue);
    if (option) {
      const newValue = option.value === value ? "" : option.value;
      onValueChange(newValue === "" ? null : newValue);
    }
    setOpen(false);
  };

  // Group options by their group property
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, Option[]> = {};

    options.forEach((option) => {
      const groupName = option.group || "Options";
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(option);
    });

    const result = Object.entries(groups).map(([label, groupOptions]) => ({
      label,
      options: groupOptions,
    }));

    return result;
  }, [options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-input hover:bg-accent shadow-xs border border-border transition-colors font-normal",
            className,
          )}
          disabled={disabled}
        >
          {selectedOption ? (
            <div className="flex items-center gap-2">
              <span className="text-primary">{selectedOption.label}</span>
              {showGlobalBadge && selectedOptionData?.is_global && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-foreground text-background border">
                  Global
                </span>
              )}
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ maxHeight: "400px" }}>
        <Command className="max-h-none">
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList
            className="max-h-none"
            style={{ maxHeight: "350px", overflowY: "auto" }}
          >
            <CommandEmpty>{emptyText}</CommandEmpty>
            {groupedOptions.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.options.map((option) => (
                  <CommandItem
                    key={`${option.group}-${option.value}`} // Unique key including group
                    value={option.label} // Search by label, not by value/ID
                    onSelect={() => handleSelect(option.label)}
                    disabled={option.disabled}
                  >
                    {option.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Helper function to format options for campaigns with lifecycle grouping
export function formatCampaignOptions(
  campaigns: any[],
  includeNoSelection = true,
  filterByStatus = true,
) {
  const options: Option[] = [];

  if (includeNoSelection) {
    options.push({
      value: "",
      label: "No campaign",
    });
  }

  // Group campaigns by lifecycle
  const lifecycleGroups: Record<string, string> = {
    1: "Always-On",
    2: "One-Off",
    3: "Infinite",
  };

  const groupedCampaigns: Record<string, any[]> = {};

  // Filter out paused/inactive campaigns if requested
  const filteredCampaigns = filterByStatus
    ? campaigns.filter((campaign) => campaign.status === "active")
    : campaigns;

  filteredCampaigns.forEach((campaign) => {
    const lifecycleName = lifecycleGroups[campaign.lifecycle_attr] || "Other";
    if (!groupedCampaigns[lifecycleName]) {
      groupedCampaigns[lifecycleName] = [];
    }
    groupedCampaigns[lifecycleName].push(campaign);
  });

  Object.entries(groupedCampaigns).forEach(([groupName, groupCampaigns]) => {
    groupCampaigns.forEach((campaign) => {
      options.push({
        value: campaign.id,
        label: campaign.name,
        group: groupName,
      });
    });
  });

  return options;
}

// Helper function to format options for groups
export function formatGroupOptions(groups: any[], includeNoSelection = true) {
  const options: Option[] = [];

  if (includeNoSelection) {
    options.push({
      value: "",
      label: "No group",
    });
  }

  groups.forEach((group) => {
    options.push({
      value: group.id,
      label: group.name,
    });
  });

  return options;
}

// Helper function to format options for UTM templates with proper grouping
export function formatUtmTemplateOptions(
  allTemplates: any[] = [],
  assignedTemplateIds: number[] = [],
  includeNoSelection = true,
) {
  const options: Option[] = [];

  if (includeNoSelection) {
    options.push({
      value: "",
      label: "No template",
    });
  }

  // Assigned: Templates assigned to this campaign (both global and campaign-specific)
  const assignedTemplates = allTemplates.filter((template) =>
    assignedTemplateIds.includes(template.id),
  );
  assignedTemplates.forEach((template) => {
    options.push({
      value: String(template.id), // Convert to string for consistent comparison
      label: template.name,
      group: "Assigned",
    });
  });

  // Global: ALL global templates (independent from campaign selection)
  // Global templates are available to all campaigns regardless of assignment
  const globalTemplates = allTemplates.filter(
    (template) => template.is_global === true,
  );
  globalTemplates.forEach((template) => {
    // Always add global templates to Global group, even if they're assigned
    // Global templates should be available regardless of campaign assignments
    options.push({
      value: String(template.id), // Convert to string for consistent comparison
      label: template.name,
      group: "Global",
    });
  });

  return options;
}
