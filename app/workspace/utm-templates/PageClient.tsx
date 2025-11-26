"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Edit,
  Trash2,
  Pin,
  Globe,
  MoreHorizontal,
  Hash,
  MousePointer,
  Target,
  Zap,
  CheckCircleIcon,
  Settings,
  Bookmark,
  FilePenLine,
  X,
  Calendar,
  Check,
} from "lucide-react";
import { authFetch } from "@/lib/api";
import { cn, toTitleCase, truncateText } from "@/lib/utils";
import { UtmTemplateModal } from "@/app/components/UtmTemplateModal";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import localFont from "next/font/local";
import {
  Pill,
  PillIcon,
  PillIndicator,
  PillStatus,
} from "@/components/kibo-ui/pill";
import { SafeUser } from "@/lib/getSafeSession";
import { EmptyState } from "@/components/ui/empty-state";
import {
  createFilter,
  Filters,
  type Filter,
  type FilterFieldConfig,
} from "@/components/ui/filters";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CalendarReUI } from "@/components/ui/calendarReUI";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  endOfMonth,
  endOfYear,
  format,
  isEqual,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { DateRange } from "react-day-picker";

const BookmarkIcon = ({
  pinned,
  onClick,
}: {
  pinned: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className="text-muted-foreground hover:text-foreground"
    >
      {pinned ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
      )}
    </button>
  );
};

interface Campaign {
  id: number;
  name: string;
}

interface RawUTMTemplate {
  id: number;
  name: string;
  description: string;
  utm_params: any;
  is_global: boolean;
  pinned: boolean;
  campaigns: Campaign[];
  created_at: string;
}

interface UTMTemplate {
  id: number;
  name: string;
  description: string;
  utm_params: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
  is_global: boolean;
  pinned: boolean;
  campaigns: Campaign[];
  created_at: string;
}

interface UTMTemplatesPageProps {
  user: SafeUser;
}

// UTMFilters component to handle filtering logic
function UTMFilters({
  templates,
  onFilteredTemplatesChange,
}: {
  templates: UTMTemplate[];
  onFilteredTemplatesChange: (filtered: UTMTemplate[]) => void;
}) {
  const [filters, setFilters] = useState<Filter[]>([]);

  // Get all available UTM parameters and their values
  const utmParamOptions = useMemo(() => {
    const paramMap: Record<string, Set<string>> = {};

    templates.forEach((template) => {
      const utmParams = template.utm_params;
      if (utmParams && typeof utmParams === "object") {
        Object.entries(utmParams).forEach(([key, value]) => {
          if (value && typeof value === "string") {
            if (!paramMap[key]) paramMap[key] = new Set();
            paramMap[key].add(value);
          }
        });
      }
    });

    return Object.keys(paramMap).map((param) => ({
      value: param,
      label: param
        .replace("utm_", "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      tags: Array.from(paramMap[param]).sort(),
    }));
  }, [templates]);

  // Get all assigned campaigns
  const campaignOptions = useMemo(() => {
    const campaignSet = new Set<string>();
    templates.forEach((template) => {
      template.campaigns?.forEach((campaign) => {
        campaignSet.add(campaign.name);
      });
    });
    return Array.from(campaignSet)
      .sort()
      .map((name) => ({
        value: name,
        label: name,
      }));
  }, [templates]);

  // Filter field configurations
  const fields = useMemo<FilterFieldConfig[]>(
    () => [
      {
        key: "is_global",
        label: "Global",
        icon: <Globe className="size-3.5" />,
        type: "select",
        options: [
          { value: "true", label: "Global" },
          { value: "false", label: "Campaign-specific" },
        ],
        operators: [{ value: "is", label: "is" }],
        className: "w-40 bg-secondary",
      },
      {
        key: "campaigns",
        label: "Campaign Name",
        icon: <Target className="size-3.5" />,
        type: "multiselect",
        options: campaignOptions,
        className: "w-48 bg-secondary",
      },
    ],
    [campaignOptions],
  );

  // Separate field for created_at to avoid hook issues
  const createdAtField: FilterFieldConfig = useMemo(
    () => ({
      key: "created_at",
      label: "Created At",
      icon: <Calendar className="size-3.5" />,
      type: "custom",
      operators: [
        { value: "between", label: "between" },
        { value: "not_between", label: "not between" },
        { value: "before", label: "before" },
        { value: "after", label: "after" },
      ],
      customRenderer: ({ values, onChange }) => (
        <CustomDateRangeWithPresetsInput values={values} onChange={onChange} />
      ),
      className: "w-48 bg-secondary",
      defaultOperator: "between",
    }),
    [],
  );

  // UTM Parameters custom field
  const utmParamsField: FilterFieldConfig = useMemo(
    () => ({
      key: "utm_params",
      label: "UTM Parameters",
      icon: <Hash className="size-3.5" />,
      type: "custom",
      customRenderer: ({ values, onChange }) => (
        <UTMParamsFilterRenderer
          values={values}
          onChange={onChange}
          paramOptions={utmParamOptions}
        />
      ),
      className: "w-64",
    }),
    [utmParamOptions],
  );

  const allFields = useMemo(
    () => [...fields, createdAtField, utmParamsField],
    [fields, createdAtField, utmParamsField],
  );

  // Apply filters to templates data
  const applyFiltersToTemplates = useCallback(
    (newFilters: Filter[]) => {
      let filtered = [...templates];

      // Filter out empty filters before applying
      const activeFilters = newFilters.filter((filter) => {
        const { values } = filter;

        // Check if filter has meaningful values
        if (!values || values.length === 0) return false;

        // For text/string values, check if they're not empty strings
        if (
          values.every(
            (value) => typeof value === "string" && value.trim() === "",
          )
        )
          return false;

        // For number values, check if they're not null/undefined
        if (values.every((value) => value === null || value === undefined))
          return false;

        // For arrays, check if they're not empty
        if (values.every((value) => Array.isArray(value) && value.length === 0))
          return false;

        return true;
      });

      activeFilters.forEach((filter) => {
        const { field, operator, values } = filter;

        filtered = filtered.filter((template) => {
          switch (field) {
            case "is_global":
              return values.includes(String(template.is_global));
            case "campaigns":
              if (operator === "is_any_of") {
                return values.some((value) =>
                  template.campaigns?.some((c) => c.name === value),
                );
              }
              return false;
            case "created_at":
              if (values.length >= 2) {
                const fromDate = new Date(String(values[0]));
                const toDate = new Date(String(values[1]));
                const templateDate = new Date(template.created_at);
                return templateDate >= fromDate && templateDate <= toDate;
              }
              return true;
            case "utm_params":
              // Custom UTM params filtering: [param, operator, tag]
              if (values.length >= 1) {
                const param = values[0];
                const utmParams = template.utm_params;
                if (!utmParams || typeof utmParams !== "object") return false;

                const paramValue = (utmParams as any)[param as string];

                if (values.length >= 2) {
                  const op = values[1];
                  const tag = values[2] || "";
                  switch (op) {
                    case "is":
                      // Has the parameter with the selected tag (or any value if tag is empty)
                      if (paramValue === undefined) return false;
                      return tag === "" || paramValue === tag;
                    case "is_not":
                      // Does not have the parameter with the selected tag
                      if (paramValue === undefined) return true;
                      return tag !== "" && paramValue !== tag;
                    case "is_empty":
                      // Has the parameter but it's empty
                      return paramValue !== undefined && paramValue === "";
                    case "is_not_empty":
                      // Has the parameter and it's not empty
                      return paramValue !== undefined && paramValue !== "";
                    default:
                      return true;
                  }
                }
                return paramValue !== undefined; // Has the parameter
              }
              return true;
            default:
              return true;
          }
        });
      });

      return filtered;
    },
    [templates],
  );

  // Update filtered templates when templates or filters change
  useEffect(() => {
    const filtered = applyFiltersToTemplates(filters);
    onFilteredTemplatesChange(filtered);
  }, [templates, filters, applyFiltersToTemplates, onFilteredTemplatesChange]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Filter[]) => {
    setFilters(newFilters);
  }, []);

  return (
    <>
      <Filters
        filters={filters}
        fields={allFields}
        onChange={handleFiltersChange}
        variant={"solid"}
        className=" mb-2"
        size={"sm"}
      />
      {filters.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-2"
          onClick={() => {
            setFilters([]);
          }}
        >
          <X className="w-4 h-4" /> Clear
        </Button>
      )}
    </>
  );
}

// Custom UTM Parameters Filter Renderer
function UTMParamsFilterRenderer({
  values,
  onChange,
  paramOptions,
}: {
  values: unknown[];
  onChange: (values: unknown[]) => void;
  paramOptions: { value: string; label: string; tags: string[] }[];
}) {
  const [paramOpen, setParamOpen] = useState(false);
  const [operatorOpen, setOperatorOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);

  const selectedParam = values[0] as string;
  const selectedOperator = values[1] as string;
  const selectedTag = values[2] as string;

  const currentParamOption = paramOptions.find(
    (p) => p.value === selectedParam,
  );
  const availableTags = currentParamOption?.tags || [];

  // Auto-correct operator when tag is deselected
  useEffect(() => {
    if (selectedTag === "" && selectedOperator !== "is") {
      onChange([selectedParam, "is", ""]);
    }
  }, [selectedTag, selectedOperator, selectedParam, onChange]);

  const handleParamChange = (param: string) => {
    onChange([param, "is", ""]);
    setParamOpen(false);
  };

  const handleOperatorChange = (operator: string) => {
    onChange([selectedParam, operator, selectedTag]);
    setOperatorOpen(false);
  };

  const handleTagChange = (tag: string) => {
    // When selecting a tag, keep current operator if valid, otherwise default to "is"
    const currentOperator = selectedOperator;
    const validOperators = ["is", "is_not", "is_empty", "is_not_empty"];
    const newOperator = validOperators.includes(currentOperator)
      ? currentOperator
      : "is";
    onChange([selectedParam, newOperator, tag]);
    setTagOpen(false);
  };

  return (
    <div className="flex flex-row text-sm">
      {/* Parameter Selector */}
      <Popover open={paramOpen} onOpenChange={setParamOpen}>
        <PopoverTrigger className="flex text-xs text-left h-8 w-auto items-center px-2 py-1 hover:bg-background placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 cursor-pointer">
          {selectedParam ? (
            paramOptions.find((p) => p.value === selectedParam)?.label ||
            selectedParam
          ) : (
            <span className="text-muted-foreground">Parameter</span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search parameters..."
              className="h-8 text-sm"
            />
            <CommandList>
              <CommandEmpty>No parameters found.</CommandEmpty>
              <CommandGroup>
                {paramOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleParamChange(option.value)}
                  >
                    <Check
                      className={`mr-2 h-3 w-3 ${
                        selectedParam === option.value
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedParam && (
        <>
          {/* Operator Selector */}
          <Popover open={operatorOpen} onOpenChange={setOperatorOpen}>
            <PopoverTrigger className="transition text-muted-foreground hover:text-foreground data-[state=open]:text-foreground shrink-0 flex items-center relative focus-visible:z-1 bg-secondary h-8 px-2.5 text-xs gap-1 cursor-pointer">
              {selectedOperator || "is"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Command>
                <CommandList>
                  <CommandGroup>
                    <CommandItem onSelect={() => handleOperatorChange("is")}>
                      <Check
                        className={`mr-2 h-3 w-3 ${
                          selectedOperator === "is"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      is
                    </CommandItem>
                    <CommandItem
                      onSelect={() =>
                        selectedTag !== "" && handleOperatorChange("is_not")
                      }
                      disabled={selectedTag === ""}
                    >
                      <Check
                        className={`mr-2 h-3 w-3 ${
                          selectedOperator === "is_not"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      is not
                    </CommandItem>
                    <CommandItem
                      onSelect={() =>
                        selectedTag !== "" && handleOperatorChange("is_empty")
                      }
                      disabled={selectedTag === ""}
                    >
                      <Check
                        className={`mr-2 h-3 w-3 ${
                          selectedOperator === "is_empty"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      is empty
                    </CommandItem>
                    <CommandItem
                      onSelect={() =>
                        selectedTag !== "" &&
                        handleOperatorChange("is_not_empty")
                      }
                      disabled={selectedTag === ""}
                    >
                      <Check
                        className={`mr-2 h-3 w-3 ${
                          selectedOperator === "is_not_empty"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      is not empty
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Tag Selector - only show for operators that use tags */}
          {(selectedOperator === "is" || selectedOperator === "is_not") && (
            <Popover open={tagOpen} onOpenChange={setTagOpen}>
              <PopoverTrigger className="flex text-xs text-left h-8 w-auto items-center px-2 py-1 hover:bg-background placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 cursor-pointer">
                {selectedTag ? (
                  selectedTag
                ) : (
                  <span className="text-muted-foreground">Select tag</span>
                )}
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search tags..."
                    className="h-8 text-sm"
                  />
                  <CommandList>
                    <CommandEmpty>No tags found.</CommandEmpty>
                    <CommandGroup>
                      {availableTags.map((tag) => (
                        <CommandItem
                          key={tag}
                          value={tag}
                          onSelect={() => handleTagChange(tag)}
                        >
                          <Check
                            className={`mr-2 h-3 w-3 ${
                              selectedTag === tag ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          {tag}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </>
      )}
    </div>
  );
}

// Custom Date Range with Presets Input Component
function CustomDateRangeWithPresetsInput({
  values,
  onChange,
}: {
  values: unknown[];
  onChange: (values: unknown[]) => void;
}) {
  const today = useMemo(() => new Date(), []);

  const presets = useMemo(
    () => [
      { label: "Today", range: { from: today, to: today } },
      {
        label: "Yesterday",
        range: { from: subDays(today, 1), to: subDays(today, 1) },
      },
      { label: "Last 7 days", range: { from: subDays(today, 6), to: today } },
      {
        label: "Last 30 days",
        range: { from: subDays(today, 29), to: today },
      },
      {
        label: "Month to date",
        range: { from: startOfMonth(today), to: today },
      },
      {
        label: "Last month",
        range: {
          from: startOfMonth(subMonths(today, 1)),
          to: endOfMonth(subMonths(today, 1)),
        },
      },
      {
        label: "Year to date",
        range: { from: startOfYear(today), to: today },
      },
      {
        label: "Last year",
        range: {
          from: startOfYear(subYears(today, 1)),
          to: endOfYear(subYears(today, 1)),
        },
      },
    ],
    [today],
  );

  const [month, setMonth] = useState(today);
  const [date, setDate] = useState<DateRange | undefined>(
    values?.[0] && typeof values[0] === "string"
      ? {
          from: new Date(values[0] as string),
          to:
            values[1] && typeof values[1] === "string"
              ? new Date(values[1] as string)
              : undefined,
        }
      : undefined,
  );
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const matchedPreset = presets.find(
      (preset) =>
        isEqual(
          startOfDay(preset.range.from),
          startOfDay(date?.from || new Date(0)),
        ) &&
        isEqual(
          startOfDay(preset.range.to),
          startOfDay(date?.to || new Date(0)),
        ),
    );
    setSelectedPreset(matchedPreset?.label || null);
  }, [date, presets]);

  const handleApply = () => {
    if (date?.from) {
      // Format dates as YYYY-MM-DD in local timezone to avoid timezone conversion issues
      const formatLocalDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const fromStr = formatLocalDate(date.from);
      const toStr = date.to ? formatLocalDate(date.to) : fromStr;
      onChange([fromStr, toStr]);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleSelect = (selected: DateRange | undefined) => {
    setDate({
      from: selected?.from || undefined,
      to: selected?.to || undefined,
    });
    setSelectedPreset(null);
  };

  const handlePresetSelect = (preset: (typeof presets)[0]) => {
    setDate(preset.range);
    setMonth(preset.range.from || today);
    setSelectedPreset(preset.label);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger className="cursor-pointer">
        {date?.from ? (
          date.to ? (
            <>
              {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
            </>
          ) : (
            format(date.from, "LLL dd, y")
          )
        ) : (
          <span>Pick a date range with presets</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center" sideOffset={8}>
        <div className="flex max-sm:flex-col">
          <div className="relative border-border max-sm:order-1 max-sm:border-t sm:w-32">
            <div className="h-full border-border sm:border-e py-2">
              <div className="flex flex-col px-2 gap-[2px]">
                {presets.map((preset, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-8 w-full justify-start",
                      selectedPreset === preset.label && "bg-accent",
                    )}
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <CalendarReUI
            autoFocus
            mode="range"
            month={month}
            onMonthChange={setMonth}
            showOutsideDays={false}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </div>
        <div className="flex items-center justify-end gap-1.5 border-t border-border p-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function UTMTemplatesPage({ user }: UTMTemplatesPageProps) {
  const [templates, setTemplates] = useState<UTMTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredTemplates, setFilteredTemplates] = useState<UTMTemplate[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UTMTemplate | null>(null);
  const [modalInitial, setModalInitial] = useState<any>(null);
  const [animatingCardId, setAnimatingCardId] = useState<number | null>(null);
  // Fetch campaigns for dropdown
  const loadCampaigns = async () => {
    const res = await authFetch("/api/campaigns/");
    if (res.ok) {
      const campaignsData = await res.json();
      setCampaigns(campaignsData);
      return campaignsData;
    }
    return [];
  };
  const loadTemplates = async () => {
    try {
      const response = await authFetch("/api/utm-templates/");
      if (response.ok) {
        const data: RawUTMTemplate[] = await response.json();
        // Sort templates: pinned first, then by name
        const sortedData = data.sort((a: RawUTMTemplate, b: RawUTMTemplate) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return a.name.localeCompare(b.name);
        });
        setTemplates(sortedData);
      }
    } catch (error) {
      console.error("Failed to load UTM templates:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const loadData = async () => {
      await loadCampaigns();
      await loadTemplates();
    };
    loadData();

    // Listen for campaign changes from other pages
    const handleCampaignChange = async () => {
      await loadCampaigns();
      await loadTemplates();
    };

    window.addEventListener("campaignChanged", handleCampaignChange);
    return () =>
      window.removeEventListener("campaignChanged", handleCampaignChange);
  }, []);

  // Initialize filtered templates
  useEffect(() => {
    setFilteredTemplates(templates);
  }, [templates]);
  // Launch create
  const openCreate = () => {
    setModalInitial(undefined);
    setEditing(null);
    setModalOpen(true);
  };
  // Launch edit
  // Launch edit
  const handleEdit = (template: UTMTemplate) => {
    setModalInitial({
      name: template.name,
      description: template.description,
      utm_params: template.utm_params,
      is_global: template.is_global,
      pinned: template.pinned,
      campaign_ids: template.campaigns?.map((c) => c.id) || [],
    });
    setEditing(template);
    setModalOpen(true);
    //console.log("template", template);
  };
  // Save logic (create or edit)
  const handleSave = async (values: any) => {
    let url = "/api/utm-templates/";
    let method: "POST" | "PATCH" = "POST";
    if (editing) {
      url = `/api/utm-templates/${editing.id}`;
      method = "PATCH";
    }
    const res = await authFetch(url, { method, body: JSON.stringify(values) });
    if (!res.ok) throw new Error(await res.text());
    setEditing(null);
    // Reload data in background
    (async () => {
      try {
        await loadCampaigns();
        await loadTemplates();
      } catch (error) {
        console.error("Failed to reload data after save:", error);
      }
    })();
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this UTM template?")) return;
    const response = await authFetch(`/api/utm-templates/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      await loadCampaigns();
      await loadTemplates();
    }
  };

  const handlePin = async (id: number) => {
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    const newPinned = !template.pinned;
    const response = await authFetch(`/api/utm-templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        pinned: newPinned,
        campaign_ids: template.campaigns.map((c) => c.id),
      }),
    });
    if (response.ok) {
      await loadCampaigns();
      await loadTemplates();
      setAnimatingCardId(id);
      setTimeout(() => setAnimatingCardId(null), 500);
    }
  };

  // Authentication is now handled by the server component

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Spinner className="size-6 mx-auto" />
          <p className="text-xs mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  console.log("template", templates);

  return (
    <TooltipProvider>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          UTM Templates
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
          Create and manage UTM parameter templates to maintain consistent
          tracking across your campaigns.
        </p>
      </div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          {/* Filters Section */}
          <div className="flex items-start gap-2.5">
            <div className="flex-1">
              <UTMFilters
                templates={templates}
                onFilteredTemplatesChange={setFilteredTemplates}
              />
            </div>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
        <UtmTemplateModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          initialValues={modalInitial}
          onSave={handleSave}
          campaigns={campaigns}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={Settings}
                title="No UTM Templates Yet"
                description="Create reusable UTM parameter sets to maintain consistent tracking across your campaigns. Templates can be global or campaign-specific."
                actionLabel="Create Your First Template"
                onAction={openCreate}
              />
            </div>
          ) : (
            filteredTemplates.map((template) => {
              let utmParams = template.utm_params;
              if (utmParams && typeof utmParams === "string") {
                try {
                  utmParams = JSON.parse(utmParams);
                } catch {
                  utmParams = {};
                }
              }
              utmParams = utmParams || {};

              return (
                <motion.div
                  key={template.id}
                  transition={
                    animatingCardId === template.id
                      ? { type: "spring", damping: 60, stiffness: 700 }
                      : undefined
                  }
                  className={cn(
                    "relative hover:shadow-lg hover:scale-105 transition-all duration-200 rounded-lg flex flex-col min-h-[200px] border border-border z-[10]",
                    animatingCardId === template.id && "ring-1 ring-primary",
                  )}
                >
                  <div className="absolute inset-0 pointer-events-none rounded-lg [background-size:20px_20px] [background-image:linear-gradient(to_right,#e5e6e4_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"></div>
                  <div className="absolute inset-0 pointer-events-none rounded-lg bg-card [mask-image:radial-gradient(ellipse_at_center,transparent_0%,transparent_5%,black_70%)]"></div>
                  <div className="relative overflow-visible z-[1]">
                    <CardHeader className="bg-muted/40 dark:bg-black/15 p-6 mb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <BookmarkIcon
                            pinned={template.pinned}
                            onClick={() => handlePin(template.id)}
                          />
                          <Pill>
                            <PillIndicator pulse variant="success" />
                            Active
                          </Pill>

                          {template.is_global && (
                            <Pill className="bg-primary/90 text-muted">
                              Global
                            </Pill>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant={"ghost"}
                              size="icon"
                              className="h-8 w-8 p-0 rounded-full"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEdit(template)}
                            >
                              <FilePenLine className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(template.id)}
                              className="text-red-500"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardTitle className="text-lg pt-2">
                        {template.name}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col space-y-4 min-h-0 overflow-hidden">
                      {template.description && (
                        <CardDescription>
                          {truncateText(template.description, 80)}
                        </CardDescription>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground/80 font-medium">
                          Created{" "}
                          <span className="font-mono text-secondary-foreground/70">
                            {new Date(template.created_at).toLocaleDateString()}
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          {/* Campaigns Count with Hover Card */}

                          <span className="text-xs text-muted-foreground/80 font-medium">
                            Assigned Campaigns
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-pointer">
                                <Badge
                                  className={
                                    "h-5 min-w-6 font-light font-mono rounded-full px-1 tabular-nums hover:bg-accent"
                                  }
                                  variant="secondary"
                                >
                                  {template.campaigns?.length || 0}
                                </Badge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="overflow-hidden z-[9999]">
                              <div className="space-y-2">
                                <h4 className="text-xs text-muted-foreground font-medium">
                                  Assigned Campaigns
                                </h4>
                                {template.campaigns &&
                                template.campaigns.length > 0 ? (
                                  <div className="space-y-1">
                                    {template.campaigns.map((campaign) => (
                                      <div
                                        key={campaign.id}
                                        className="text-xs"
                                      >
                                        {campaign.name}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground/80">
                                    No campaigns assigned
                                  </p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* UTM Parameters with Horizontal Scroll */}
                      <div className="flex-1">
                        <h4 className="text-xs text-muted-foreground/80 font-medium mb-2">
                          UTM Parameters
                        </h4>
                        <ScrollArea className="flex-1 w-full whitespace-nowrap min-h-0 relative">
                          <div className="flex w-max space-x-2 p-0">
                            {Object.entries(utmParams)
                              .filter(([_, v]) => v && typeof v === "string")
                              .map(([key, value]) => {
                                const Icon = Hash;
                                return (
                                  <Pill
                                    className="px-1 rounded"
                                    key={key}
                                    id={key}
                                  >
                                    <PillStatus className="text-muted-foreground/80 border-muted-foreground/40 m-0 pr-1 -mr-1">
                                      {toTitleCase(key.replace("utm_", ""))}
                                    </PillStatus>
                                    <span className="text-secondary-foreground/80 p-0 m-0">
                                      {toTitleCase(value)}
                                    </span>
                                  </Pill>
                                );
                              })}
                          </div>
                          {/* Right fade gradient */}
                          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none z-10" />
                          <ScrollBar
                            orientation="horizontal"
                            className="invisible"
                          />
                        </ScrollArea>
                      </div>
                    </CardContent>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
