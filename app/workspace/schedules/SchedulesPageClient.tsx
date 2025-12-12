"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GanttContext,
  GanttFeatureItem,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttHeader,
  GanttMarker,
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttTimeline,
  GanttToday,
} from "@/components/ui/shadcn-io/gantt";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { analyticsAPI, type ScheduleDataPoint } from "@/lib/analytics-api";
import { toUpper } from "@/lib/utils";
import {
  Calendar,
  Link as LinkIcon,
  Maximize2,
  Merge,
  RefreshCw,
  Split,
  Target,
  Users,
} from "lucide-react";
import React, { useContext, useEffect, useMemo, useState } from "react";

// Group types for the dropdown
type GroupType = "campaign" | "group" | "link_type" | "channel";

interface GroupedData {
  [key: string]: ScheduleDataPoint[];
}

interface GanttFeature {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status: {
    id: string;
    name: string;
    color: string;
  };
  link_type: string;
  campaign_name: string | null;
  group_name: string | null;
  utm_medium: string;
  short_url: string;
  is_open_ended?: boolean;
}

const GROUP_OPTIONS = [
  { value: "campaign", label: "Campaign", icon: Target },
  { value: "group", label: "Group", icon: Users },
  { value: "link_type", label: "Link Type", icon: LinkIcon },
  { value: "channel", label: "Channel", icon: Calendar },
];

// Custom sidebar item component that shows full metadata
const CustomSidebarItem: React.FC<{
  item: ScheduleDataPoint;
  selectedGroup: GroupType;
  onSelectItem?: (id: string) => void;
}> = ({ item, selectedGroup, onSelectItem }) => {
  const gantt = useContext(GanttContext);

  const handleClick = () => {
    // Scroll to the feature in the timeline
    const feature = {
      id: item.id.toString(),
      name: item.link_name,
      startAt: item.start_date
        ? new Date(item.start_date)
        : new Date(item.created_at!),
      endAt: item.end_date
        ? new Date(item.end_date)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      status: {
        id: item.status,
        name: item.status,
        color:
          item.status === "active"
            ? "#10B981"
            : item.status === "paused"
              ? "#F59E0B"
              : item.status === "expired"
                ? "#EF4444"
                : "#6B7280",
      },
    };
    gantt.scrollToFeature?.(feature);
    // Call the original onSelectItem callback
    onSelectItem?.(item.id.toString());
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleClick();
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      active: "#10B981",
      paused: "#F59E0B",
      expired: "#EF4444",
      disabled: "#6B7280",
    };
    return statusMap[status] || statusMap.active;
  };

  // Calculate duration
  const getDuration = () => {
    const start = item.start_date
      ? new Date(item.start_date)
      : new Date(item.created_at!);
    const end = item.end_date ? new Date(item.end_date) : null;

    if (end) {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) return "1 day";
      return `${diffDays} days`;
    } else {
      return "Ongoing";
    }
  };

  return (
    <div
      className="relative flex items-center gap-2.5 py-[12px] px-1.5 text-xs hover:bg-secondary dark:hover:bg-muted-foreground/20 cursor-pointer"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      style={{ height: "var(--gantt-row-height)" }}
    >
      {/* Status dot */}
      <div
        className="pointer-events-none h-2 w-2 shrink-0 rounded-full mt-0.5"
        style={{ backgroundColor: getStatusColor(item.status) }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Link name and type */}
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm truncate">{item.link_name}</span>
          <Badge
            variant={"outline"}
            className="border-border text-muted-foreground text-[10px] px-[2px] py-0 h-4 gap-[2px]"
          >
            {item.link_type === "Single" && (
              <Merge className="h-[2px] w-[2px] p-[2px]" />
            )}
            {item.link_type === "Smart" && (
              <Split className="h-[2px] w-[2px] p-[2px]" />
            )}
            {item.link_type}
          </Badge>
        </div>

        {/* Metadata in one line with line clamp */}
        <div className="line-clamp-1 text-[10px] text-muted-foreground">
          {item.short_url}
          {item.campaign_name &&
            selectedGroup !== "campaign" &&
            ` • ${item.campaign_name}`}
          {item.group_name &&
            selectedGroup !== "group" &&
            ` • ${item.group_name}`}
        </div>
      </div>

      {/* Duration */}
      <p className="pointer-events-none text-muted-foreground shrink-0 text-[10px]">
        {getDuration()}
      </p>
    </div>
  );
};

export default function SchedulesPageClient() {
  const [schedulesData, setSchedulesData] = useState<ScheduleDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupType>("campaign");
  const [selectedRange, setSelectedRange] = useState<"daily" | "monthly">(
    "monthly",
  );

  // Fetch schedules data
  const fetchSchedulesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsAPI.getSchedulesData();
      setSchedulesData(data);
    } catch (err) {
      console.error("Schedules fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch schedules data",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedulesData();
  }, []);

  // Group data based on selected grouping
  const groupedData = useMemo((): GroupedData => {
    const groups: GroupedData = {};

    schedulesData.forEach((item) => {
      let groupKey = "";

      switch (selectedGroup) {
        case "campaign":
          groupKey = item.campaign_name || "Direct Links";
          break;
        case "group":
          groupKey = item.group_name || "Direct Links";
          break;
        case "link_type":
          groupKey = item.link_type;
          break;
        case "channel":
          groupKey = item.utm_medium;
          break;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  }, [schedulesData, selectedGroup]);

  // Get campaign lifecycle display for group headers
  const getCampaignLifecycleDisplay = (groupKey: string) => {
    if (selectedGroup !== "campaign" || groupKey === "Direct Links")
      return null;

    // Find the first item in this group to get lifecycle info
    const firstItem = Object.values(groupedData)
      .find((items) =>
        items.some(
          (item) => (item.campaign_name || "Direct Links") === groupKey,
        ),
      )
      ?.find((item) => (item.campaign_name || "Direct Links") === groupKey);

    return firstItem?.campaign_lifecycle_display || null;
  };

  // Get markers for one-off campaigns
  const markers = useMemo(() => {
    return schedulesData
      .filter((item) => item.is_one_off_campaign && item.end_date)
      .map((item) => ({
        id: `marker-${item.id}`,
        date: new Date(item.end_date!),
        label: `${item.campaign_name || "One-off"} ends`,
        className: "bg-red-100 text-red-900",
      }));
  }, [schedulesData]);

  // Status mapping for Gantt component
  const getStatusObject = (status: string) => {
    const statusMap: Record<
      string,
      { id: string; name: string; color: string }
    > = {
      active: { id: "active", name: "Active", color: "#10B981" },
      paused: { id: "paused", name: "Paused", color: "#F59E0B" },
      expired: { id: "expired", name: "Expired", color: "#EF4444" },
      disabled: { id: "disabled", name: "Disabled", color: "#6B7280" },
    };
    return statusMap[status] || statusMap.active;
  };

  // Transform data for Gantt component
  const ganttFeatures = useMemo((): GanttFeature[] => {
    return schedulesData.map((item) => {
      let endAt: Date | null = null;

      if (item.end_date) {
        // Fixed end date - use actual end date
        endAt = new Date(item.end_date);
      } else {
        // Open-ended (ongoing) - extend far into future to show continuity
        const farFuture = new Date();
        farFuture.setFullYear(farFuture.getFullYear() + 10); // 10 years from now
        endAt = farFuture;
      }

      return {
        id: item.id.toString(),
        name: item.link_name,
        startAt: item.start_date
          ? new Date(item.start_date)
          : new Date(item.created_at!),
        endAt,
        status: getStatusObject(item.status),
        link_type: item.link_type,
        campaign_name: item.campaign_name,
        group_name: item.group_name,
        utm_medium: item.utm_medium,
        short_url: item.short_url,
        is_open_ended: !item.end_date, // Track if it's open-ended
        backgroundClass: !item.end_date
          ? "border border-accent border-dotted dark:bg-accent bg-border"
          : endAt < new Date()
            ? "bg-red-500/10 dark:bg-red-600/20 border-red-600/40 text-red-700 dark:text-red-400"
            : "bg-emerald-500/10 dark:bg-emerald-600/20 border-emerald-600/40 text-emerald-700 dark:text-emerald-400", // Special background for ongoing links
      };
    });
  }, [schedulesData]);

  // Get group count for display
  const getGroupCount = (groupKey: string, items: ScheduleDataPoint[]) => {
    if (selectedGroup === "campaign" || selectedGroup === "group") {
      return items.length;
    }
    return null;
  };

  // Render group name with lifecycle badge for campaigns
  const renderGroupName = (groupKey: string, items: ScheduleDataPoint[]) => {
    const count = getGroupCount(groupKey, items);
    const lifecycleDisplay = getCampaignLifecycleDisplay(groupKey);
    const upperGroupKey = toUpper(groupKey);

    if (selectedGroup === "campaign" && lifecycleDisplay) {
      //return `${upperGroupKey} • ${lifecycleDisplay.text}`;
    }

    return upperGroupKey;
  };

  // Render group name with badge for count
  const renderGroupNameWithBadge = (
    groupKey: string,
    items: ScheduleDataPoint[],
  ) => {
    const count = getGroupCount(groupKey, items);
    const lifecycleDisplay = getCampaignLifecycleDisplay(groupKey);
    const upperGroupKey = toUpper(groupKey);

    return (
      <div className="w-full flex items-center justify-between gap-2 truncate">
        <div className="flex flex-col">
          <div className="truncate">{upperGroupKey}</div>
          {selectedGroup === "campaign" && lifecycleDisplay && (
            <div>
              {/* <span className="text-muted-foreground">•</span> */}
              <span className="text-xs text-muted-foreground/70 truncate font-normal">
                {lifecycleDisplay.text}
              </span>
            </div>
          )}
        </div>
        {count && (
          <Badge
            variant={"outline"}
            className="font-mono bg-foreground/5 text-muted-forground dark:bg-foreground/10 text-xs px-1.5 py-0 h-5 min-w-5 flex items-center justify-center"
          >
            {count}
          </Badge>
        )}
      </div>
    );
  };

  // Render duration text for sidebar
  const renderDuration = (item: ScheduleDataPoint) => {
    const start = item.start_date
      ? new Date(item.start_date)
      : new Date(item.created_at!);
    const end = item.end_date ? new Date(item.end_date) : null;

    if (end) {
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    } else {
      return `${start.toLocaleDateString()} - Ongoing`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <Spinner className="size-4" />
          <span className="ml-2 text-sm">Loading</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="text-center text-red-600 p-6">
            <p>Error loading schedules data: {error}</p>
            <Button onClick={fetchSchedulesData} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-muted-foreground">
          Smart Links Schedules
        </h1>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Range Selector */}
          <Tabs
            value={selectedRange}
            onValueChange={(value) =>
              setSelectedRange(value as "daily" | "monthly")
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly" className="text-xs">
                Monthly
              </TabsTrigger>
              <TabsTrigger value="daily" className="text-xs">
                Daily
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Select
            value={selectedGroup}
            onValueChange={(value: GroupType) => setSelectedGroup(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GROUP_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="mb-8 h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-none p-0">
              <div className="flex flex-col h-full w-full">
                <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
                  <DialogTitle>Smart Links Schedules - Fullscreen</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Visualize your Smart Links lifecycle and campaign schedules
                    in fullscreen
                  </p>
                </DialogHeader>
                <div className="flex-1 overflow-hidden w-full">
                  {/* Fullscreen Gantt Chart */}
                  <div
                    className="w-full h-full p-2"
                    style={{ width: "97.5vw", height: "87vh" }}
                  >
                    <GanttProvider
                      className="border-0"
                      range={selectedRange}
                      zoom={100}
                    >
                      <GanttSidebar>
                        {Object.entries(groupedData).map(
                          ([groupKey, items]) => (
                            <GanttSidebarGroup
                              key={groupKey}
                              name={groupKey}
                              nameRenderer={() =>
                                renderGroupNameWithBadge(groupKey, items)
                              }
                              className="mt-0"
                            >
                              {items.map((item) => {
                                const feature = ganttFeatures.find(
                                  (f) => f.id === item.id.toString(),
                                );
                                if (!feature) return null;

                                return (
                                  <CustomSidebarItem
                                    key={item.id}
                                    item={item}
                                    selectedGroup={selectedGroup}
                                    onSelectItem={() =>
                                      console.log("Selected item:", item.id)
                                    }
                                  />
                                );
                              })}
                            </GanttSidebarGroup>
                          ),
                        )}
                      </GanttSidebar>

                      <GanttTimeline>
                        <GanttHeader />
                        <GanttFeatureList>
                          {Object.entries(groupedData).map(
                            ([groupKey, items]) => (
                              <GanttFeatureListGroup key={groupKey}>
                                {items.map((item) => {
                                  const feature = ganttFeatures.find(
                                    (f) => f.id === item.id.toString(),
                                  );
                                  if (!feature) return null;

                                  return (
                                    <div
                                      key={item.id}
                                      style={{
                                        height: "var(--gantt-row-height)",
                                      }}
                                    >
                                      <GanttFeatureItem
                                        {...feature}
                                        onMove={(id, startAt, endAt) => {
                                          // Handle move if needed
                                          console.log(
                                            "Move feature:",
                                            id,
                                            startAt,
                                            endAt,
                                          );
                                        }}
                                      >
                                        <span className="text-xs truncate">
                                          {item.link_name}
                                        </span>
                                      </GanttFeatureItem>
                                    </div>
                                  );
                                })}
                              </GanttFeatureListGroup>
                            ),
                          )}
                        </GanttFeatureList>

                        {/* Markers for one-off campaigns */}
                        {markers.map((marker) => (
                          <GanttMarker
                            key={marker.id}
                            {...marker}
                            onRemove={() =>
                              console.log("Remove marker:", marker.id)
                            }
                          />
                        ))}

                        <GanttToday />
                      </GanttTimeline>
                    </GanttProvider>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchSchedulesData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Gantt Chart */}
      <GanttProvider className="border" range={selectedRange} zoom={100}>
        <GanttSidebar>
          {Object.entries(groupedData).map(([groupKey, items]) => (
            <GanttSidebarGroup
              key={groupKey}
              name={groupKey}
              nameRenderer={() => renderGroupNameWithBadge(groupKey, items)}
              className="mt-0"
            >
              {items.map((item) => {
                const feature = ganttFeatures.find(
                  (f) => f.id === item.id.toString(),
                );
                if (!feature) return null;

                return (
                  <CustomSidebarItem
                    key={item.id}
                    item={item}
                    selectedGroup={selectedGroup}
                    onSelectItem={() => console.log("Selected item:", item.id)}
                  />
                );
              })}
            </GanttSidebarGroup>
          ))}
        </GanttSidebar>

        <GanttTimeline>
          <GanttHeader />
          <GanttFeatureList>
            {Object.entries(groupedData).map(([groupKey, items]) => (
              <GanttFeatureListGroup key={groupKey}>
                {items.map((item) => {
                  const feature = ganttFeatures.find(
                    (f) => f.id === item.id.toString(),
                  );
                  if (!feature) return null;

                  return (
                    <div
                      key={item.id}
                      style={{ height: "var(--gantt-row-height)" }}
                    >
                      <GanttFeatureItem
                        {...feature}
                        onMove={(id, startAt, endAt) => {
                          // Handle move if needed
                          console.log("Move feature:", id, startAt, endAt);
                        }}
                      >
                        <span className="text-xs truncate">
                          {item.link_name}
                        </span>
                      </GanttFeatureItem>
                    </div>
                  );
                })}
              </GanttFeatureListGroup>
            ))}
          </GanttFeatureList>

          {/* Markers for one-off campaigns */}
          {markers.map((marker) => (
            <GanttMarker
              key={marker.id}
              {...marker}
              onRemove={() => console.log("Remove marker:", marker.id)}
            />
          ))}

          <GanttToday />
        </GanttTimeline>
      </GanttProvider>
    </div>
  );
}
