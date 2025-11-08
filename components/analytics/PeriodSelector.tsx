"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, BarChart3, TrendingUp } from "lucide-react";

interface PeriodPreset {
  value: string;
  label: string;
  description: string;
  days: number;
  recommendedIntervals: string[];
  defaultInterval: string;
}

interface PeriodSelectorProps {
  selectedPeriod: string;
  selectedInterval: string;
  onPeriodChange: (period: string) => void;
  onIntervalChange: (interval: string) => void;
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

export default function PeriodSelector({
  selectedPeriod,
  selectedInterval,
  onPeriodChange,
  onIntervalChange,
  className = "",
}: PeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  // Auto-map interval when period changes
  useEffect(() => {
    const preset = PERIOD_PRESETS.find((p) => p.value === selectedPeriod);
    if (preset && !preset.recommendedIntervals.includes(selectedInterval)) {
      // Auto-change interval to the recommended one for the new period
      onIntervalChange(preset.defaultInterval);
    }
  }, [selectedPeriod, selectedInterval, onIntervalChange]);

  // Smart interval inference based on custom date range
  const getSmartIntervalForCustomRange = (startDate: Date, endDate: Date) => {
    const diffDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays <= 2) return "hourly";
    if (diffDays <= 90) return "daily";
    if (diffDays <= 365) return "weekly";
    if (diffDays <= 1095) return "monthly"; // ~3 years
    return "yearly";
  };

  const handleCustomDateSelection = (start: Date, end: Date) => {
    setCustomStartDate(start);
    setCustomEndDate(end);

    // Calculate days and auto-select period + interval
    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Find closest preset
    const closestPreset = PERIOD_PRESETS.reduce((prev, curr) =>
      Math.abs(curr.days - diffDays) < Math.abs(prev.days - diffDays)
        ? curr
        : prev,
    );

    const smartInterval = getSmartIntervalForCustomRange(start, end);
    onPeriodChange(closestPreset.value);
    onIntervalChange(smartInterval);
    setShowCustomDatePicker(false);
  };

  const getCurrentPreset = () => {
    return PERIOD_PRESETS.find((p) => p.value === selectedPeriod);
  };

  const getRecommendedIntervals = () => {
    const preset = getCurrentPreset();
    return preset?.recommendedIntervals || [];
  };

  const formatPeriodDescription = () => {
    const preset = getCurrentPreset();
    return preset?.description || "Custom period";
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Period Presets */}
      <div className="flex flex-wrap gap-1">
        {PERIOD_PRESETS.map((preset) => (
          <Button
            key={preset.value}
            variant={selectedPeriod === preset.value ? "secondary" : "outline"}
            size="sm"
            onClick={() => onPeriodChange(preset.value)}
            className="text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Custom Date Picker */}
      <Popover
        open={showCustomDatePicker}
        onOpenChange={setShowCustomDatePicker}
      >
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs">
            <CalendarIcon className="h-3 w-3 mr-1" />
            Custom
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            defaultMonth={customStartDate}
            selected={{
              from: customStartDate,
              to: customEndDate,
            }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                handleCustomDateSelection(range.from, range.to);
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* Interval Selector */}
      <div className="flex items-center gap-1 ml-4">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1">
          {getRecommendedIntervals().map((interval) => (
            <Button
              key={interval}
              variant={
                selectedInterval === interval ? "secondary" : "secondary"
              }
              size="sm"
              onClick={() => onIntervalChange(interval)}
              className="text-xs h-7 px-2"
            >
              {INTERVAL_LABELS[interval as keyof typeof INTERVAL_LABELS]}
            </Button>
          ))}
        </div>
      </div>

      {/* Period Info */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-4">
        <TrendingUp className="h-3 w-3" />
        <span>{formatPeriodDescription()}</span>
      </div>
    </div>
  );
}

// Hook for smart period and interval management
export function useSmartAnalyticsFilters() {
  const [period, setPeriod] = useState("7d");
  const [interval, setInterval] = useState("daily");

  const updatePeriod = (newPeriod: string) => {
    setPeriod(newPeriod);

    // Auto-map interval based on GA4 best practices
    const preset = PERIOD_PRESETS.find((p) => p.value === newPeriod);
    if (preset) {
      setInterval(preset.defaultInterval);
    }
  };

  const updateInterval = (newInterval: string) => {
    setInterval(newInterval);
  };

  // Smart interval inference based on period
  const getOptimalInterval = (targetPeriod: string) => {
    const preset = PERIOD_PRESETS.find((p) => p.value === targetPeriod);
    return preset?.defaultInterval || "daily";
  };

  return {
    period,
    interval,
    updatePeriod,
    updateInterval,
    getOptimalInterval,
    presets: PERIOD_PRESETS,
  };
}
