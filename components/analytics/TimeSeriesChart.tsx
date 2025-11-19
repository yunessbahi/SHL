// components/analytics/TimeSeriesChart.tsx
"use client";

import { TrendingUp, Calendar, EllipsisVertical } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TimeSeriesPoint } from "@/lib/analytics-api";
import { Button } from "@/components/ui/button";
import React, { useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
  title?: string;
  showMobileDesktop?: boolean;
  timeInterval?: "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  onIntervalChange?: (interval: string) => void;
  selectedInterval?: string;
  selectedPeriod?: string;
  intervals?: Array<{ value: string; label: string; description: string }>;
  height?: number;
  className?: string;
}

const DEFAULT_INTERVALS = [
  { value: "hourly", label: "Hourly", description: "Last 24 hours" },
  { value: "daily", label: "Daily", description: "Last 7 days" },
  { value: "weekly", label: "Weekly", description: "Last 4 weeks" },
  { value: "monthly", label: "Monthly", description: "Last 6 months" },
  { value: "yearly", label: "Yearly", description: "Last 12 months" },
];

export default function TimeSeriesChart({
  data,
  title = "Clicks Over Time",
  showMobileDesktop = true,
  timeInterval = "daily",
  onIntervalChange,
  selectedInterval = timeInterval,
  selectedPeriod,
  intervals = DEFAULT_INTERVALS,
  height = 600,
  className = "",
}: TimeSeriesChartProps) {
  // 🔍 DEBUG: Log data reception
  console.log("🔍 TimeSeriesChart: Received data:", {
    dataLength: data?.length,
    selectedInterval,
    firstPoint: data?.[0]?.bucket_start,
    lastPoint: data?.[data?.length - 1]?.bucket_start,
    lastPointClicks: data?.[data?.length - 1]?.total_clicks,
  });

  // Transform data for Recharts format
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((point, index) => {
      // Parse the bucket_start date
      const startDate = new Date(point.bucket_start);
      const endDate = new Date(point.bucket_end);

      // 🔍 DEBUG: Log data transformation for first and last points
      if (index === 0 || index === data.length - 1) {
        console.log(`🔍 TimeSeriesChart: Processing point ${index}:`, {
          original: point.bucket_start,
          transformed: startDate.toISOString(),
          total_clicks: point.total_clicks,
          isLast: index === data.length - 1,
        });
      }

      return {
        timestamp: startDate.getTime(),
        startDate,
        endDate,
        period: point.bucket_start, // Use the actual start date for x-axis
        mobile: point.mobile_clicks || 0,
        desktop: point.desktop_clicks || 0,
        other: point.other_clicks || 0,
        total:
          (point.mobile_clicks || 0) +
          (point.desktop_clicks || 0) +
          (point.other_clicks || 0),
      };
    });
  }, [data]);

  // 🔍 DEBUG: Log chart data after transformation
  useEffect(() => {
    console.log("🔍 TimeSeriesChart: Transformed chart data:", {
      chartDataLength: chartData.length,
      currentHour: new Date().getUTCHours(),
      lastChartPoint: chartData[chartData.length - 1],
      interval: selectedInterval,
    });

    // Verify current hour data
    if (chartData.length > 0 && selectedInterval === "hourly") {
      const lastPoint = chartData[chartData.length - 1];
      const currentHour = new Date().getUTCHours();
      const lastPointHour = lastPoint.startDate.getUTCHours();

      if (lastPointHour !== currentHour) {
        console.warn("⚠️ TimeSeriesChart: Last point is NOT current hour!", {
          expected: currentHour,
          got: lastPointHour,
          lastPoint: lastPoint,
        });
      } else {
        console.log(
          "✅ TimeSeriesChart: Last point is current hour with",
          lastPoint.total,
          "clicks",
        );
      }
    }
  }, [chartData, selectedInterval]);

  // Chart configuration
  const chartConfig = {
    mobile: {
      label: "Mobile",
      color: "hsl(var(--chart-5))",
    },
    desktop: {
      label: "Desktop",
      color: "hsl(var(--chart-2))",
    },
    other: {
      label: "Other",
      color: "hsl(var(--chart-3))",
    },
  } satisfies ChartConfig;

  // Get period description for header
  const getPeriodDescription = () => {
    const interval = intervals.find((i) => i.value === selectedInterval);
    return interval?.value || "Recent data";
  };

  // Get footer text
  const getFooterText = () => {
    const descriptions = {
      hourly: "Showing hourly click patterns for the last 24 hours",
      daily: "Showing daily click trends for the last 7 days",
      weekly: "Showing weekly performance over the last 4 weeks",
      monthly: "Showing monthly growth patterns for the last 6 months",
      yearly: "Showing yearly trends and long-term growth",
    };
    const interval = intervals.find((i) => i.value === selectedInterval);
    return (
      descriptions[interval?.value as keyof typeof descriptions] ||
      "Click analytics data over time"
    );
  };

  // Get title for trend indicator
  const getTrendText = () => {
    // Simple trend calculation - in real app, compare with previous period
    if (data.length > 1) {
      const latest = data[data.length - 1]?.total_clicks || 0;
      const previous = data[data.length - 2]?.total_clicks || 0;
      if (latest > previous) {
        const percentage = (((latest - previous) / previous) * 100).toFixed(1);
        return `Trending up by ${percentage}% this period`;
      } else if (latest < previous) {
        const percentage = (((previous - latest) / previous) * 100).toFixed(1);
        return `Trending down by ${percentage}% this period`;
      } else {
        return "Stable traffic this period";
      }
    }
    return "Click analytics data";
  };

  // Format x-axis labels with specific time points from backend
  const formatXAxisLabel = (date: Date, selectedInterval: string) => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Format the date based on the actual interval
    switch (selectedInterval) {
      case "hourly":
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
      case "daily":
        return `${date.getMonth() + 1}/${date.getDate()}`;
      case "weekly":
        return `${monthNames[date.getMonth()]} ${date.getDate()}`;
      case "monthly":
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      case "yearly":
        return `${date.getFullYear()}`;
      default:
        return date.toLocaleDateString();
    }
  };

  // Format tooltip date based on time interval
  const formatTooltipDate = (date: Date, interval: string) => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    switch (interval) {
      case "hourly":
        return date.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

      case "daily":
        return date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        });

      case "weekly":
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

      case "monthly":
        return date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });

      case "yearly":
        const year = date.getFullYear().toString();
        const shortYear = year.slice(-2); // Get last 2 digits
        return `${monthNames[date.getMonth()]} ${shortYear}`;

      default:
        return date.toLocaleDateString();
    }
  };

  return (
    <Card className={className}>
      <CardHeader className={"flex flex-row justify-between gap-2 px-6"}>
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold">{title}</span>
          <span className="text-muted-foreground text-sm">
            {/* {getPeriodDescription()} */}
            {selectedPeriod} on {getPeriodDescription()} basis
          </span>
        </div>
        <button
          className="inline-flex shrink-0 items-center justify-center size-6 rounded-full hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 text-muted-foreground transition-all"
          type="button"
        >
          <EllipsisVertical className="size-4" />
          <span className="sr-only">Menu</span>
        </button>
      </CardHeader>
      <CardContent className="p-0 ml-0 ">
        <ResponsiveContainer width="95%" height={280} className={"h-full"}>
          {/*<ChartContainer config={chartConfig} className="w-full">*/}
          {showMobileDesktop ? (
            <BarChart
              data={chartData}
              margin={{
                left: 8,
                right: 4,
                bottom: 8,
                top: 8,
              }}
            >
              <XAxis
                hide
                dataKey="period"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) =>
                  formatXAxisLabel(new Date(value), selectedInterval)
                }
              />
              <YAxis hide tick={{ fontSize: 12 }} />
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const payloadData = payload[0]?.payload;
                    const startDate = payloadData?.startDate;
                    const endDate = payloadData?.endDate;

                    let formattedDate = "";

                    if (startDate && endDate) {
                      if (selectedInterval === "hourly") {
                        formattedDate = `${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} - ${endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
                      } else {
                        formattedDate = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
                      }
                    } else {
                      const date = new Date(payload[0]?.payload?.timestamp);
                      formattedDate = formatTooltipDate(date, selectedInterval);
                    }

                    const mobileValue = payload[0]?.payload?.mobile || 0;
                    const desktopValue = payload[0]?.payload?.desktop || 0;
                    const otherValue = payload[0]?.payload?.other || 0;
                    const totalValue = mobileValue + desktopValue + otherValue;

                    return (
                      <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-muted bg-muted/90  p-3 shadow-md">
                        <div className="text-xs font-medium">
                          {formattedDate}
                        </div>
                        {payload.map((entry, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2.5 w-2.5 rounded-[2px]"
                                style={{
                                  backgroundColor: entry.color,
                                }}
                              />
                              <span className="text-xs">
                                {entry.dataKey === "mobile"
                                  ? "Mobile"
                                  : entry.dataKey === "desktop"
                                    ? "Desktop"
                                    : "Other"}
                              </span>
                            </div>
                            <div className="font-mono text-xs font-medium">
                              {entry.value}
                            </div>
                          </div>
                        ))}
                        <div className="mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium">
                          Total
                          <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                            {totalValue}
                            <span className="font-normal text-gray-500">
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
              {(() => {
                const bars = [
                  { dataKey: "mobile", fill: "hsl(var(--chart-5))", order: 0 },
                  { dataKey: "desktop", fill: "hsl(var(--chart-2))", order: 1 },
                  { dataKey: "other", fill: "hsl(var(--chart-3))", order: 2 },
                ];

                // Custom shape component for rounded top corners
                const RoundedBar = (props: {
                  dataKey?: any;
                  fill?: any;
                  x?: any;
                  y?: any;
                  width?: any;
                  height?: any;
                  payload?: any;
                }) => {
                  const { fill, x, y, width, height, payload } = props;

                  // Check if this bar is the topmost non-zero bar
                  const values = bars.map((b) => payload[b.dataKey] || 0);
                  let topIndex = -1;
                  for (let i = values.length - 1; i >= 0; i--) {
                    if (values[i] > 0) {
                      topIndex = i;
                      break;
                    }
                  }

                  // Find which bar this is
                  const currentIndex = bars.findIndex(
                    (b) =>
                      payload[b.dataKey] ===
                      (height /
                        (payload.mobile + payload.desktop + payload.other)) *
                        payload[b.dataKey],
                  );
                  const isTopBar = bars.some((b, idx) => {
                    if (payload[b.dataKey] > 0) {
                      // Check if all bars after this one are zero
                      const isTop = bars
                        .slice(idx + 1)
                        .every((bar) => (payload[bar.dataKey] || 0) === 0);
                      return isTop && b.dataKey === props.dataKey;
                    }
                    return false;
                  });

                  const radius = 6;

                  if (isTopBar) {
                    // Draw rounded top corners
                    return (
                      <path
                        d={`
                        M ${x},${y + radius}
                        Q ${x},${y} ${x + radius},${y}
                        L ${x + width - radius},${y}
                        Q ${x + width},${y} ${x + width},${y + radius}
                        L ${x + width},${y + height}
                        L ${x},${y + height}
                        Z
                      `}
                        fill={fill}
                      />
                    );
                  }

                  // Regular rectangle for non-top bars
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={fill}
                    />
                  );
                };

                return bars.map((bar, index) => (
                  <Bar
                    key={bar.dataKey}
                    dataKey={bar.dataKey}
                    stackId="a"
                    fill={bar.fill}
                    strokeWidth={0}
                    strokeOpacity={0}
                    barSize={10}
                    shape={(props: any) => (
                      <RoundedBar {...props} dataKey={bar.dataKey} />
                    )}
                    background={
                      index === 0 ? { className: "fill-muted/40" } : undefined
                    }
                  />
                ));
              })()}
            </BarChart>
          ) : (
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 8,
                right: 4, // Increased to show last data point
                bottom: 8,
                top: 8,
              }}
            >
              {/*<CartesianGrid vertical={false} />*/}
              <XAxis
                hide
                dataKey="period"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) =>
                  formatXAxisLabel(new Date(value), selectedInterval)
                }
              />
              <YAxis hide tick={{ fontSize: 12 }} />
              <Tooltip
                cursor={false}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const payloadData = payload[0]?.payload;
                    const startDate = payloadData?.startDate;
                    const endDate = payloadData?.endDate;

                    let formattedDate = "";

                    // FIX: Use proper date formatting for all intervals including hourly
                    if (startDate && endDate) {
                      // For hourly intervals, show time range
                      if (selectedInterval === "hourly") {
                        formattedDate = `${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} - ${endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
                      } else {
                        // For other intervals, use existing format
                        formattedDate = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
                      }
                    } else {
                      // Fallback for the old format
                      const date = new Date(payload[0]?.payload?.timestamp);
                      formattedDate = formatTooltipDate(date, selectedInterval);
                    }

                    // Calculate total from mobile + desktop + other
                    const mobileValue = payload[0]?.payload?.mobile || 0;
                    const desktopValue = payload[0]?.payload?.desktop || 0;
                    const otherValue = payload[0]?.payload?.other || 0;
                    const totalValue = mobileValue + desktopValue + otherValue;

                    return (
                      <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md">
                        <div className="text-xs font-medium">
                          {formattedDate}
                        </div>
                        {payload.map((entry: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2.5 w-2.5 rounded-[2px]"
                                style={{
                                  backgroundColor: entry.color,
                                }}
                              />
                              <span className="text-xs">
                                {entry.dataKey === "mobile"
                                  ? "Mobile"
                                  : entry.dataKey === "desktop"
                                    ? "Desktop"
                                    : "Other"}
                              </span>
                            </div>
                            <div className="font-mono text-xs font-medium">
                              {entry.value}
                            </div>
                          </div>
                        ))}
                        <div className="text-foreground mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium">
                          Total
                          <div className="gap-1 text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                            {totalValue}
                            <span className="text-muted-foreground font-normal">
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
              <Line
                dataKey="total"
                type="monotoneX"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 6,
                  style: {
                    transition: "all 1s ease-in-out",
                    fill: "#1e1e20",
                    stroke: "white",
                    strokeWidth: 1,
                  },
                }}
              />
            </LineChart>
          )}
          {/* </ChartContainer>*/}
        </ResponsiveContainer>
      </CardContent>
      <CardFooter className="pt-4 flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {getTrendText()} <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          {getFooterText()}
        </div>
      </CardFooter>
    </Card>
  );
}
