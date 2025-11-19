"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Link as LinkIcon,
  Target,
  Plus,
  Calendar,
  RefreshCw,
  BarChart3,
  Globe,
  Smartphone,
  MousePointer,
  LaptopMinimal,
  TabletSmartphoneIcon,
  Info,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import TimeSeriesChart from "@/components/analytics/TimeSeriesChart";
import DeviceBreakdownChart from "@/components/analytics/DeviceBreakdownChart";
import TrafficSourcesChart from "@/components/analytics/TrafficSourcesChart";
import TopCountriesChart from "@/components/analytics/TopCountriesChart";
import MapCompact from "@/components/analytics/mapCompact";
import AnalyticsFilters from "@/components/analytics/AnalyticsFilters";
import { useSmartAnalyticsFilters } from "@/components/analytics/PeriodSelector";
import {
  analyticsAPI,
  type AnalyticsOverview,
  type TimeSeriesPoint,
  type TrafficSourcePoint,
  formatNumber,
  formatPercentage,
  getChangeColor,
  getChangeIcon,
} from "@/lib/analytics-api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/global-tooltip";
import { Status } from "@/app/components/ui/badges-var1";
import { Separator } from "@/app/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProjectDashboardCard from "@/components/analytics/ClickOverTimePerDevice";
import { Spinner } from "@/components/ui/spinner";
import SalesCountryChart from "@/components/analytics/TopCountriesChartV2";
import TopLinksCampaignsChart from "@/components/analytics/TopLinksCampaignsChart";
import { Span } from "next/dist/trace";

const INTERVALS = [
  { value: "hourly", label: "Hourly", description: "Last 24 hours" },
  { value: "daily", label: "Daily", description: "Last 7 days" },
  { value: "weekly", label: "Weekly", description: "Last 4 weeks" },
  { value: "monthly", label: "Monthly", description: "Last 6 months" },
  { value: "yearly", label: "Yearly", description: "Last 12 months" },
];

const GRANULARITY_OPTIONS = [
  {
    value: "country",
    label: "Top Countries",
    description: "Geographic distribution of your clicks",
  },
  {
    value: "city",
    label: "Top Cities",
    description: "Geographic distribution of your clicks",
  },
  {
    value: "region",
    label: "Top Regions",
    description: "Regional distribution of your clicks",
  },
];

const TRAFFIC_OPTIONS = [
  {
    value: "sources",
    label: "Traffic Sources",
    description: "Distribution of your traffic sources",
  },
  {
    value: "insights",
    label: "Traffic Insights",
    description: "Grouped traffic insights",
  },
];

const LINKS_CAMPAIGNS_OPTIONS = [
  {
    value: "links",
    label: "Top Links",
    description: "Most clicked links in your account",
  },
  {
    value: "campaigns",
    label: "Top Campaigns",
    description: "Most active campaigns by click count",
  },
];

const formatStageLabel = (stage: string) => {
  return stage
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function AnalyticsOverview() {
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<AnalyticsOverview | null>(
    null,
  );
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [timeSeriesError, setTimeSeriesError] = useState<string | null>(null);
  const [timeSeriesLoading, setTimeSeriesLoading] = useState(false);
  const [trafficSourcesData, setTrafficSourcesData] = useState<
    TrafficSourcePoint[]
  >([]);
  const [trafficSourcesLoading, setTrafficSourcesLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedGranularity, setSelectedGranularity] = useState("country");
  const [geographyRefreshTrigger, setGeographyRefreshTrigger] = useState(0);
  const [geographyLoading, setGeographyLoading] = useState(false);
  const [selectedTrafficView, setSelectedTrafficView] = useState("sources");
  const [trafficRefreshTrigger, setTrafficRefreshTrigger] = useState(0);
  const [selectedLinksCampaignsView, setSelectedLinksCampaignsView] =
    useState("links");
  const [linksCampaignsRefreshTrigger, setLinksCampaignsRefreshTrigger] =
    useState(0);
  const [linksCampaignsLoading, setLinksCampaignsLoading] = useState(false);

  // Compute device statistics from time series data
  const deviceProjects = useMemo(() => {
    const totalMobile = timeSeriesData.reduce(
      (sum, point) => sum + point.mobile_clicks,
      0,
    );
    const totalDesktop = timeSeriesData.reduce(
      (sum, point) => sum + point.desktop_clicks,
      0,
    );
    const totalOther = timeSeriesData.reduce(
      (sum, point) => sum + point.other_clicks,
      0,
    );
    const total = totalMobile + totalDesktop + totalOther;

    return [
      {
        name: "Mobile",
        icon: <Smartphone className="size-4.25" />,
        tasksCompleted: totalMobile,
        totalTasks: total,
        colorClass: "bg-chart-2/10 text-chart-5",
      },
      {
        name: "Desktop",
        icon: <LaptopMinimal className="size-4.25" />,
        tasksCompleted: totalDesktop,
        totalTasks: total,
        colorClass: "bg-chart-5/10 text-chart-2",
      },
      {
        name: "Other",
        icon: <TabletSmartphoneIcon className="size-4.25" />,
        tasksCompleted: totalOther,
        totalTasks: total,
        colorClass: "bg-chart-3/10 text-chart-3",
      },
    ];
  }, [timeSeriesData]);

  // Group traffic sources by type
  const groupedTrafficSources = useMemo(() => {
    const grouped = trafficSourcesData.reduce(
      (acc, source) => {
        const type = source.type;
        if (!acc[type]) {
          acc[type] = {
            type,
            totalPercentage: 0,
            totalClicks: 0,
            totalVisitors: 0,
            sources: [],
          };
        }
        acc[type].totalPercentage += source.percentage;
        acc[type].totalClicks += source.click_count;
        acc[type].totalVisitors += source.unique_visitors;
        acc[type].sources.push(source);
        return acc;
      },
      {} as Record<
        string,
        {
          type: string;
          totalPercentage: number;
          totalClicks: number;
          totalVisitors: number;
          sources: TrafficSourcePoint[];
        }
      >,
    );

    return Object.values(grouped).sort(
      (a, b) => b.totalPercentage - a.totalPercentage,
    );
  }, [trafficSourcesData]);

  // Use smart period and interval management
  const { period, interval, updatePeriod, updateInterval } =
    useSmartAnalyticsFilters();

  const fetchOverview = async (period: string) => {
    try {
      const data = await analyticsAPI.getOverview(period);
      setOverviewData(data);
    } catch (err) {
      console.error("Overview fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch overview data",
      );
    }
  };

  const fetchTimeSeries = async (interval: string) => {
    try {
      setTimeSeriesLoading(true);

      // Map intervals to API format (backend expects 'day', 'week', 'month', 'year')
      const apiInterval =
        interval === "hourly"
          ? "hour"
          : interval === "daily"
            ? "day"
            : interval === "weekly"
              ? "week"
              : interval === "monthly"
                ? "month"
                : "year";

      // Use the current period from smart filters
      const data = await analyticsAPI.getGlobalTimeSeries(apiInterval, period);
      setTimeSeriesData(data);

      console.log(
        `Received ${data.length} time series points for ${interval} interval with ${period} period`,
      );
    } catch (err) {
      console.error("Time series fetch error:", err);
      setTimeSeriesError(
        err instanceof Error ? err.message : "Failed to fetch time series data",
      );
    } finally {
      setTimeSeriesLoading(false);
    }
  };

  const fetchTrafficSources = async () => {
    try {
      setTrafficSourcesLoading(true);
      const data = await analyticsAPI.getTrafficSources({ period, topN: 5 });
      setTrafficSourcesData(data);
    } catch (err) {
      console.error("Traffic sources fetch error:", err);
    } finally {
      setTrafficSourcesLoading(false);
    }
  };

  const refreshData = async (isManual: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchOverview(period),
        fetchTimeSeries(interval),
        fetchTrafficSources(),
      ]);
      // Trigger refresh for components that fetch their own data only on manual refresh
      if (isManual) {
        setRefreshTrigger((prev) => prev + 1);
        setGeographyRefreshTrigger((prev) => prev + 1);
        setGeographyLoading(true);
        setTimeout(() => setGeographyLoading(false), 2000);
        setLinksCampaignsRefreshTrigger((prev) => prev + 1);
        setLinksCampaignsLoading(true);
        setTimeout(() => setLinksCampaignsLoading(false), 2000);
        setTrafficRefreshTrigger((prev) => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshTimeSeries = async () => {
    await fetchTimeSeries(interval);
  };

  useEffect(() => {
    refreshData();
  }, [period, interval]); // Refresh when period or interval changes

  useEffect(() => {
    if (trafficRefreshTrigger > 0) {
      fetchTrafficSources();
    }
  }, [trafficRefreshTrigger]);

  useEffect(() => {
    if (linksCampaignsRefreshTrigger > 0) {
      // No need to fetch here as the component handles its own data fetching
    }
  }, [linksCampaignsRefreshTrigger]);

  const handlePeriodChange = (newPeriod: string) => {
    updatePeriod(newPeriod);
  };

  const handleIntervalChange = (newInterval: string) => {
    updateInterval(newInterval);
    // Note: refreshData() is called by useEffect when interval changes
  };

  if (loading && !overviewData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Overview
          </h1>
          <Spinner className="size-6" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !overviewData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Overview
          </h1>
        </div>
        <Card className="">
          <div className="text-center text-red-600">
            <p>Error loading analytics data: {error}</p>
            <Button onClick={() => refreshData()} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Analytics Overview
            </h1>

            {/* Inline Filters */}
            <div className="flex items-center gap-3">
              <AnalyticsFilters
                selectedPeriod={period}
                selectedInterval={interval}
                onPeriodChange={handlePeriodChange}
                onIntervalChange={handleIntervalChange}
                onRefresh={() => refreshData(true)}
                loading={loading}
                className="flex items-center gap-3"
                inline={true}
              />
            </div>
          </div>

          {/* KPI Cards - 3 Column Layout */}
          {overviewData && (
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_2fr_3fr] gap-4">
              {/* CLICKS Card */}
              <Card className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    CLICKS
                  </p>
                  <MousePointer className="h-4 w-4 text-gray-400" />
                </div>
                <div className="mt-4 flex items-center gap-6">
                  {/* Total Clicks */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(overviewData.total_clicks)}
                      </p>
                      {overviewData.clicks_change_vs_previous !== undefined && (
                        <Status
                          variant={
                            overviewData.clicks_change_vs_previous &&
                            overviewData.clicks_change_vs_previous > 0
                              ? "active"
                              : overviewData.clicks_change_vs_previous &&
                                  overviewData.clicks_change_vs_previous < 0
                                ? "danger"
                                : "warn"
                          }
                          label={
                            overviewData.clicks_change_vs_previous !== null &&
                            overviewData.clicks_change_vs_previous !== undefined
                              ? `${overviewData.clicks_change_vs_previous > 0 ? "+" : ""}${parseFloat(formatNumber(Math.abs(overviewData.clicks_change_vs_previous))).toFixed(1)}%`
                              : "—"
                          }
                          className="text-xs"
                          showArrow={true}
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      Total Clicks
                    </p>
                  </div>

                  {/* Vertical Separator */}
                  <Separator orientation="vertical" className="h-12" />

                  {/* Unique Visitors */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(overviewData.total_unique_visitors)}
                      </p>
                      {overviewData.uv_change_vs_previous !== undefined && (
                        <Status
                          variant={
                            overviewData.uv_change_vs_previous &&
                            overviewData.uv_change_vs_previous > 0
                              ? "active"
                              : overviewData.uv_change_vs_previous &&
                                  overviewData.uv_change_vs_previous < 0
                                ? "danger"
                                : "warn"
                          }
                          label={
                            overviewData.uv_change_vs_previous !== null &&
                            overviewData.uv_change_vs_previous !== undefined
                              ? `${overviewData.uv_change_vs_previous > 0 ? "+" : ""}${parseFloat(formatNumber(Math.abs(overviewData.uv_change_vs_previous))).toFixed(1)}%`
                              : "—"
                          }
                          className="text-xs"
                          showArrow={true}
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      Unique Visitors
                    </p>
                  </div>
                </div>

                {/* Minimal Area Chart using same data as Clicks Over Time */}
                <div className="mt-4">
                  {timeSeriesData && timeSeriesData.length > 0 && (
                    <div className="h-16 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={timeSeriesData.map((point) => ({
                            timestamp: new Date(point.bucket_start).getTime(),
                            total: point.total_clicks,
                            mobile: point.mobile_clicks,
                            desktop: point.desktop_clicks,
                            other: point.other_clicks,
                            startDate: new Date(point.bucket_start),
                            endDate: new Date(point.bucket_end),
                          }))}
                          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="colorTotal"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="hsl(var(--chart-2))"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="hsl(var(--chart-2))"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <RechartsTooltip
                            cursor={false}
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const payloadData = payload[0]?.payload;
                                const startDate = payloadData?.startDate;
                                const endDate = payloadData?.endDate;
                                const totalValue = payloadData?.total || 0;

                                let formattedDate = "";

                                // Format date based on interval (simplified version)
                                if (startDate && endDate) {
                                  if (interval === "hourly") {
                                    formattedDate = `${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} - ${endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
                                  } else {
                                    formattedDate = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
                                  }
                                }

                                return (
                                  <div className="grid min-w-[6rem] items-start gap-1 rounded-md border bg-popover px-2 py-1.5 text-popover-foreground shadow-sm">
                                    <div className="text-xs font-medium">
                                      {formattedDate}
                                    </div>
                                    <div className="text-foreground flex basis-full items-center border-t pt-1 text-xs font-medium">
                                      <span className="flex-1">
                                        Total Clicks
                                      </span>
                                      <div className="text-foreground flex items-baseline gap-0.5 font-mono font-medium tabular-nums ml-4">
                                        {totalValue}
                                        <span className="text-muted-foreground font-normal text-xs">
                                          clicks
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="total"
                            stroke="hsl(var(--chart-2))"
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                            strokeWidth={1.5}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </Card>
              {/* LINKS Card */}
              <Card className="p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    LINKS
                  </p>
                  <LinkIcon className="h-4 w-4 text-gray-400" />
                </div>
                <div className="mt-2 space-y-4">
                  {/* Total Links & New Links Created in same row */}
                  <div className="flex items-center gap-6">
                    {/* Total Links */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl lg:text-3xl font-bold text-primary">
                          {formatNumber(overviewData.total_links)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground font-normal">
                        Total Links
                      </p>
                    </div>

                    {/* Vertical Separator */}
                    <Separator orientation="vertical" className="h-12" />

                    {/* New Links Created */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                          {formatNumber(overviewData.new_links_created)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground font-normal">
                        New Links
                      </p>
                    </div>
                  </div>

                  {/* Separator to align progress bars */}
                  <div className="flex-1 mt-6 pt-4">
                    {/* Link Types Progress Bar */}
                    {(() => {
                      const singleCount =
                        overviewData.link_type_counts?.redirect || 0;
                      const smartCount =
                        overviewData.link_type_counts?.smart || 0;
                      const totalNew = singleCount + smartCount;
                      const singlePercent =
                        totalNew > 0 ? (singleCount / totalNew) * 100 : 50; // Default to 50/50 if no data
                      const smartPercent =
                        totalNew > 0 ? (smartCount / totalNew) * 100 : 50;

                      return (
                        <>
                          <div className="text-xs text-muted-foreground font-medium tracking-wide uppercase mb-2">
                            Link Types
                          </div>
                          {/* Segmented Progress Bar */}
                          <div className="flex items-center gap-0.5 w-full h-2.5 rounded-full overflow-hidden mb-3.5 bg-muted">
                            <div
                              className="bg-rose-500 h-full"
                              style={{ width: `${singlePercent}%` }}
                            />
                            <div
                              className="bg-amber-400 h-full"
                              style={{ width: `${smartPercent}%` }}
                            />
                          </div>
                          {/* Legend */}
                          <div className="flex items-center gap-5">
                            <div className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                              <span className="size-2 rounded-full bg-rose-500 inline-block" />{" "}
                              Single
                              <span className="text-muted-foreground ml-1">
                                {formatNumber(singleCount)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                              <span className="size-2 rounded-full bg-amber-400 inline-block" />{" "}
                              Smart
                              <span className="text-muted-foreground ml-1">
                                {formatNumber(smartCount)}
                              </span>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="size-3.5 text-muted-foreground cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <span className="size-2 rounded-full bg-rose-400 inline-block" />
                                      <span className="text-rose-400 font-medium">
                                        Single
                                      </span>
                                      <span className="text-muted-foreground text-xs">
                                        Simple redirect links that send visitors
                                        to one fixed destination URL
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="size-2 rounded-full bg-amber-400 dark:bg-amber-500 inline-block" />
                                      <span className="text-amber-400 dark:text-amber-500 font-medium">
                                        Smart
                                      </span>
                                      <span className="text-muted-foreground text-xs">
                                        Advanced links with A/B testing,
                                        geo-targeting, and conditional routing
                                        rules
                                      </span>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </Card>

              {/* ACTIVE CAMPAIGNS Section*/}
              <Card className="p-4 lg:p-6">
                <div className="w-full">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      ACTIVE CAMPAIGNS
                    </p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="size-3.5 text-muted-foreground cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            The active campaign count is completely link-based -
                            a campaign is considered "active" if any of its
                            links received clicks during the selected period.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="mt-2 space-y-4">
                    {/* Active Campaigns & Efficiency in same row */}
                    <div className="flex items-center gap-6">
                      {/* Active Campaigns */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                            {formatNumber(overviewData.active_campaigns)}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground font-normal">
                          Active Campaigns
                        </p>
                      </div>

                      {/* Vertical Separator */}
                      <Separator orientation="vertical" className="h-12" />

                      {/* Efficiency */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl lg:text-3xl font-bold text-primary">
                            {overviewData.efficiency ? (
                              formatNumber(overviewData.efficiency)
                            ) : (
                              <span className="text-muted-foreground/30">
                                —
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-muted-foreground font-normal">
                            Efficiency
                          </p>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="size-3.5 text-muted-foreground cursor-pointer" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  <strong>Clicks per Campaign</strong>
                                  <br />
                                  Represents the average clicks per active
                                  campaign
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>

                      {/* Vertical Separator */}
                      <Separator orientation="vertical" className="h-12" />

                      {/* Engagement */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl lg:text-3xl font-bold text-primary">
                            {overviewData.engagement_per_campaign ? (
                              formatNumber(overviewData.engagement_per_campaign)
                            ) : (
                              <span className="text-muted-foreground/30">
                                —
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-muted-foreground font-normal">
                            Engagement
                          </p>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="size-3.5 text-muted-foreground cursor-pointer" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  <strong>Engagement per Campaign</strong>
                                  <br />
                                  Represents the average `unique visitors` per
                                  active campaign
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>

                    {/* Campaign Stages Progress Bar */}
                    {(() => {
                      const stages = Object.entries(
                        overviewData.campaign_stage_counts || {},
                      );
                      const totalActive = stages.reduce(
                        (sum, [, stageData]) => sum + stageData.count,
                        0,
                      );

                      // Color palette for campaign stages
                      const stageColors = [
                        "bg-teal-500 dark:bg-teal-400",
                        "bg-red-500 dark:bg-red-400",
                        "bg-amber-500 dark:bg-amber-400",
                        "bg-green-500 dark:bg-green-400",
                      ];

                      const stageTextColors = [
                        "text-teal-600 dark:text-teal-400",
                        "text-red-600 dark:text-red-400",
                        "text-amber-600 dark:text-amber-400",
                        "text-green-600 dark:text-green-400",
                      ];

                      return (
                        <div className="flex-1 mt-6 pt-4 ">
                          <div className="text-xs text-muted-foreground font-medium tracking-wide uppercase mb-2">
                            Campaign Stages
                          </div>
                          {/* Segmented Progress Bar */}
                          <div className="flex items-center gap-0.5 w-full h-2.5 rounded-full overflow-hidden mb-3.5 bg-muted">
                            {stages.length > 0 ? (
                              stages.map(([stage, stageData], index) => {
                                const percentage =
                                  totalActive > 0
                                    ? (stageData.count / totalActive) * 100
                                    : 100 / stages.length;
                                const colorClass =
                                  stageColors[index % stageColors.length];
                                return (
                                  <div
                                    key={stage}
                                    className={`${colorClass} h-full`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                );
                              })
                            ) : (
                              // Default progress bar when no stages
                              <div className="bg-muted-foreground/50 h-full w-full" />
                            )}
                          </div>
                          {/* Legend */}
                          <div className="flex flex-wrap items-center gap-3">
                            {stages.length > 0 ? (
                              stages.map(([stage, stageData], index) => {
                                const colorClass =
                                  stageColors[index % stageColors.length];
                                const textColorClass =
                                  stageTextColors[
                                    index % stageTextColors.length
                                  ];
                                return (
                                  <div
                                    key={stage}
                                    className={`flex items-center gap-1 text-xs ${textColorClass}`}
                                  >
                                    <span
                                      className={`size-2 rounded-full ${colorClass} inline-block`}
                                    />{" "}
                                    {formatStageLabel(stage)}
                                    <span className="text-muted-foreground ml-1">
                                      {formatNumber(stageData.count)}
                                    </span>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="size-2 rounded-full text-muted-foreground/50 inline-block" />{" "}
                                No active campaigns
                              </div>
                            )}
                            {stages.length > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="size-3.5 text-muted-foreground cursor-pointer" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-2 min-w-[200px] max-w-[320px]">
                                      {stages.map(
                                        ([stage, stageData], index) => {
                                          const colorClass =
                                            stageColors[
                                              index % stageColors.length
                                            ];
                                          const textColorClass =
                                            stageTextColors[
                                              index % stageTextColors.length
                                            ];
                                          return (
                                            <div
                                              key={stage}
                                              className="flex items-start gap-2"
                                            >
                                              <span
                                                className={`size-2 rounded-full ${colorClass} inline-block flex-shrink-0 mt-0.5`}
                                              />
                                              <div className="flex-1 min-w-0">
                                                <div
                                                  className={`${textColorClass} font-medium text-xs leading-tight`}
                                                >
                                                  {formatStageLabel(stage)}
                                                </div>
                                                <div className="text-muted-foreground text-xs leading-tight mt-0.5 break-words">
                                                  {stageData.description}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-row flex-wrap gap-0">
          <div className="flex-1">
            <MapCompact
              size={"responsive"}
              period={period}
              refreshTrigger={refreshTrigger}
            />
          </div>

          <div className="flex-1">
            {/* Time Series Chart */}
            {timeSeriesLoading ? (
              <Card className="p-6 h-full w-full  border-none shadow-none bg-muted/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">
                    Clicks Over Time
                  </span>
                </div>
                <div className="h-80 flex items-center justify-center">
                  <Spinner className="size-6" />
                </div>
              </Card>
            ) : timeSeriesError ? (
              <Card className="p-6 h-full w-full  border-none shadow-none bg-muted/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">
                    Clicks Over Time
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshData()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
                <div className="h-80 flex items-center justify-center">
                  <p className="text-red-500 text-center">
                    Error: {timeSeriesError}
                  </p>
                </div>
              </Card>
            ) : (
              <ProjectDashboardCard
                chartComponent={
                  <TimeSeriesChart
                    data={timeSeriesData}
                    title="Clicks Over Time"
                    timeInterval={
                      interval as
                        | "hourly"
                        | "daily"
                        | "weekly"
                        | "monthly"
                        | "yearly"
                    }
                    selectedInterval={interval}
                    selectedPeriod={period}
                    showMobileDesktop={true}
                    className="h-full w-full  border-none shadow-none bg-transparent"
                  />
                }
                projects={deviceProjects}
                onRefresh={refreshTimeSeries}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row w-full gap-4">
          <Card className="w-full">
            <div className="p-4 flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-6 mb-4 bg-muted-foreground/5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <Select
                    value={selectedGranularity}
                    onValueChange={setSelectedGranularity}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRANULARITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-inline items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {period}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setGeographyRefreshTrigger((prev) => prev + 1);
                        setGeographyLoading(true);
                        setTimeout(() => setGeographyLoading(false), 2000);
                      }}
                      disabled={geographyLoading}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${geographyLoading ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary dark:text-white pb-1">
                    {
                      GRANULARITY_OPTIONS.find(
                        (o) => o.value === selectedGranularity,
                      )?.label
                    }
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {
                      GRANULARITY_OPTIONS.find(
                        (o) => o.value === selectedGranularity,
                      )?.description
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3">
              <TopCountriesChart
                period={period}
                granularity={
                  selectedGranularity as "country" | "city" | "region"
                }
                topN={5}
                className="h-full"
                refreshTrigger={geographyRefreshTrigger}
                noCard={true}
              />
            </div>
          </Card>
          <Card className="w-full">
            <div className="p-4 flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-6 mb-4 bg-muted-foreground/5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <Select
                    value={selectedTrafficView}
                    onValueChange={setSelectedTrafficView}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRAFFIC_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-inline items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {period}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setTrafficRefreshTrigger((prev) => prev + 1)
                      }
                      disabled={trafficSourcesLoading}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${trafficSourcesLoading ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary dark:text-white pb-1">
                    {
                      TRAFFIC_OPTIONS.find(
                        (o) => o.value === selectedTrafficView,
                      )?.label
                    }
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {
                      TRAFFIC_OPTIONS.find(
                        (o) => o.value === selectedTrafficView,
                      )?.description
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3">
              {selectedTrafficView === "sources" ? (
                <TrafficSourcesChart
                  period={period}
                  topN={5}
                  className="h-full"
                  refreshTrigger={trafficRefreshTrigger}
                  noCard={true}
                />
              ) : (
                <div className="space-y-3">
                  {trafficSourcesLoading ? (
                    <div className="h-[200px] flex items-center justify-center">
                      <div className="text-center">
                        <Spinner className="size-6 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">
                          Loading...
                        </p>
                      </div>
                    </div>
                  ) : groupedTrafficSources.length === 0 ? (
                    <div className="text-center text-gray-500">
                      No traffic insights available
                    </div>
                  ) : (
                    <TooltipProvider>
                      {groupedTrafficSources.slice(0, 4).map((group, index) => {
                        const maxClicks = Math.max(
                          ...groupedTrafficSources.map((g) => g.totalClicks),
                          1,
                        );
                        return (
                          <Tooltip key={index}>
                            <TooltipTrigger>
                              <div className="flex items-center gap-3">
                                {/* Rank number */}
                                <div className="text-center text-sm font-medium text-muted-foreground">
                                  {index + 1}
                                </div>

                                {/* Bar with name overlaid, number outside */}
                                <div className="flex-1 relative">
                                  <div className="h-6 bg-muted rounded-md overflow-hidden">
                                    <div
                                      className="absolute left-2 top-0 bottom-0 flex items-center text-xs font-normal capitalize truncate z-10"
                                      style={{
                                        color: "white",
                                        mixBlendMode: "difference",
                                      }}
                                    >
                                      {group.type}
                                    </div>
                                    <div
                                      className="h-full bg-primary rounded-md transition-all duration-500 ease-out"
                                      style={{
                                        width: `${(group.totalClicks / maxClicks) * 100}%`,
                                      }}
                                    />
                                  </div>
                                  <div
                                    className="absolute inset-0 flex items-center justify-end px-2 text-xs font-mono"
                                    style={{
                                      color: "white",
                                      mixBlendMode: "difference",
                                    }}
                                  >
                                    {formatNumber(group.totalClicks)}
                                  </div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <div className="font-medium">{group.type}</div>
                                <div>
                                  Clicks:{" "}
                                  <span className="font-mono">
                                    {formatNumber(group.totalClicks)}
                                  </span>
                                </div>
                                <div>
                                  Visitors:{" "}
                                  <span className="font-mono">
                                    {formatNumber(group.totalVisitors)}
                                  </span>
                                </div>
                                <div>
                                  Percentage:{" "}
                                  <span className="font-mono">
                                    {group.totalPercentage.toFixed(2)}%
                                  </span>
                                </div>
                                <div className="text-muted-foreground">
                                  ({group.sources.length} sources)
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </TooltipProvider>
                  )}
                </div>
              )}
            </div>
          </Card>
          <Card className="w-full">
            <div className="p-4 flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-6 mb-4 bg-muted-foreground/5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <Select
                    value={selectedLinksCampaignsView}
                    onValueChange={setSelectedLinksCampaignsView}
                  >
                    <SelectTrigger className="w-full sm:w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LINKS_CAMPAIGNS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-inline items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {period}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLinksCampaignsRefreshTrigger((prev) => prev + 1);
                        setLinksCampaignsLoading(true);
                        setTimeout(() => setLinksCampaignsLoading(false), 2000);
                      }}
                      disabled={linksCampaignsLoading}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${linksCampaignsLoading ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary dark:text-white pb-1">
                    {
                      LINKS_CAMPAIGNS_OPTIONS.find(
                        (o) => o.value === selectedLinksCampaignsView,
                      )?.label
                    }
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {
                      LINKS_CAMPAIGNS_OPTIONS.find(
                        (o) => o.value === selectedLinksCampaignsView,
                      )?.description
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="p-3">
              <TopLinksCampaignsChart
                period={period}
                type={selectedLinksCampaignsView as "links" | "campaigns"}
                topN={5}
                className="h-full"
                refreshTrigger={linksCampaignsRefreshTrigger}
                noCard={true}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
