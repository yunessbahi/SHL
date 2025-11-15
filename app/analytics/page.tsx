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
} from "lucide-react";
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
import ProjectDashboardCard from "@/components/analytics/ClickOverTimePerDevice";
import { Spinner } from "@/components/ui/spinner";
import SalesCountryChart from "@/components/analytics/TopCountriesChartV2";

const INTERVALS = [
  { value: "hourly", label: "Hourly", description: "Last 24 hours" },
  { value: "daily", label: "Daily", description: "Last 7 days" },
  { value: "weekly", label: "Weekly", description: "Last 4 weeks" },
  { value: "monthly", label: "Monthly", description: "Last 6 months" },
  { value: "yearly", label: "Yearly", description: "Last 12 months" },
];

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
  const [mapData, setMapData] = useState<
    Array<{ country: string; value: string | number }>
  >([]);

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
            sources: [],
          };
        }
        acc[type].totalPercentage += source.percentage;
        acc[type].sources.push(source);
        return acc;
      },
      {} as Record<
        string,
        { type: string; totalPercentage: number; sources: TrafficSourcePoint[] }
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

  const fetchMapData = async () => {
    try {
      const data = await analyticsAPI.getGlobalTopCountries("country", period);
      const formatted = data.map((item) => ({
        country: item.location,
        value: item.click_count,
      }));
      setMapData(formatted);
    } catch (err) {
      console.error("Map data fetch error:", err);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchOverview(period),
        fetchTimeSeries(interval),
        fetchTrafficSources(),
        fetchMapData(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [period, interval]); // Refresh when period or interval changes

  const handlePeriodChange = (newPeriod: string) => {
    updatePeriod(newPeriod);
  };

  const handleIntervalChange = (newInterval: string) => {
    updateInterval(newInterval);
    refreshData();
  };

  if (loading && !overviewData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Overview
          </h1>
          <Spinner className="size-8" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 w-2/3">
          {/* KPI Cards */}
          {overviewData && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Clicks
                  </p>
                  <LinkIcon className="h-4 w-4 text-gray-400" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(overviewData.total_clicks)}
                  </p>
                  {overviewData.clicks_change_vs_previous !== undefined && (
                    <div
                      className={`flex items-center mt-1 text-sm ${getChangeColor(overviewData.clicks_change_vs_previous)}`}
                    >
                      {getChangeIcon(overviewData.clicks_change_vs_previous)}
                      <span className="ml-1">
                        {Math.abs(
                          overviewData.clicks_change_vs_previous,
                        ).toFixed(1)}
                        % vs previous period
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Links
                  </p>
                  <Target className="h-4 w-4 text-gray-400" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(overviewData.total_links)}
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Campaigns
                  </p>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(overviewData.active_campaigns)}
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    New Links Created
                  </p>
                  <Plus className="h-4 w-4 text-gray-400" />
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(overviewData.new_links_created)}
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Filters Section - Max 2/6 width */}
        <div className="px-6">
          <AnalyticsFilters
            selectedPeriod={period}
            selectedInterval={interval}
            onPeriodChange={handlePeriodChange}
            onIntervalChange={handleIntervalChange}
            onRefresh={() => refreshData()}
            loading={loading}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          {/* Time Series Chart */}
          {timeSeriesLoading ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Clicks Over Time</span>
                <Spinner className={"size-6"} />
              </div>
              <div className="h-80 flex items-center justify-center">
                <p className="text-gray-500">Loading time series data...</p>
              </div>
            </Card>
          ) : timeSeriesError ? (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Clicks Over Time</span>

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
                  className="h-full w-full rounded-xl border-none shadow-none bg-transparent"
                />
              }
              projects={deviceProjects}
            />
          )}

          <div className="flex flex-col gap-6">
            <TrafficSourcesChart
              period={period}
              topN={5}
              title="Traffic Sources"
              description="Distribution of your traffic sources"
              className="h-full"
            />

            {/* Traffic Insights */}
            <Card className="p-6">
              <div className="flex justify-between items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-6 mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white pb-1">
                    Traffic Insights
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {period}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTrafficSources()}
                    disabled={trafficSourcesLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${trafficSourcesLoading ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {trafficSourcesLoading ? (
                  <div className="flex items-center justify-center">
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
                      const maxPercentage = Math.max(
                        ...groupedTrafficSources.map((g) => g.totalPercentage),
                        1,
                      );
                      return (
                        <Tooltip key={index}>
                          <TooltipTrigger>
                            <div className="flex items-center gap-3">
                              {/* Rank number */}
                              <div className="w-6 text-center text-sm font-medium text-muted-foreground">
                                {index + 1}
                              </div>

                              {/* Type name */}
                              <div className="w-24 text-sm font-normal capitalize">
                                {group.type}
                              </div>

                              {/* Bar */}
                              <div className="flex-1 relative">
                                <div className="h-6 bg-muted rounded-md overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-md transition-all duration-500 ease-out"
                                    style={{
                                      width: `${(group.totalPercentage / maxPercentage) * 100}%`,
                                    }}
                                  />
                                </div>

                                {/* Percentage label */}
                                <div
                                  className={`absolute inset-0 flex items-center justify-end px-2 text-xs font-mono
                          ${(group.totalPercentage / maxPercentage) * 100 <= 80 ? "text-foreground" : "text-background"}
                          `}
                                >
                                  {group.totalPercentage.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="flex gap-2">
                              {group.type}:
                              <span className="font-mono">
                                {group.totalPercentage.toFixed(2)}%
                              </span>
                              <span className="text-muted-foreground">
                                ({group.sources.length} sources)
                              </span>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex justify-between items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-6 mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white pb-1">
                  Global Traffic Distribution
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{period}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchMapData()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="h-auto">
              <MapCompact size={"lg"} period={period} data={mapData} />
            </div>
          </Card>

          <div className="flex flex-col gap-6">
            <TopCountriesChart
              period={period}
              granularity="country"
              topN={5}
              title="Top Countries"
              description="Geographic distribution of your clicks"
              className="h-full"
            />

            <TopCountriesChart
              period={period}
              granularity="city"
              topN={5}
              title="Top Cities"
              description="Geographic distribution of your clicks"
              className="h-full"
            />

            <TopCountriesChart
              period={period}
              granularity="region"
              topN={5}
              title="Top Regions"
              description="Regional distribution of your clicks"
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="w-full justify-start" variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add New Link
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Report
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
