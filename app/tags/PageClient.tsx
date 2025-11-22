"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Tag as TagIcon,
  Calendar,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import TagModal from "@/app/components/TagModal";
import { SafeUser } from "@/lib/getSafeSession";
import { EmptyState } from "@/components/ui/empty-state";
import {
  createFilter,
  Filters,
  type Filter,
  type FilterFieldConfig,
} from "@/components/ui/filters";
import { CalendarReUI } from "@/components/ui/calendarReUI";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";

interface Tag {
  id: number;
  tag_name: string;
  color: string;
  description?: string;
  created_at?: string;
  bgClass?: string;
  textClass?: string;
}

interface TagsPageProps {
  user: SafeUser;
}

export default function TagsPage({ user }: TagsPageProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filter[]>([]);
  const { theme } = useTheme();

  // Modal State
  const [tagModalState, setTagModalState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    tag?: Tag;
  }>({ open: false, mode: "create" });

  // Color combinations mapping
  const getColorClasses = (colorValue: string) => {
    // Check if it's a theme-based color (JSON string)
    try {
      const themeColors = JSON.parse(colorValue);
      if (themeColors.light && themeColors.dark) {
        // Check if we're in dark mode
        const isDark = theme === "dark";
        const currentColor = isDark ? themeColors.dark : themeColors.light;

        const combinations = [
          // Light theme: medium backgrounds with white text
          { value: "blue-600", bg: "bg-blue-600", text: "text-white" },
          { value: "green-600", bg: "bg-green-600", text: "text-white" },
          { value: "purple-600", bg: "bg-purple-600", text: "text-white" },
          { value: "pink-600", bg: "bg-pink-600", text: "text-white" },
          { value: "orange-600", bg: "bg-orange-600", text: "text-white" },
          { value: "red-600", bg: "bg-red-600", text: "text-white" },
          { value: "indigo-600", bg: "bg-indigo-600", text: "text-white" },
          { value: "teal-600", bg: "bg-teal-600", text: "text-white" },
          { value: "cyan-600", bg: "bg-cyan-600", text: "text-white" },
          { value: "gray-600", bg: "bg-gray-600", text: "text-white" },

          { value: "amber-600", bg: "bg-amber-600", text: "text-white" },

          { value: "yellow-600", bg: "bg-yellow-600", text: "text-white" },

          { value: "lime-600", bg: "bg-lime-600", text: "text-white" },

          { value: "emerald-600", bg: "bg-emerald-600", text: "text-white" },

          { value: "sky-600", bg: "bg-sky-600", text: "text-white" },

          { value: "violet-600", bg: "bg-violet-600", text: "text-white" },

          { value: "fuchsia-600", bg: "bg-fuchsia-600", text: "text-white" },

          { value: "rose-600", bg: "bg-rose-600", text: "text-white" },

          { value: "slate-600", bg: "bg-slate-600", text: "text-white" },

          { value: "zinc-600", bg: "bg-zinc-600", text: "text-white" },

          { value: "neutral-600", bg: "bg-neutral-600", text: "text-white" },

          { value: "stone-600", bg: "bg-stone-600", text: "text-white" },

          // Dark theme: lighter backgrounds with dark text
          { value: "blue-400", bg: "bg-blue-400", text: "text-blue-900" },
          { value: "green-400", bg: "bg-green-400", text: "text-green-900" },
          { value: "purple-400", bg: "bg-purple-400", text: "text-purple-900" },
          { value: "pink-400", bg: "bg-pink-400", text: "text-pink-900" },
          { value: "orange-400", bg: "bg-orange-400", text: "text-orange-900" },
          { value: "red-400", bg: "bg-red-400", text: "text-red-900" },
          { value: "indigo-400", bg: "bg-indigo-400", text: "text-indigo-900" },
          { value: "teal-400", bg: "bg-teal-400", text: "text-teal-900" },
          { value: "cyan-400", bg: "bg-cyan-400", text: "text-cyan-900" },
          { value: "gray-400", bg: "bg-gray-400", text: "text-gray-900" },

          { value: "amber-400", bg: "bg-amber-400", text: "text-amber-900" },

          { value: "yellow-400", bg: "bg-yellow-400", text: "text-yellow-900" },

          { value: "lime-400", bg: "bg-lime-400", text: "text-lime-900" },

          {
            value: "emerald-400",
            bg: "bg-emerald-400",
            text: "text-emerald-900",
          },

          { value: "sky-400", bg: "bg-sky-400", text: "text-sky-900" },

          { value: "violet-400", bg: "bg-violet-400", text: "text-violet-900" },

          {
            value: "fuchsia-400",
            bg: "bg-fuchsia-400",
            text: "text-fuchsia-900",
          },

          { value: "rose-400", bg: "bg-rose-400", text: "text-rose-900" },

          { value: "slate-400", bg: "bg-slate-400", text: "text-slate-900" },

          { value: "zinc-400", bg: "bg-zinc-400", text: "text-zinc-900" },

          {
            value: "neutral-400",
            bg: "bg-neutral-400",
            text: "text-neutral-900",
          },

          { value: "stone-400", bg: "bg-stone-400", text: "text-stone-900" },
        ];
        return (
          combinations.find((c) => c.value === currentColor) || {
            bg: "bg-blue-600",
            text: "text-white",
          }
        );
      }
    } catch {
      // Not JSON, treat as legacy single color
    }

    // Legacy single color support
    const combinations = [
      // Light theme: medium backgrounds with white text
      { value: "blue-600", bg: "bg-blue-600", text: "text-white" },
      { value: "green-600", bg: "bg-green-600", text: "text-white" },
      { value: "purple-600", bg: "bg-purple-600", text: "text-white" },
      { value: "pink-600", bg: "bg-pink-600", text: "text-white" },
      { value: "orange-600", bg: "bg-orange-600", text: "text-white" },
      { value: "red-600", bg: "bg-red-600", text: "text-white" },
      { value: "indigo-600", bg: "bg-indigo-600", text: "text-white" },
      { value: "teal-600", bg: "bg-teal-600", text: "text-white" },
      { value: "cyan-600", bg: "bg-cyan-600", text: "text-white" },
      { value: "gray-600", bg: "bg-gray-600", text: "text-white" },

      { value: "amber-600", bg: "bg-amber-600", text: "text-white" },

      { value: "yellow-600", bg: "bg-yellow-600", text: "text-white" },

      { value: "lime-600", bg: "bg-lime-600", text: "text-white" },

      { value: "emerald-600", bg: "bg-emerald-600", text: "text-white" },

      { value: "sky-600", bg: "bg-sky-600", text: "text-white" },

      { value: "violet-600", bg: "bg-violet-600", text: "text-white" },

      { value: "fuchsia-600", bg: "bg-fuchsia-600", text: "text-white" },

      { value: "rose-600", bg: "bg-rose-600", text: "text-white" },

      { value: "slate-600", bg: "bg-slate-600", text: "text-white" },

      { value: "zinc-600", bg: "bg-zinc-600", text: "text-white" },

      { value: "neutral-600", bg: "bg-neutral-600", text: "text-white" },

      { value: "stone-600", bg: "bg-stone-600", text: "text-white" },

      // Dark theme: lighter backgrounds with dark text
      { value: "blue-400", bg: "bg-blue-400", text: "text-blue-900" },
      { value: "green-400", bg: "bg-green-400", text: "text-green-900" },
      { value: "purple-400", bg: "bg-purple-400", text: "text-purple-900" },
      { value: "pink-400", bg: "bg-pink-400", text: "text-pink-900" },
      { value: "orange-400", bg: "bg-orange-400", text: "text-orange-900" },
      { value: "red-400", bg: "bg-red-400", text: "text-red-900" },
      { value: "indigo-400", bg: "bg-indigo-400", text: "text-indigo-900" },
      { value: "teal-400", bg: "bg-teal-400", text: "text-teal-900" },
      { value: "cyan-400", bg: "bg-cyan-400", text: "text-cyan-900" },
      { value: "gray-400", bg: "bg-gray-400", text: "text-gray-900" },

      { value: "amber-400", bg: "bg-amber-400", text: "text-amber-900" },

      { value: "yellow-400", bg: "bg-yellow-400", text: "text-yellow-900" },

      { value: "lime-400", bg: "bg-lime-400", text: "text-lime-900" },

      { value: "emerald-400", bg: "bg-emerald-400", text: "text-emerald-900" },

      { value: "sky-400", bg: "bg-sky-400", text: "text-sky-900" },

      { value: "violet-400", bg: "bg-violet-400", text: "text-violet-900" },

      { value: "fuchsia-400", bg: "bg-fuchsia-400", text: "text-fuchsia-900" },

      { value: "rose-400", bg: "bg-rose-400", text: "text-rose-900" },

      { value: "slate-400", bg: "bg-slate-400", text: "text-slate-900" },

      { value: "zinc-400", bg: "bg-zinc-400", text: "text-zinc-900" },

      { value: "neutral-400", bg: "bg-neutral-400", text: "text-neutral-900" },

      { value: "stone-400", bg: "bg-stone-400", text: "text-stone-900" },

      // Legacy colors for backward compatibility
      { value: "blue-100", bg: "bg-blue-100", text: "text-blue-900" },
      { value: "green-100", bg: "bg-green-100", text: "text-green-900" },
      { value: "purple-100", bg: "bg-purple-100", text: "text-purple-900" },
      { value: "pink-100", bg: "bg-pink-100", text: "text-pink-900" },
      { value: "yellow-100", bg: "bg-yellow-100", text: "text-yellow-900" },
      { value: "orange-100", bg: "bg-orange-100", text: "text-orange-900" },
      { value: "red-100", bg: "bg-red-100", text: "text-red-900" },
      { value: "indigo-100", bg: "bg-indigo-100", text: "text-indigo-900" },
      { value: "teal-100", bg: "bg-teal-100", text: "text-teal-900" },
      { value: "cyan-100", bg: "bg-cyan-100", text: "text-cyan-900" },
      { value: "gray-100", bg: "bg-gray-100", text: "text-gray-900" },
      { value: "blue-900", bg: "bg-blue-900", text: "text-white" },
      { value: "green-900", bg: "bg-green-900", text: "text-white" },
      { value: "purple-900", bg: "bg-purple-900", text: "text-white" },
      { value: "pink-900", bg: "bg-pink-900", text: "text-white" },
      { value: "orange-900", bg: "bg-orange-900", text: "text-white" },
      { value: "red-900", bg: "bg-red-900", text: "text-white" },
      { value: "indigo-900", bg: "bg-indigo-900", text: "text-white" },
      { value: "teal-900", bg: "bg-teal-900", text: "text-white" },
      { value: "cyan-900", bg: "bg-cyan-900", text: "text-white" },
      { value: "gray-900", bg: "bg-gray-900", text: "text-white" },
    ];

    const combination = combinations.find((c) => c.value === colorValue);
    return combination || { bg: "bg-blue-600", text: "text-white" };
  };

  // Get user-friendly color display name
  const getColorDisplayName = (colorValue: string) => {
    // Handle theme-based colors (JSON string)
    let actualColor = colorValue;
    try {
      const themeColors = JSON.parse(colorValue);
      if (themeColors.light && themeColors.dark) {
        const isDark = theme === "dark";
        actualColor = isDark ? themeColors.dark : themeColors.light;
      }
    } catch {
      // Not JSON, treat as legacy single color
    }

    // Extract color name (e.g., "orange-400" -> "Orange")
    const colorName = actualColor.split("-")[0];
    return colorName.charAt(0).toUpperCase() + colorName.slice(1);
  };

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
                {format(date.from, "LLL dd, y")} -{" "}
                {format(date.to, "LLL dd, y")}
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

  // Filter field configurations
  const fields: FilterFieldConfig[] = [
    {
      key: "tag_name",
      label: "Title",
      icon: <TagIcon className="size-3.5" />,
      type: "text",
      className: "w-40 bg-secondary",
      placeholder: "Search tag names...",
      defaultOperator: "contains",
    },
    {
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
    },
    {
      key: "color",
      label: "Colors",
      icon: <TagIcon className="size-3.5" />,
      type: "select",
      searchable: true,
      className: "w-[140px] bg-secondary",
      options: useMemo(() => {
        const uniqueColors = Array.from(
          new Set(
            tags
              .map((tag) => {
                // Handle theme-based colors (JSON string)
                try {
                  const themeColors = JSON.parse(tag.color);
                  if (themeColors.light && themeColors.dark) {
                    const isDark = theme === "dark";
                    return isDark ? themeColors.dark : themeColors.light;
                  }
                } catch {
                  // Not JSON, treat as legacy single color
                }
                return tag.color;
              })
              .filter(Boolean),
          ),
        ) as string[];
        return uniqueColors.map((color) => ({
          value: color,
          label: getColorDisplayName(color),
        }));
      }, [tags, theme]),
    },
  ];

  // Apply filters to tags data
  const applyFiltersToTags = useCallback(
    (newFilters: Filter[]) => {
      let filtered = [...tags];

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

        filtered = filtered.filter((tag) => {
          let fieldValue = tag[field as keyof Tag];

          // Normalize color field value to handle theme-based colors
          if (field === "color") {
            try {
              const themeColors = JSON.parse(String(fieldValue));
              if (themeColors.light && themeColors.dark) {
                const isDark = theme === "dark";
                fieldValue = isDark ? themeColors.dark : themeColors.light;
              }
            } catch {
              // Not JSON, use as is
            }
          }

          switch (operator) {
            case "is":
              return values.includes(fieldValue);
            case "is_not":
              return !values.includes(fieldValue);
            case "contains":
              return values.some((value) =>
                String(fieldValue)
                  .toLowerCase()
                  .includes(String(value).toLowerCase()),
              );
            case "not_contains":
              return !values.some((value) =>
                String(fieldValue)
                  .toLowerCase()
                  .includes(String(value).toLowerCase()),
              );
            case "equals":
              return fieldValue === values[0];
            case "not_equals":
              return fieldValue !== values[0];
            case "greater_than":
              return Number(fieldValue) > Number(values[0]);
            case "less_than":
              return Number(fieldValue) < Number(values[0]);
            case "greater_than_or_equal":
              return Number(fieldValue) >= Number(values[0]);
            case "less_than_or_equal":
              return Number(fieldValue) <= Number(values[0]);
            case "between":
              if (field === "created_at") {
                // Date range filtering for date fields
                if (values.length >= 2) {
                  const fromDate = new Date(String(values[0]));
                  const toDate = new Date(String(values[1]));
                  const fieldDate = new Date(String(fieldValue));
                  return fieldDate >= fromDate && fieldDate <= toDate;
                }
              } else {
                // Number range filtering for other fields
                if (values.length >= 2) {
                  const min = Number(values[0]);
                  const max = Number(values[1]);
                  return Number(fieldValue) >= min && Number(fieldValue) <= max;
                }
              }
              return true;
            case "not_between":
              if (field === "created_at") {
                // Date range filtering for date fields
                if (values.length >= 2) {
                  const fromDate = new Date(String(values[0]));
                  const toDate = new Date(String(values[1]));
                  const fieldDate = new Date(String(fieldValue));
                  return fieldDate < fromDate || fieldDate > toDate;
                }
              } else {
                // Number range filtering for other fields
                if (values.length >= 2) {
                  const min = Number(values[0]);
                  const max = Number(values[1]);
                  return Number(fieldValue) < min || Number(fieldValue) > max;
                }
              }
              return true;
            case "before":
              return new Date(String(fieldValue)) < new Date(String(values[0]));
            case "after":
              return new Date(String(fieldValue)) > new Date(String(values[0]));
            default:
              return true;
          }
        });
      });

      return filtered;
    },
    [tags, theme],
  );

  // Filtered tags state
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);

  // Update filtered tags when tags or filters change
  useEffect(() => {
    const filtered = applyFiltersToTags(filters);
    setFilteredTags(filtered);
  }, [tags, filters, applyFiltersToTags]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Filter[]) => {
    setFilters(newFilters);
  }, []);

  // Fetch all tags
  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      const res = await authFetch("/api/tags/");
      if (res.ok) setTags(await res.json());
      setLoading(false);
    };
    fetchTags();
  }, []);

  const refreshTags = async () => {
    const res = await authFetch("/api/tags/");
    if (res.ok) setTags(await res.json());
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    const response = await authFetch(`/api/tags/${tagId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      await refreshTags();
    }
  };

  // Authentication is now handled by the server component

  if (loading)
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Spinner className="size-6 mx-auto" />
          <p className="text-xs mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Tags
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
          Create and organize custom tags with colors to categorize and manage
          your campaigns effectively.
        </p>
      </div>
      <div className="flex items-center justify-between">
        {/* Filters Section */}
        <div className="flex items-start gap-2.5 mb-3.5">
          <div className="flex-1">
            <Filters
              filters={filters}
              fields={fields}
              onChange={handleFiltersChange}
              variant="outline"
              size="sm"
            />
          </div>
          {filters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters([]);
              }}
            >
              <X /> Clear
            </Button>
          )}
        </div>
        <Button
          onClick={() => setTagModalState({ open: true, mode: "create" })}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTags.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={TagIcon}
              title="No Tags Yet"
              description="Create tags to categorize and organize your campaigns and links. Tags help you filter and find your content more easily."
              actionLabel="Add Tag"
              onAction={() => setTagModalState({ open: true, mode: "create" })}
            />
          </div>
        ) : (
          filteredTags.map((tag) => {
            const colorClasses = getColorClasses(tag.color);
            return (
              <Card
                key={tag.id}
                className={cn(
                  "relative hover:scale-105 hover:shadow-lg transition-all duration-200 rounded-lg flex flex-col min-h-[130px]",
                )}
              >
                <div className="absolute inset-0 pointer-events-none [background-size:20px_20px] [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"></div>
                <div className="absolute inset-0 pointer-events-none bg-card [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
                <div className="relative z-20">
                  <CardHeader className="pb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-full border ${colorClasses.bg} flex items-center justify-center`}
                          >
                            <span
                              className={`text-xs font-bold ${colorClasses.text}`}
                            >
                              #
                            </span>
                          </div>
                          <h3 className="font-semibold text-lg truncate text-foreground/80">
                            {tag.tag_name}
                          </h3>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant={"ghost"}
                            size={"icon"}
                            className="rounded-full p-0 m-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setTagModalState({
                                open: true,
                                mode: "edit",
                                tag: tag,
                              })
                            }
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Tag
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteTag(tag.id)}
                            className="text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Tag
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="w-full pt-0 mt-auto">
                    {tag.description && (
                      <>
                        <Label className="text-muted-foreground/70 text-xs">
                          Description
                        </Label>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {tag.description}
                        </p>
                      </>
                    )}
                    <div className="flex flex-inline gap-1 pt-3 text-xs justify-end text-muted-foreground/70">
                      Created At
                      <span className="font-mono">
                        {tag.created_at
                          ? new Date(tag.created_at).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Tag Modal */}
      <TagModal
        open={tagModalState.open}
        onOpenChange={(open) => {
          if (!open) {
            setTagModalState({ open: false, mode: "create" });
          }
        }}
        initialData={
          tagModalState.mode === "edit" ? tagModalState.tag : undefined
        }
        onSave={async (values) => {
          if (tagModalState.mode === "edit" && tagModalState.tag) {
            await authFetch(`/api/tags/${tagModalState.tag.id}`, {
              method: "PATCH",
              body: JSON.stringify(values),
            });
          } else {
            await authFetch("/api/tags/", {
              method: "POST",
              body: JSON.stringify(values),
            });
          }
          await refreshTags();
          setTagModalState({ open: false, mode: "create" });
        }}
      />
    </div>
  );
}
