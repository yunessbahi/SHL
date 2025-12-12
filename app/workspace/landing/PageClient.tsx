"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Activity,
  CheckCircle,
  Clock,
  Edit,
  Link,
  MousePointer,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { Spinner } from "../../../components/ui/spinner";
import UsageCard from "./components/PlanUsage/PlanUsageSection";
import { useWorkspaceData } from "./hooks/useWorkspaceData";
import "./styles/workspaceStyles.css";

const TIME_PERIODS = [
  { value: "1d", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "365d", label: "Last Year" },
];

const ACTIVITY_TYPES = [
  { value: "all", label: "All Types", icon: Activity },
  { value: "links", label: "Links", icon: Link },
  { value: "campaigns", label: "Campaigns", icon: CheckCircle },
  { value: "notifications", label: "Notifications", icon: Users },
];

// Mock data for Single and Smart links
const linksData = [
  { month: "Jan 24", single: 1200, smart: 800, smartArea: 800 },
  { month: "Feb 24", single: 1500, smart: 950, smartArea: 950 },
  { month: "Mar 24", single: 1800, smart: 1200, smartArea: 1200 },
  { month: "Apr 24", single: 1400, smart: 1100, smartArea: 1100 },
  { month: "May 24", single: 2000, smart: 1400, smartArea: 1400 },
  { month: "Jun 24", single: 1700, smart: 1300, smartArea: 1300 },
];

const chartConfig = {
  single: {
    label: "Single Links",
    color: "hsl(var(--chart-1))",
  },
  smart: {
    label: "Smart Links",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

// Statistics data for the chart
const statisticsData = [
  {
    id: "total-links",
    label: "Total Links",
    value: "8,600",
    change: "+12.5%",
    changeType: "positive",
    icon: Link,
  },
  {
    id: "smart-links",
    label: "Smart Links",
    value: "7,750",
    change: "+15.2%",
    changeType: "positive",
    icon: TrendingUp,
  },
  {
    id: "single-links",
    label: "Single Links",
    value: "850",
    change: "+8.1%",
    changeType: "positive",
    icon: MousePointer,
  },
  {
    id: "active-links",
    label: "Active Links",
    value: "23.4%",
    change: "-2.1%",
    changeType: "negative",
    icon: Activity,
  },
];

export default function LandingPageClient() {
  const router = useRouter();
  const {
    activities,
    notifications,
    quickActions,
    userStats,
    linkCreationStats,
    activityLoading,
    statsLoading,
    initialLoadComplete,
    activityError,
    quickAccessError,
    statsError,
    refreshActivities,
    refreshStats,
    selectedTimeRange,
    handleTimeRangeChange,
  } = useWorkspaceData();

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      refreshActivities();
      refreshStats();
    }, 300000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [refreshActivities, refreshStats]);

  // Show global loading state if initial load not complete
  if (!initialLoadComplete) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <Spinner className="w-12 h-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  // Check for critical errors
  const hasCriticalError = activityError || quickAccessError || statsError;

  if (hasCriticalError) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-muted-foreground">
            Workspace Error
          </h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-destructive">
                  Failed to load workspace data
                </h3>
                <p className="mt-1 text-sm text-destructive/80">
                  {activityError || quickAccessError || statsError}
                </p>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={refreshActivities}
                    className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-popover-foreground transition-colors"
                  >
                    Retry Loading Data
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-muted text-muted-foreground text-sm font-medium rounded-md hover:bg-muted transition-colors"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-muted-foreground">
            Welcome to your Workspace
          </h1>
          <p className="text-md text-muted-foreground">
            Today, December 8, 2025
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select
            value={
              selectedTimeRange === "day"
                ? "1d"
                : selectedTimeRange === "week"
                  ? "7d"
                  : selectedTimeRange === "month"
                    ? "30d"
                    : "365d"
            }
            onValueChange={(value) => {
              const timeRange =
                value === "1d"
                  ? "day"
                  : value === "7d"
                    ? "week"
                    : value === "30d"
                      ? "month"
                      : "year";
              handleTimeRangeChange(timeRange as any);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flec-row gap-4">
        {/* Link Creation Stats - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Link Creation Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                {/* Statistics Section */}
                <div className="flex items-center flex-nowrap gap-10 mb-5">
                  {statisticsData.map((stat) => {
                    const IconComponent = stat.icon;
                    return (
                      <Fragment key={stat.id}>
                        <div className="h-10 w-px flex-1 bg-border hidden lg:block first:hidden" />
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted border border-muted-foreground/10">
                            <IconComponent className="w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-0.5">
                              {stat.label}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black">
                                {stat.value}
                              </span>
                              <span
                                className={`text-xs font-medium ${
                                  stat.changeType === "positive"
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                }`}
                              >
                                {stat.change}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Fragment>
                    );
                  })}
                </div>

                {/* Chart Section */}
                <ChartContainer
                  config={chartConfig}
                  className="h-[300px] w-full [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
                >
                  <ComposedChart
                    data={linksData}
                    margin={{
                      top: 5,
                      right: 15,
                      left: 5,
                      bottom: 5,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="smartGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={chartConfig.smart.color}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor={chartConfig.smart.color}
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="4 4"
                      stroke="var(--input)"
                      strokeOpacity={1}
                      horizontal={true}
                      vertical={false}
                    />

                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 11,
                        className: "text-muted-foreground",
                      }}
                      dy={5}
                      tickMargin={12}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 11,
                        className: "text-muted-foreground",
                      }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(1)}K`}
                      domain={["dataMin - 100", "dataMax + 100"]}
                      tickMargin={12}
                    />

                    {/* Current month reference line */}
                    <ReferenceLine
                      x="Mar 24"
                      stroke={chartConfig.smart.color}
                      strokeWidth={1}
                    />

                    {/* Tooltip */}
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const filteredPayload = payload.filter(
                            (entry) => entry.dataKey !== "smartArea",
                          );
                          return (
                            <div className="rounded-lg border bg-popover p-3 shadow-sm shadow-black/5 min-w-[180px]">
                              <div className="text-xs font-medium text-muted-foreground tracking-wide mb-2.5">
                                {label}
                              </div>
                              <div className="space-y-2">
                                {filteredPayload.map((entry, index) => {
                                  const config =
                                    chartConfig[
                                      entry.dataKey as keyof typeof chartConfig
                                    ];
                                  return (
                                    <div
                                      key={index}
                                      className="flex items-center gap-2 text-xs"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <div
                                          className="size-3.5 border-4 rounded-full bg-background"
                                          style={{ borderColor: entry.color }}
                                        ></div>
                                        <span className="text-muted-foreground">
                                          {config?.label}:
                                        </span>
                                      </div>
                                      <span className="font-semibold text-popover-foreground">
                                        {entry.value?.toLocaleString()}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{
                        stroke: "var(--input)",
                        strokeWidth: 1,
                        strokeDasharray: "none",
                      }}
                    />

                    {/* Smart links area with gradient background */}
                    <Area
                      type="linear"
                      dataKey="smartArea"
                      stroke="transparent"
                      fill="url(#smartGradient)"
                      strokeWidth={0}
                      dot={false}
                    />

                    {/* Single links line with dots */}
                    <Line
                      type="linear"
                      dataKey="single"
                      stroke={chartConfig.single.color}
                      strokeWidth={2}
                      dot={{
                        fill: "var(--background)",
                        strokeWidth: 2,
                        r: 6,
                        stroke: chartConfig.single.color,
                      }}
                    />

                    {/* Smart links line (dashed) */}
                    <Line
                      type="linear"
                      dataKey="smart"
                      stroke={chartConfig.smart.color}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{
                        fill: "var(--background)",
                        strokeWidth: 2,
                        r: 6,
                        stroke: chartConfig.smart.color,
                        strokeDasharray: "0",
                      }}
                    />
                  </ComposedChart>
                </ChartContainer>
              </div>
            </div>
          </CardContent>
        </Card>
        <UsageCard />
      </div>
      {/* Recent Activities and Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recent Activities - responsive */}
        <div className="lg:col-span-2 md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Recent Activities</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-medium text-foreground">
                      Recent Activities
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Select defaultValue="all">
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Activity Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center space-x-2">
                                <type.icon className="h-4 w-4" />
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground capitalize">
                      {selectedTimeRange} view
                    </span>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border">
                {activityLoading ? (
                  <div className="p-4">
                    <div className="space-y-3">
                      {[1, 2, 3].map((item) => (
                        <TableRow
                          key={item}
                          className="flex items-start space-x-4 animate-pulse"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-2 bg-muted rounded w-1/2"></div>
                          </div>
                        </TableRow>
                      ))}
                    </div>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-muted-foreground">
                      No recent activities found
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableBody>
                      {activities.slice(0, 5).map((activity) => (
                        <TableRow
                          key={activity.id}
                          className="p-4 hover:bg-muted"
                        >
                          <TableCell className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                {activity.type === "link_created" ? (
                                  <Link className="h-4 w-4 text-primary" />
                                ) : activity.type === "campaign_started" ? (
                                  <CheckCircle className="h-4 w-4 text-primary" />
                                ) : activity.type === "link_updated" ? (
                                  <Edit className="h-4 w-4 text-primary" />
                                ) : (
                                  <Clock className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between">
                                <h4 className="text-sm font-medium text-foreground truncate">
                                  {activity.content}
                                </h4>
                                <time className="text-xs text-muted-foreground whitespace-nowrap">
                                  {new Date(
                                    activity.timestamp,
                                  ).toLocaleString()}
                                </time>
                              </div>
                              {activity.metadata &&
                                Object.keys(activity.metadata).length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                    {Object.entries(activity.metadata).map(
                                      ([key, value]) => (
                                        <span
                                          key={key}
                                          className="px-2 py-1 bg-muted rounded-full text-muted-foreground"
                                        >
                                          {key}:{" "}
                                          {typeof value === "object"
                                            ? JSON.stringify(value)
                                            : String(value)}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                )}
                            </div>

                            <div className="flex-shrink-0">
                              <button className="text-muted-foreground hover:text-foreground">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="p-4 border-t border-border">
                <button
                  onClick={() => router.push("/workspace/activities")}
                  className="w-full text-sm text-primary hover:text-popover-foreground font-medium py-2"
                >
                  View All Activities
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access - responsive with sticky positioning */}
        <div className="lg:col-span-1 md:col-span-1 lg:sticky lg:top-24 md:sticky md:top-20">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Quick Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {activityLoading ? (
                  <>
                    {[1, 2, 3, 4].map((item) => (
                      <Card key={item} className="p-4 animate-pulse">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
                            <div className="h-2 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </>
                ) : quickActions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No quick actions available
                    </p>
                  </div>
                ) : (
                  <>
                    {quickActions.map((action) => (
                      <Card
                        key={action.id}
                        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <CardContent className="p-0">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                              {action.icon === "link" ? (
                                <Link className="h-4 w-4 text-primary" />
                              ) : action.icon === "smart" ? (
                                <Users className="h-4 w-4 text-primary" />
                              ) : action.icon === "analytics" ? (
                                <TrendingUp className="h-4 w-4 text-primary" />
                              ) : action.icon === "campaign" ? (
                                <Edit className="h-4 w-4 text-primary" />
                              ) : action.icon === "list" ? (
                                <Clock className="h-4 w-4 text-primary" />
                              ) : action.icon === "group" ? (
                                <Users className="h-4 w-4 text-primary" />
                              ) : (
                                <Plus className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">
                                {action.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {action.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Custom Action Card */}
                    <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer border-2 border-dashed border-border">
                      <CardContent className="p-0">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <h4 className="font-medium text-foreground">
                            Add Custom Action
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Create your own quick access
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
