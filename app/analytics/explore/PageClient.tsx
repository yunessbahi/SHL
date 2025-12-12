//clientpage
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TooltipProvider as GlobalTooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/global-tooltip";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ExploreDataTable from "@/components/analytics/ExploreDataTable";
import MapCompact from "@/components/analytics/mapCompact";
import NetworkViz from "@/components/analytics/NetworkViz";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  analyticsAPI,
  AnalyticsFilters,
  getDateRange,
} from "@/lib/analytics-api";
import {
  ChartNoAxesColumn,
  ChartNoAxesCombined,
  Globe,
  Minus,
  Plus,
  Table2,
} from "lucide-react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ReferenceDot,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
//import { SafeUser } from "@/lib/getSafeSession";
import { type Option } from "@/components/ui/multi-select";
import { toast } from "sonner";

import { AnalyticsFiltersSheet } from "./AnalyticsFiltersSheet";

const GroupingCountInput = ({
  value,
  onChange,
  max,
  warning,
}: {
  value: number;
  onChange: (value: number) => void;
  max: number;
  warning: string | null;
}) => {
  const handleIncrement = () => {
    const newValue = Math.min(value + 1, max);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - 1, 1);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <div className="w-full">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .no-spinner::-webkit-outer-spin-button,
          .no-spinner::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          .no-spinner {
            -moz-appearance: textfield;
          }
        `,
        }}
      />
      <div className="relative m-0! inline-flex h-9 gap-2 items-center overflow-hidden rounded-md border bg-transparent text-base shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-0 focus-within:ring-ring/50">
        <Label className="text-xs text-muted-foreground/50 pl-2">Groups</Label>
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={1}
          max={max}
          className="no-spinner w-full px-2 py-0 text-left tabular-nums outline-none bg-transparent pr-14"
        />
        <Button
          onClick={handleDecrement}
          disabled={value <= 1}
          className="absolute right-7 border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex h-4 w-4 p-2 items-center justify-center rounded-sm border text-xs disabled:pointer-events-none disabled:opacity-50"
        >
          <Minus className="size-3" />
          <span className="sr-only">Decrement</span>
        </Button>
        <Button
          onClick={handleIncrement}
          disabled={value >= max}
          className="absolute right-1 border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground flex h-4 w-4 p-2 items-center justify-center rounded-sm border text-xs disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="size-3" />
          <span className="sr-only">Increment</span>
        </Button>
      </div>
      {warning && (
        <p
          className={`text-xs ${warning.includes("available") ? "text-orange-500" : "text-muted-foreground"}`}
        >
          {warning}
        </p>
      )}
    </div>
  );
};

interface ExplorePageClientProps {}

interface ExploreData {
  data: Array<Record<string, any>>;
  total_count: number;
  filters_applied: AnalyticsFilters;
  metrics_requested: string[];
  dimensions_requested: string[];
  available_dimensions?: string[];
}

const METRICS: Option[] = [
  { value: "clicks", label: "Clicks" },
  { value: "unique_visitors", label: "Unique Visitors" },
];

const DIMENSIONS: Option[] = [
  { value: "device_type", label: "Device" },
  { value: "browser_name", label: "Browser" },
  { value: "country", label: "Country" },
  { value: "region", label: "Region" },
  { value: "city", label: "City" },
  { value: "ref_source", label: "Referral Source" },
  { value: "ref_type", label: "Referral Type" },
  { value: "campaign", label: "Campaign (CONTEXT)" },
  { value: "link", label: "Link (CONTEXT)" },
  { value: "group", label: "Group (CONTEXT)" },
  { value: "tag", label: "Tag (CONTEXT)" },
];

const TIME_PERIODS = [
  { value: "1d", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "365d", label: "Last Year" },
];

const COLORS = [
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

/* Helper: map flow section ids to your Accordion item values */
const mapFlowSectionToAccordion = (sectionId: string) => {
  // sectionId is what AnalyticsFiltersFlow will pass to onNodeClick
  switch (sectionId) {
    case "period":
      return "time-period";
    case "metrics":
      return "metrics";
    case "dimensions":
      return "dimensions";
    case "context":
    case "context_dimension":
      return "context-filters";
    case "drilldown":
    case "drilldown_dimension":
      return "drilldown-filters";
    default:
      // if it's a dimension key like "campaign" or "device_type"
      // open context or drilldown depending on whether that dim is context-tagged:
      if (
        ["campaign", "link", "group", "tag"].includes(sectionId) ||
        sectionId.startsWith("utm_")
      ) {
        return "context-filters";
      }
      return "drilldown-filters";
  }
};

export default function ExplorePageClient({}: ExplorePageClientProps) {
  const [exploreData, setExploreData] = useState<ExploreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<Option[]>([
    { value: "clicks", label: "Clicks" },
    { value: "unique_visitors", label: "Unique Visitors" },
  ]);
  const [selectedDimensions, setSelectedDimensions] = useState<Option[]>([
    { value: "device_type", label: "Device" },
    { value: "browser_name", label: "Browser" },
    { value: "campaign", label: "Campaign" },
  ]);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [availableDimensions, setAvailableDimensions] =
    useState<Option[]>(DIMENSIONS);
  const [timeseriesData, setTimeseriesData] = useState<any[]>([]);
  const [groupingCount, setGroupingCount] = useState(5);
  const [groupingWarning, setGroupingWarning] = useState<string | null>(null);
  const [selectedGrouping, setSelectedGrouping] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | undefined>(
    undefined,
  );
  const isRequestInProgress = useRef(false);

  // Note: campaigns and links are now sourced from filterOptions for single source of truth

  // Dynamic filter options based on selected dimensions
  const filterOptions = useMemo(() => {
    if (!exploreData?.data) return {};
    console.log("exploreData: ", exploreData);
    // Base filtered data (exclude invalid combinations)
    const baseFiltered = exploreData.data.filter((item) => {
      return (
        item.coalesce &&
        !item.coalesce.includes("Unknown") &&
        !item.coalesce.includes("No Campaign")
      );
    });

    // Filtered by dimensions + context filters (for advanced options)
    const contextFiltered = baseFiltered.filter((item) => {
      // Check campaign filter
      if (filters.campaign !== undefined && item.campaign !== filters.campaign)
        return false;

      // Check link filter
      if (filters.link !== undefined && item.link !== filters.link)
        return false;

      // Check group filter
      if (filters.group !== undefined && item.group !== filters.group)
        return false;

      // Check tag filter
      if (filters.tag !== undefined && item.tag !== filters.tag) return false;

      // Check UTM filters
      for (const key in filters) {
        if (
          key.startsWith("utm_") &&
          filters[key] !== undefined &&
          item[key] !== filters[key]
        ) {
          return false;
        }
      }

      return true;
    });

    const newFilterOptions: Record<string, string[]> = {};

    // Compute options for all selected dimensions from contextFiltered
    selectedDimensions.forEach((dimension) => {
      const values = new Set<string>();
      contextFiltered.forEach((item) => {
        const value = item[dimension.value];
        if (value !== undefined && value !== null && value !== "") {
          values.add(String(value));
        }
      });
      newFilterOptions[dimension.value] = Array.from(values).sort();
    });

    // Also compute options for advanced dimensions that are not selected but shown in filters
    DIMENSIONS.forEach((dim) => {
      if (!selectedDimensions.some((d) => d.value === dim.value)) {
        const values = new Set<string>();
        contextFiltered.forEach((item) => {
          const value = item[dim.value];
          if (value !== undefined && value !== null && value !== "") {
            values.add(String(value));
          }
        });
        newFilterOptions[dim.value] = Array.from(values).sort();
      }
    });

    // Also add UTM dimensions to filter options (already handled above)
    if (exploreData.available_dimensions) {
      exploreData.available_dimensions.forEach((utmDim) => {
        if (!newFilterOptions[utmDim]) {
          const values = new Set<string>();
          baseFiltered.forEach((item) => {
            const value = item[utmDim];
            if (value !== undefined && value !== null && value !== "") {
              values.add(String(value));
            }
          });
          newFilterOptions[utmDim] = Array.from(values).sort();
        }
      });
    }

    return newFilterOptions;
  }, [exploreData, selectedDimensions, filters]);

  const maxGroupings = useMemo(() => {
    if (!timeseriesData.length) return 5;

    // Determine primary metric
    const primaryMetric = selectedMetrics.some((m) => m.value === "clicks")
      ? "clicks"
      : "unique_visitors";

    const filteredTimeseriesData = timeseriesData.filter((item) => {
      if (
        !item.coalesce ||
        item.coalesce.includes("Unknown") ||
        item.coalesce.includes("No Campaign")
      )
        return false;

      // Check campaign filter
      if (filters.campaign !== undefined && item.campaign !== filters.campaign)
        return false;

      // Check link filter
      if (filters.link !== undefined && item.link !== filters.link)
        return false;

      // Check group filter
      if (filters.group !== undefined && item.group !== filters.group)
        return false;

      // Check tag filter
      if (filters.tag !== undefined && item.tag !== filters.tag) return false;

      // Check other filters
      for (const key in filters) {
        if (
          key !== "campaign" &&
          key !== "link" &&
          key !== "group" &&
          key !== "tag" &&
          filters[key] !== undefined &&
          item[key] !== filters[key]
        ) {
          return false;
        }
      }
      return true;
    });

    if (!filteredTimeseriesData.length) return 5;

    const groupedData = filteredTimeseriesData.reduce(
      (acc: Record<string, any[]>, item) => {
        const key = item.coalesce || "Unknown";
        if (!acc[key]) acc[key] = [];
        acc[key].push({
          ...item,
          ts_bucket: new Date(item.ts_bucket).getTime(),
        });
        return acc;
      },
      {},
    );

    const topGroupings = Object.entries(groupedData)
      .map(([key, data]) => ({
        key,
        data: data.sort((a, b) => a.ts_bucket - b.ts_bucket),
        totalMetric: data.reduce(
          (sum, item) => sum + (item[primaryMetric] || 0),
          0,
        ),
      }))
      .sort((a, b) => b.totalMetric - a.totalMetric);

    return topGroupings.length;
  }, [timeseriesData, filters, selectedMetrics]);

  const fetchExploreData = async () => {
    if (isRequestInProgress.current) return;
    setLoading(true);
    isRequestInProgress.current = true;
    try {
      // Set date range based on selected period
      const periodFilters = { ...filters };
      if (selectedPeriod) {
        const { start_date, end_date } = getDateRange(selectedPeriod);
        periodFilters.start_date = start_date.toISOString();
        periodFilters.end_date = end_date.toISOString();
      }

      // Convert Option arrays to string arrays for API call
      const metricsStrings = selectedMetrics.map((m) => m.value);
      const dimensionsStrings = selectedDimensions.map((d) => d.value);

      // Always use the API with all selected dimensions - it should handle cross-filtering
      const data = await analyticsAPI.exploreAnalytics(
        { ...periodFilters, include_timeseries: true, interval: "day" },
        metricsStrings,
        dimensionsStrings,
      );
      setExploreData(data);
      setTimeseriesData(data.timeseries_data || []);
    } catch (error) {
      console.error("Failed to fetch explore data:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
      isRequestInProgress.current = false;
    }
  };

  // Update available dimensions when explore data changes
  useEffect(() => {
    if (
      exploreData?.available_dimensions &&
      exploreData.available_dimensions.length > 0
    ) {
      const utmOptions: Option[] = exploreData.available_dimensions.map(
        (dim) => ({
          value: dim,
          label:
            dim
              .replace(/^utm_/, "")
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()) + " (UTM)",
        }),
      );
      setAvailableDimensions([...DIMENSIONS, ...utmOptions]);
    } else {
      setAvailableDimensions(DIMENSIONS);
    }
  }, [exploreData]);

  // Clean up filters when dimensions change
  useEffect(() => {
    const selectedDimValues = selectedDimensions.map((d) => d.value);
    const newFilters = { ...filters };

    // Remove filters for dimensions that are no longer selected
    Object.keys(newFilters).forEach((key) => {
      // Keep date and timeseries filters
      if (
        key === "start_date" ||
        key === "end_date" ||
        key === "include_timeseries" ||
        key === "interval"
      ) {
        return;
      }
      // Remove if dimension is not selected
      if (!selectedDimValues.includes(key)) {
        delete newFilters[key];
      }
    });

    setFilters(newFilters);
  }, [selectedDimensions]);

  useEffect(() => {
    if (selectedDimensions.length === 0) return;
    fetchExploreData();
  }, [selectedMetrics, selectedDimensions, selectedPeriod, filters]);

  const handleGroupingChange = (value: number) => {
    if (value > maxGroupings) {
      setGroupingCount(maxGroupings);
      setGroupingWarning(`${maxGroupings} groupings available`);
    } else {
      setGroupingCount(value);
      setGroupingWarning(`${value} out of ${maxGroupings}`);
    }
  };

  useEffect(() => {
    if (maxGroupings > 0) {
      if (groupingCount > maxGroupings) {
        setGroupingCount(maxGroupings);
      }
      setGroupingWarning(
        `${Math.min(groupingCount, maxGroupings)} out of ${maxGroupings}`,
      );
    }
  }, [maxGroupings, groupingCount]);

  const chartData = useMemo(() => {
    if (!exploreData?.data) return [];

    // Apply client-side filtering
    const filteredData = exploreData.data.filter((item) => {
      if (
        !item.coalesce ||
        item.coalesce.includes("Unknown") ||
        item.coalesce.includes("No Campaign")
      )
        return false;

      // Check campaign filter
      if (filters.campaign !== undefined && item.campaign !== filters.campaign)
        return false;

      // Check link filter
      if (filters.link !== undefined && item.link !== filters.link)
        return false;

      // Check group filter
      if (filters.group !== undefined && item.group !== filters.group)
        return false;

      // Check tag filter
      if (filters.tag !== undefined && item.tag !== filters.tag) return false;

      // Check other filters
      for (const key in filters) {
        if (
          key !== "campaign" &&
          key !== "link" &&
          key !== "group" &&
          key !== "tag" &&
          filters[key] !== undefined &&
          item[key] !== filters[key]
        ) {
          return false;
        }
      }
      return true;
    });

    return filteredData.map((item) => {
      // Use the coalesce variable from the data as the name
      const coalesceValue = item.coalesce;

      return {
        ...item,
        name: coalesceValue,
      };
    });
  }, [exploreData, filters]);

  const mapData = useMemo(() => {
    if (
      !selectedDimensions.some((d) => d.value === "country") ||
      !exploreData?.data
    )
      return undefined;

    // Determine primary metric: use 'clicks' if present, otherwise 'unique_visitors'
    const primaryMetric = selectedMetrics.some((m) => m.value === "clicks")
      ? "clicks"
      : "unique_visitors";

    // Apply client-side filtering
    const filteredData = exploreData.data.filter((item: any) => {
      if (
        !item.coalesce ||
        item.coalesce.includes("Unknown") ||
        item.coalesce.includes("No Campaign") ||
        !item.country ||
        item.country.length !== 2
      )
        return false;

      // Check campaign filter
      if (filters.campaign !== undefined && item.campaign !== filters.campaign)
        return false;

      // Check link filter
      if (filters.link !== undefined && item.link !== filters.link)
        return false;

      // Check group filter
      if (filters.group !== undefined && item.group !== filters.group)
        return false;

      // Check tag filter
      if (filters.tag !== undefined && item.tag !== filters.tag) return false;

      // Check other filters
      for (const key in filters) {
        if (
          key !== "campaign" &&
          key !== "link" &&
          key !== "group" &&
          key !== "tag" &&
          filters[key] !== undefined &&
          item[key] !== filters[key]
        ) {
          return false;
        }
      }
      return true;
    });

    // Aggregate by primary metric (clicks or unique_visitors)
    const countrySums = filteredData.reduce(
      (acc: Record<string, number>, item: any) => {
        const country = item.country;
        const value = item[primaryMetric] || 0;
        acc[country] = (acc[country] || 0) + value;
        return acc;
      },
      {},
    );

    return Object.entries(countrySums).map(([country, value]) => ({
      country,
      value,
    }));
  }, [exploreData, selectedDimensions, filters]);

  const renderChart = () => {
    if (!chartData.length) return null;

    // Custom tooltip to match the screenshot style
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        // Get unique metrics (since we render Area + Line for each metric)
        const uniquePayload = payload.filter(
          (item: any, index: number, self: any[]) =>
            index === self.findIndex((t) => t.dataKey === item.dataKey),
        );

        return (
          <div
            style={{
              backgroundColor: "rgba(30, 30, 30, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "12px 16px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            }}
          >
            <p
              style={{
                color: "#fff",
                margin: "0 0 8px 0",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {label}
            </p>
            {uniquePayload.map((entry: any, index: number) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "4px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: entry.color || entry.stroke,
                    borderRadius: "2px",
                  }}
                />
                <span style={{ color: "#fff", fontSize: "13px" }}>
                  {entry.name}: <strong>{entry.value}</strong>
                </span>
              </div>
            ))}
          </div>
        );
      }
      return null;
    };

    return (
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 5, left: 0, bottom: 20 }}
        >
          <CartesianGrid vertical stroke="transparent" />
          <XAxis dataKey="name" hide={true} />
          <YAxis
            stroke="var(--secondary)"
            className="fill-muted-foreground text-xs"
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          {selectedMetrics.map((metric, index) => {
            const color = COLORS[index % COLORS.length];
            return (
              <React.Fragment key={metric.value}>
                {/* Stacked bar */}
                <Bar
                  dataKey={metric.value}
                  fill={color}
                  strokeWidth={0}
                  radius={
                    index === selectedMetrics.length - 1
                      ? [8, 8, 0, 0]
                      : [0, 0, 0, 0]
                  }
                  strokeOpacity={0}
                  barSize={10}
                  background={
                    index === 0 ? { className: "fill-muted" } : undefined
                  }
                  onClick={(data) =>
                    setSelectedGrouping(
                      data.name === selectedGrouping ? null : data.name,
                    )
                  }
                  style={{ cursor: "pointer" }}
                  stackId="stack"
                >
                  {chartData.map((entry, entryIndex) => (
                    <Cell
                      key={`cell-${metric.value}-${entryIndex}`}
                      fillOpacity={
                        selectedGrouping
                          ? entry.name === selectedGrouping
                            ? 1
                            : 0.3
                          : 1
                      }
                    />
                  ))}
                </Bar>
                {/* Full opacity stepped line - show in legend */}
                <Line
                  type={"monotone"}
                  dataKey={metric.value}
                  name={metric.label || metric.value}
                  stroke={color}
                  strokeOpacity={0}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                  className="z-99990"
                />
              </React.Fragment>
            );
          })}
          {/* Areas rendered separately to overlay the bars */}
          {selectedMetrics.map((metric, index) => {
            const color = COLORS[index % COLORS.length];
            return (
              <Area
                key={`area-${metric.value}`}
                type="monotone"
                dataKey={metric.value}
                name={metric.label || metric.value}
                fill={color}
                fillOpacity={0.25}
                stroke="none"
                legendType="none"
                style={{ pointerEvents: "none" }}
                stackId="areaStack"
              />
            );
          })}
          {selectedGrouping && (
            <ReferenceDot
              x={chartData.findIndex((d) => d.name === selectedGrouping)}
              y={0}
              r={6}
              fill="#ef4444"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  const renderTimeseriesChart = () => {
    if (!timeseriesData.length) return null;

    // Determine primary metric: use 'clicks' if present, otherwise 'unique_visitors'
    const primaryMetric = selectedMetrics.some((m) => m.value === "clicks")
      ? "clicks"
      : "unique_visitors";
    const primaryMetricLabel =
      primaryMetric === "clicks" ? "Clicks" : "Unique Visitors";

    // Apply client-side filtering to timeseries data (same as main chart)
    const filteredTimeseriesData = timeseriesData.filter((item) => {
      if (
        !item.coalesce ||
        item.coalesce.includes("Unknown") ||
        item.coalesce.includes("No Campaign")
      )
        return false;

      // Check campaign filter
      if (filters.campaign !== undefined && item.campaign !== filters.campaign)
        return false;

      // Check link filter
      if (filters.link !== undefined && item.link !== filters.link)
        return false;

      // Check group filter
      if (filters.group !== undefined && item.group !== filters.group)
        return false;

      // Check tag filter
      if (filters.tag !== undefined && item.tag !== filters.tag) return false;

      // Check other filters
      for (const key in filters) {
        if (
          key !== "campaign" &&
          key !== "link" &&
          key !== "group" &&
          key !== "tag" &&
          filters[key] !== undefined &&
          item[key] !== filters[key]
        ) {
          return false;
        }
      }
      return true;
    });

    if (!filteredTimeseriesData.length) return null;

    // Group timeseries data by dimension combination (coalesce)
    const groupedData = filteredTimeseriesData.reduce(
      (acc: Record<string, any[]>, item) => {
        const key = item.coalesce || "Unknown";
        if (!acc[key]) acc[key] = [];
        acc[key].push({
          ...item,
          ts_bucket: new Date(item.ts_bucket).getTime(), // Convert to timestamp for sorting
        });
        return acc;
      },
      {},
    );

    // Get top groupings by total primary metric
    const topGroupings = Object.entries(groupedData)
      .map(([key, data]) => ({
        key,
        data: data.sort((a, b) => a.ts_bucket - b.ts_bucket), // Sort by time
        totalMetric: data.reduce(
          (sum, item) => sum + (item[primaryMetric] || 0),
          0,
        ),
      }))
      .sort((a, b) => b.totalMetric - a.totalMetric)
      .slice(0, groupingCount);

    // Prepare data for Recharts (pivot to have time as x-axis)
    const timeBuckets = new Set<number>();
    topGroupings.forEach((grouping) => {
      grouping.data.forEach((item) => timeBuckets.add(item.ts_bucket));
    });

    const sortedTimeBuckets = Array.from(timeBuckets).sort((a, b) => a - b);
    const minTime = Math.min(...sortedTimeBuckets);
    const maxTime = Math.max(...sortedTimeBuckets);

    // Generate all days between min and max to ensure continuous data
    const allTimeBuckets: number[] = [];
    const dayMs = 24 * 60 * 60 * 1000; // milliseconds in a day
    for (let time = minTime; time <= maxTime; time += dayMs) {
      allTimeBuckets.push(time);
    }

    // Track last cumulative values for each grouping
    const lastValues: Record<string, number> = {};

    const chartData = allTimeBuckets.map((timestamp) => {
      const dataPoint: any = {
        time: timestamp,
      };

      topGroupings.forEach((grouping) => {
        const item = grouping.data.find((d) => d.ts_bucket === timestamp);
        const key = `${grouping.key}_${primaryMetric}`;

        if (primaryMetric === "unique_visitors") {
          // For cumulative unique visitors, carry forward the last value
          if (item) {
            lastValues[key] = item[primaryMetric];
            dataPoint[key] = item[primaryMetric];
          } else {
            dataPoint[key] = lastValues[key] || 0;
          }
        } else {
          // For clicks, use 0 when no data
          dataPoint[key] = item?.[primaryMetric] || 0;
        }
      });

      return dataPoint;
    });

    const formatTime = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div
            style={{
              backgroundColor: "rgba(30, 30, 30, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "12px 16px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            }}
          >
            <p
              style={{
                color: "#fff",
                margin: "0 0 8px 0",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              {formatTime(label)}
            </p>
            {payload.map((entry: any, index: number) => {
              const isSelected =
                selectedGrouping && entry.name.startsWith(selectedGrouping);
              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "4px",
                    opacity: selectedGrouping ? (isSelected ? 1 : 0.4) : 1,
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      backgroundColor: entry.color,
                      borderRadius: "2px",
                    }}
                  />
                  <span
                    style={{
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: isSelected ? "bold" : "normal",
                    }}
                  >
                    {entry.name}: <strong>{entry.value}</strong>
                  </span>
                </div>
              );
            })}
          </div>
        );
      }
      return null;
    };

    console.log("chartData: ", chartData);

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 6, left: 20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="time"
            type="number"
            domain={[minTime, maxTime]}
            scale="time"
            //tickFormatter={function cpe(){}}
            tickFormatter={(tick) => formatTime(tick)}
            stroke="var(--muted-foreground)"
            fontSize={12}
            className="fill-muted-foreground"
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={12}
            width={6}
            className="fill-muted-foreground"
          />
          <RechartsTooltip content={<CustomTooltip />} />
          {/* <Legend /> */}
          {topGroupings.map((grouping, index) => (
            <Line
              key={`${grouping.key}_${primaryMetric}`}
              type={"linear"}
              dataKey={`${grouping.key}_${primaryMetric}`}
              name={`${grouping.key} - ${primaryMetricLabel}`}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={grouping.key === selectedGrouping ? 4 : 2}
              strokeOpacity={
                selectedGrouping
                  ? grouping.key === selectedGrouping
                    ? 1
                    : 0.3
                  : 1
              }
              dot={{ r: 4, className: "fill-card" }}
              activeDot={{ r: grouping.key === selectedGrouping ? 8 : 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderDataTable = () => {
    if (!chartData.length) return null;

    return <ExploreDataTable data={chartData as any[]} loading={loading} />;
  };

  return (
    <div className="flex flex-row h-full gap-4">
      {/* Controls Section */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Results Section */}
        <Tabs defaultValue="chart" className="space-y-4 flex-1 overflow-auto">
          <TabsList>
            <TabsTrigger value="chart">Chart View</TabsTrigger>
            <TabsTrigger value="table">Data Table</TabsTrigger>
            <TabsTrigger value="map">Geographic View</TabsTrigger>
            <TabsTrigger value="network">Network View</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-4">
            <div
              //className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              className="flex flex-row gap-4 w-full"
            >
              <Card className="w-[50%]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartNoAxesColumn className="w-5 h-5" />
                    Analytics Chart
                    {selectedDimensions.length > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        Multiple Dimensions Selected
                      </Badge>
                    )}
                  </CardTitle>

                  {selectedDimensions.length > 1 && (
                    <div className="text-sm font-normal text-muted-foreground">
                      Showing combined dimension values from:
                      <div className="flex flex-wrap items-center gap-1 text-xs font-mono font-normal mt-1 max-w-full overflow-hidden">
                        {selectedDimensions.slice(0, 5).map((d, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && (
                              <span className="text-sm">&#183;</span>
                            )}
                            <span className="truncate max-w-[120px] inline-block">
                              {d.label}
                            </span>
                          </React.Fragment>
                        ))}
                        {selectedDimensions.length > 5 && (
                          <GlobalTooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="text-xs px-2 py-0.5 h-5 ml-1 cursor-help hover:bg-primary hover:text-primary-foreground rounded">
                                  +{selectedDimensions.length - 5}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  <div className="font-semibold mb-2 pb-1">
                                    Additional Dimensions
                                  </div>
                                  <div className="space-y-1">
                                    {selectedDimensions
                                      .slice(5)
                                      .map((d, index) => (
                                        <div
                                          key={index}
                                          className="truncate border-t px-2 bg-muted border-muted-foreground/40 pt-1"
                                        >
                                          {d.label}
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </GlobalTooltipProvider>
                        )}
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      <Spinner className="size-4" />
                      <span className="ml-2 text-sm">Loading</span>
                    </div>
                  ) : (
                    renderChart()
                  )}
                </CardContent>
              </Card>

              <Card className="w-[50%]">
                <CardHeader className="flex flex-row justify-between itmens-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ChartNoAxesCombined className="w-5 h-5" />
                      Timeseries Trends
                      <Badge variant="secondary" className="text-xs">
                        Top {groupingCount} Groupings
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Trends for the top performing dimension combinations
                    </p>
                  </div>
                  <div className="m-0!">
                    <GroupingCountInput
                      value={groupingCount}
                      onChange={handleGroupingChange}
                      max={maxGroupings}
                      warning={groupingWarning}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      <Spinner className="size-4" />
                      <span className="ml-2 text-sm">Loading</span>
                    </div>
                  ) : (
                    renderTimeseriesChart()
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-row gap-4 w-full">
              <Card className="w-[50%] p-2 bg-secondary/20 dark:bg-teal-900/5">
                {loading ? (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <Spinner className="size-4" />
                    <span className="ml-2 text-sm">Loading</span>
                  </div>
                ) : (
                  <div className="h-full">{renderDataTable()}</div>
                )}
              </Card>
              <Card className="w-[50%] h-auto items-center justify-center content-center">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 tracking-tight">
                    <Globe className="w-5 h-5" />
                    Geographic Distribution
                  </CardTitle>
                  <span className="text-sm font-normal text-muted-foreground">
                    Showing combined dimension values from
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Showing combined dimension values from
                  </span>
                </CardHeader>
                <CardContent>
                  <MapCompact size={"lg"} data={mapData} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="table" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table2 className="w-5 h-5" />
                  Raw Data
                </CardTitle>
              </CardHeader>
              <CardContent></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Geographic Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* <MapCompact size="responsive" data={mapData} /> */}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <NetworkViz
              data={chartData}
              dimensions={selectedDimensions.map((d) => d.value)}
              className="h-auto"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Sidebar Trigger - Full Height */}
      <div className="h-auto">
        <AnalyticsFiltersSheet
          filters={filters}
          setFilters={setFilters}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          selectedMetrics={selectedMetrics}
          setSelectedMetrics={setSelectedMetrics}
          selectedDimensions={selectedDimensions}
          setSelectedDimensions={setSelectedDimensions}
          availableDimensions={availableDimensions}
          filterOptions={filterOptions}
          exploreData={exploreData}
          TIME_PERIODS={TIME_PERIODS}
          METRICS={METRICS}
          DIMENSIONS={DIMENSIONS}
        />
      </div>
    </div>
  );
}
