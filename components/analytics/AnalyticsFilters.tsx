"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, TimerReset } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calendar, BarChart3 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  //CommandCheck,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

interface PeriodPreset {
  value: string;
  label: string;
  description: string;
  days: number;
  recommendedIntervals: string[];
  defaultInterval: string;
}

interface AnalyticsFiltersProps {
  selectedPeriod: string;
  selectedInterval: string;
  onPeriodChange: (period: string) => void;
  onIntervalChange: (interval: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
  className?: string;
}

// GA4-Style Period Presets
const PERIOD_PRESETS: PeriodPreset[] = [
  {
    value: "1d",
    label: "Last 24 hours",
    description: "Real-time performance tracking",
    days: 1,
    recommendedIntervals: ["hourly"],
    defaultInterval: "hourly",
  },
  {
    value: "7d",
    label: "Last 7 days",
    description: "Weekly performance review",
    days: 7,
    recommendedIntervals: ["daily"],
    defaultInterval: "daily",
  },
  {
    value: "14d",
    label: "Last 14 days",
    description: "Two-week trend analysis",
    days: 14,
    recommendedIntervals: ["daily"],
    defaultInterval: "daily",
  },
  {
    value: "30d",
    label: "Last 30 days",
    description: "Monthly performance overview",
    days: 30,
    recommendedIntervals: ["daily", "weekly"],
    defaultInterval: "daily",
  },
  {
    value: "90d",
    label: "Last 3 months",
    description: "Quarterly growth analysis",
    days: 90,
    recommendedIntervals: ["weekly", "monthly"],
    defaultInterval: "weekly",
  },
  {
    value: "180d",
    label: "Last 6 months",
    description: "Half-year trend review",
    days: 180,
    recommendedIntervals: ["monthly"],
    defaultInterval: "monthly",
  },
  {
    value: "365d",
    label: "Last 12 months",
    description: "Annual performance summary",
    days: 365,
    recommendedIntervals: ["monthly", "yearly"],
    defaultInterval: "monthly",
  },
];

const INTERVAL_LABELS = {
  hourly: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export default function AnalyticsFilters({
  selectedPeriod,
  selectedInterval,
  onPeriodChange,
  onIntervalChange,
  onRefresh,
  loading = false,
  className = "",
}: AnalyticsFiltersProps) {
  const [periodOpen, setPeriodOpen] = useState(false);
  const [intervalOpen, setIntervalOpen] = useState(false);

  // Auto-map interval when period changes
  useEffect(() => {
    const preset = PERIOD_PRESETS.find((p) => p.value === selectedPeriod);
    if (preset && !preset.recommendedIntervals.includes(selectedInterval)) {
      // Auto-change interval to the recommended one for the new period
      onIntervalChange(preset.defaultInterval);
    }
  }, [selectedPeriod, selectedInterval, onIntervalChange]);

  const getCurrentPreset = () => {
    return PERIOD_PRESETS.find((p) => p.value === selectedPeriod);
  };

  const getRecommendedIntervals = () => {
    const preset = getCurrentPreset();
    return preset?.recommendedIntervals || [];
  };

  const getCurrentPeriodLabel = () => {
    const preset = getCurrentPreset();
    return preset?.label || "Select period...";
  };

  const getCurrentIntervalLabel = () => {
    const interval = getRecommendedIntervals().find(
      (i) => i === selectedInterval,
    );
    return (
      INTERVAL_LABELS[selectedInterval as keyof typeof INTERVAL_LABELS] ||
      "Select interval..."
    );
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Period Selector */}
      <div className="flex flex-row items-center gap-1">
        <div className={""}>
          <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={periodOpen}
                className="min-w-[220px] justify-between w-full text-xs h-8"
              >
                <div className="flex">
                  <label
                    className="text-muted-foreground/80 font-normal text-xs"
                    title="Period"
                  >
                    Period
                  </label>
                </div>
                {getCurrentPeriodLabel()}
                <ChevronsUpDown className="opacity-50 h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="flex w-[180px] p-0">
              <Command>
                {/* <CommandInput placeholder="Search periods..." className="h-9" />*/}
                <CommandList>
                  <CommandEmpty>No periods found.</CommandEmpty>
                  <CommandGroup>
                    {PERIOD_PRESETS.map((preset) => (
                      <CommandItem
                        key={preset.value}
                        value={preset.label}
                        onSelect={(currentValue) => {
                          const selectedPreset = PERIOD_PRESETS.find(
                            (p) => p.label === currentValue,
                          );
                          if (selectedPreset) {
                            onPeriodChange(selectedPreset.value);
                          }
                          setPeriodOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedPeriod === preset.value
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{preset.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {preset.description}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {/* Period Info */}
          <div className="flex flex-row">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {getCurrentPreset()?.description || "Select a period"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interval Selector */}
      <div className="flex flex-row gap-1 items-center">
        <Popover open={intervalOpen} onOpenChange={setIntervalOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={intervalOpen}
              className="min-w-[170px] justify-between w-full text-xs h-8"
            >
              {/* <TimerReset className="m-0"/> */}
              <Label
                className="text-muted-foreground/80 font-normal text-xs"
                title="Interval"
              >
                Interval
              </Label>

              {getCurrentIntervalLabel()}
              <ChevronsUpDown className="opacity-50 h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[140px] p-0">
            <Command>
              {/*<CommandInput placeholder="Search intervals..." className="h-9" />*/}
              <CommandList>
                <CommandEmpty>No intervals found.</CommandEmpty>
                <CommandGroup>
                  {getRecommendedIntervals().map((interval) => (
                    <CommandItem
                      key={interval}
                      value={
                        INTERVAL_LABELS[
                          interval as keyof typeof INTERVAL_LABELS
                        ]
                      }
                      onSelect={(currentValue) => {
                        const selectedIntervalKey = Object.keys(
                          INTERVAL_LABELS,
                        ).find(
                          (key) =>
                            INTERVAL_LABELS[
                              key as keyof typeof INTERVAL_LABELS
                            ] === currentValue,
                        );
                        if (selectedIntervalKey) {
                          onIntervalChange(selectedIntervalKey);
                        }
                        setIntervalOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedInterval === interval
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {
                        INTERVAL_LABELS[
                          interval as keyof typeof INTERVAL_LABELS
                        ]
                      }
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {/* Refresh Button */}
        {onRefresh && (
          <div className="flex flex-col gap-1">
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
              className="h-9"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
