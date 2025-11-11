"use client";

import React, { useState, useEffect } from "react";
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
  formatNumber,
  formatPercentage,
  getChangeColor,
  getChangeIcon,
} from "@/lib/analytics-api";
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

  // Use smart period and interval management
  const { period, interval, updatePeriod, updateInterval } =
    useSmartAnalyticsFilters();

  const fetchOverview = async (interval: string) => {
    try {
      // Map intervals to periods for the API
      const period =
        interval === "hourly"
          ? "1d"
          : interval === "daily"
            ? "7d"
            : interval === "weekly"
              ? "30d"
              : interval === "monthly"
                ? "90d"
                : "365d";
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

  const refreshData = async (interval: string) => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchOverview(interval), fetchTimeSeries(interval)]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData(interval);
  }, [period, interval]); // Refresh when period or interval changes

  const handlePeriodChange = (newPeriod: string) => {
    updatePeriod(newPeriod);
  };

  const handleIntervalChange = (newInterval: string) => {
    updateInterval(newInterval);
    refreshData(newInterval);
  };

  if (loading && !overviewData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Overview
          </h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
            <Button onClick={() => refreshData(interval)} className="mt-4">
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
            onRefresh={() => refreshData(interval)}
            loading={loading}
            className="w-full"
          />
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="geography" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Geography
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="traffic" className="flex items-center gap-2">
            <MousePointer className="h-4 w-4" />
            Traffic
          </TabsTrigger>
        </TabsList>

        {/*Page -- Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Time Series Chart */}
            {timeSeriesLoading ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">
                    Clicks Over Time
                  </span>
                  <Spinner className={"size-6"} />
                </div>
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-500">Loading time series data...</p>
                </div>
              </Card>
            ) : timeSeriesError ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">
                    Clicks Over Time
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshData(interval)}
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
              /*<TimeSeriesChart
                              data={timeSeriesData}
                              title="Clicks Over Time"
                              timeInterval={interval as 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'}
                              selectedInterval={interval}
                              showMobileDesktop={true}
                              className="h-full w-full"
                            />*/
              /*<ProjectDashboardCard
                                timelineTitle="Clicks Over Time"
                                timelineSubtitle="Total 840 Task Completed"
                                chartComponent={
                                    <TimeSeriesChart
                                        data={timeSeriesData}
                                        title="Clicks Over Time"
                                        timeInterval={interval as 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'}
                                        selectedInterval={interval}
                                        showMobileDesktop={true}
                                        className="h-full w-full"
                                    />
                                }
                                projectListTitle="Project List"
                                projectListSubtitle="4 ongoing project"
                                projects={[
                                    // Optional: custom projects array
                                ]}
                            />*/

              // With project list (default)
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
                    showMobileDesktop={true}
                    className="h-full w-full rounded-xl border-none shadow-none bg-transparent"
                  />
                }
              />
            )}
          </div>
        </TabsContent>

        {/* Geography Tab */}
        <TabsContent value="geography" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Map */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Global Traffic Distribution
                </h3>
                <span className="text-sm text-muted-foreground">{period}</span>
              </div>
              <div className="h-auto">
                <MapCompact />
              </div>
            </Card>

            {/* Top Countries */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 h-auto">
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
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DeviceBreakdownChart
              period={period}
              topN={5}
              title="Device Breakdown"
              description="Device types accessing your links"
              className="h-full"
            />

            {/* Additional device insights could go here */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Device Insights
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Mobile vs Desktop Ratio
                  </span>
                  <span className="text-sm font-medium">
                    60% Mobile, 40% Desktop
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Most Popular Browser
                  </span>
                  <span className="text-sm font-medium">Chrome (45%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Most Popular OS</span>
                  <span className="text-sm font-medium">iOS (28%)</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Traffic Tab */}
        <TabsContent value="traffic" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TrafficSourcesChart
              period={period}
              topN={5}
              title="Traffic Sources"
              description="Distribution of your traffic sources"
              className="h-full"
            />

            {/* Additional traffic insights could go here */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Traffic Insights
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Organic Search</span>
                  <span className="text-sm font-medium">45.7%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Direct Traffic</span>
                  <span className="text-sm font-medium">25.7%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Social Media</span>
                  <span className="text-sm font-medium">13.6%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Email Campaigns</span>
                  <span className="text-sm font-medium">9.6%</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
