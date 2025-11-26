"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Folders,
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
import { SafeUser } from "@/lib/getSafeSession";
import { EmptyState } from "@/components/ui/empty-state";
import GroupModal from "@/app/components/GroupModal";
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
import { Label } from "@/components/ui/label";

interface Group {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface GroupsPageProps {
  user: SafeUser;
}

export default function GroupsPage({ user }: GroupsPageProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filter[]>([]);

  // Modal State
  const [groupModalState, setGroupModalState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    group?: Group;
  }>({ open: false, mode: "create" });

  const loadGroups = async () => {
    try {
      const response = await authFetch("/api/groups/");
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error("Failed to load groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleSave = async (values: { name: string; description?: string }) => {
    try {
      const url =
        groupModalState.mode === "edit" && groupModalState.group
          ? `/api/groups/${groupModalState.group.id}`
          : "/api/groups/";
      const method = groupModalState.mode === "edit" ? "PATCH" : "POST";

      const response = await authFetch(url, {
        method,
        body: JSON.stringify(values),
      });

      if (response.ok) {
        await loadGroups();
      }
    } catch (error) {
      console.error("Failed to save group:", error);
    }
  };

  const handleEdit = (group: Group) => {
    setGroupModalState({
      open: true,
      mode: "edit",
      group: group,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this group?")) return;

    try {
      const response = await authFetch(`/api/groups/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await loadGroups();
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
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
      key: "name",
      label: "Name",
      icon: <Folders className="size-3.5" />,
      type: "text",
      className: "w-40 bg-secondary",
      placeholder: "Search group names...",
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
      defaultOperator: "between",
    },
  ];

  // Apply filters to groups data
  const applyFiltersToGroups = useCallback(
    (newFilters: Filter[]) => {
      let filtered = [...groups];

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

        filtered = filtered.filter((group) => {
          const fieldValue = group[field as keyof Group];

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
    [groups],
  );

  // Filtered groups state
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);

  // Update filtered groups when groups or filters change
  useEffect(() => {
    const filtered = applyFiltersToGroups(filters);
    setFilteredGroups(filtered);
  }, [groups, filters, applyFiltersToGroups]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Filter[]) => {
    setFilters(newFilters);
  }, []);

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

  return (
    <div className="space-y-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Groups
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
          Organize your links into groups for better management and analytics.
        </p>
      </div>
      <div className="flex items-center justify-between">
        {/* Filters Section */}
        <div className="flex items-start gap-2.5">
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
              className="text-xs gap-2"
              onClick={() => {
                setFilters([]);
              }}
            >
              <X className="w-4 h-4" /> Clear
            </Button>
          )}
        </div>
        <Button
          onClick={() => setGroupModalState({ open: true, mode: "create" })}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Group
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredGroups.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Folders}
              title="No Groups Yet"
              description="Create groups to organize your links and improve your analytics. Groups help you categorize and manage your links more effectively."
              actionLabel="Create Your First Group"
              onAction={() =>
                setGroupModalState({ open: true, mode: "create" })
              }
            />
          </div>
        ) : (
          filteredGroups.map((group) => (
            <Card
              key={group.id}
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
                        <h3 className="font-semibold text-lg truncate text-foreground/80">
                          {group.name}
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
                            setGroupModalState({
                              open: true,
                              mode: "edit",
                              group: group,
                            })
                          }
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Group
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(group.id)}
                          className="text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="w-full pt-0 mt-auto">
                  {group.description && (
                    <>
                      <Label className="text-muted-foreground/70 text-xs">
                        Description
                      </Label>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {group.description}
                      </p>
                    </>
                  )}
                  <div className="flex flex-inline gap-1 pt-3 text-xs justify-end text-muted-foreground/70">
                    Created At
                    <span className="font-mono">
                      {group.created_at
                        ? new Date(group.created_at).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Group Modal */}
      <GroupModal
        open={groupModalState.open}
        onOpenChange={(open) => {
          if (!open) {
            setGroupModalState({ open: false, mode: "create" });
          }
        }}
        initialData={
          groupModalState.mode === "edit" ? groupModalState.group : undefined
        }
        onSave={handleSave}
      />
    </div>
  );
}
