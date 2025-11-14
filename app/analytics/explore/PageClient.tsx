"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  Globe,
  Smartphone,
  Monitor,
  Chrome,
  Users,
  Target,
  Zap,
  X,
  Plus,
  Minus,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import {
  analyticsAPI,
  AnalyticsFilters,
  formatNumber,
  formatPercentage,
  getDateRange,
} from "@/lib/analytics-api";
import MapCompact from "@/components/analytics/mapCompact";
import { SafeUser } from "@/lib/getSafeSession";
import { toast } from "sonner";
import MultipleSelector, { type Option } from "@/components/ui/multi-select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ExplorePageClientProps {
  user: SafeUser;
}

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
  { value: "device_type", label: "Device (Mobile/Desktop)" },
  { value: "browser_name", label: "Browser" },
  { value: "country", label: "Country" },
  { value: "region", label: "Region" },
  { value: "city", label: "City" },
  { value: "ref_source", label: "Referral Source" },
  { value: "ref_type", label: "Referral Type" },
  { value: "campaign", label: "Campaign" },
  { value: "link", label: "Link" },
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

export default function ExplorePageClient({ user }: ExplorePageClientProps) {
  const [exploreData, setExploreData] = useState<ExploreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<Option[]>([
    { value: "clicks", label: "Clicks" },
    { value: "unique_visitors", label: "Unique Visitors" },
  ]);
  const [selectedDimensions, setSelectedDimensions] = useState<Option[]>([
    { value: "device_type", label: "Device (Mobile/Desktop)" },
    { value: "browser_name", label: "Browser" },
    { value: "campaign", label: "Campaign" },
  ]);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [availableDimensions, setAvailableDimensions] =
    useState<Option[]>(DIMENSIONS);

  // Note: campaigns and links are now sourced from filterOptions for single source of truth

  // Dynamic filter options based on selected dimensions
  const filterOptions = useMemo(() => {
    if (!exploreData?.data) return {};

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

  const fetchExploreData = async () => {
    setLoading(true);
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
        periodFilters,
        metricsStrings,
        dimensionsStrings,
      );
      setExploreData(data);
    } catch (error) {
      console.error("Failed to fetch explore data:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchExploreData();
  }, [selectedMetrics, selectedDimensions, selectedPeriod, filters]);

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

      // Check other filters
      for (const key in filters) {
        if (
          key !== "campaign" &&
          key !== "link" &&
          filters[key] !== undefined &&
          item[key] !== filters[key]
        ) {
          return false;
        }
      }
      return true;
    });

    return filteredData.map((item, index) => {
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

      // Check other filters
      for (const key in filters) {
        if (
          key !== "campaign" &&
          key !== "link" &&
          filters[key] !== undefined &&
          item[key] !== filters[key]
        ) {
          return false;
        }
      }
      return true;
    });

    // Aggregate clicks by country
    const countrySums = filteredData.reduce(
      (acc: Record<string, number>, item: any) => {
        const country = item.country;
        const clicks = item.clicks || 0;
        acc[country] = (acc[country] || 0) + clicks;
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
      <ResponsiveContainer width="100%" height={400}>
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
          <Tooltip content={<CustomTooltip />} />
          {selectedMetrics.map((metric, index) => {
            const color = COLORS[index % COLORS.length];
            return (
              <React.Fragment key={metric.value}>
                {/* Low opacity area background - hide from legend */}
                <Bar
                  dataKey={metric.value}
                  fill={color}
                  //fillOpacity={0.20}
                  //stroke={color}
                  strokeWidth={0}
                  radius={[8, 8, 0, 0]}
                  strokeOpacity={0}
                  barSize={"100%"}
                  background={{ className: "fill-muted/40" }}
                />
                <Area
                  type="monotone"
                  dataKey={metric.value}
                  name={metric.label || metric.value}
                  fill={color}
                  fillOpacity={0.25}
                  stroke="none"
                  legendType="none"
                />
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
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  const renderDataTable = () => {
    if (!exploreData?.data?.length) return null;

    // Filter out rows with empty coalesce values and apply client-side filters
    const filteredData = exploreData.data.filter((row) => {
      if (
        !row.coalesce ||
        row.coalesce.includes("Unknown") ||
        row.coalesce.includes("No Campaign")
      )
        return false;

      // Check campaign filter
      if (filters.campaign !== undefined && row.campaign !== filters.campaign)
        return false;

      // Check link filter
      if (filters.link !== undefined && row.link !== filters.link) return false;

      // Check other filters
      for (const key in filters) {
        if (
          key !== "campaign" &&
          key !== "link" &&
          filters[key] !== undefined &&
          row[key] !== filters[key]
        ) {
          return false;
        }
      }
      return true;
    });

    if (!filteredData.length) return null;

    const hasRequiredMetrics =
      selectedMetrics.some((m) => m.value === "clicks") &&
      selectedMetrics.some((m) => m.value === "unique_visitors");
    const calculatedColumns = hasRequiredMetrics
      ? ["cpuv", "repeat_click_rate"]
      : [];
    const columns = [
      "coalesce",
      ...selectedMetrics.map((m) => m.value),
      ...calculatedColumns,
    ];

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col}
                  className="border border-border px-4 py-2 text-left font-medium"
                >
                  {col === "coalesce"
                    ? "Dimension Value"
                    : col === "cpuv"
                      ? "Clicks per Unique Visitor"
                      : col === "repeat_click_rate"
                        ? "Repeat Click Rate"
                        : col
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <tr key={index} className="hover:bg-muted/30">
                {columns.map((col) => (
                  <td key={col} className="border border-border px-4 py-2">
                    {col === "cpuv" ? (
                      row.unique_visitors && row.unique_visitors !== 0 ? (
                        formatNumber(row.clicks / row.unique_visitors)
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )
                    ) : col === "repeat_click_rate" ? (
                      row.unique_visitors &&
                      row.unique_visitors !== 0 &&
                      row.clicks &&
                      row.clicks !== 0 ? (
                        formatPercentage(
                          (row.clicks - (row.unique_visitors || 0)) /
                            row.clicks,
                        )
                      ) : (
                        <span className="text-muted-foreground/30">—</span>
                      )
                    ) : typeof row[col] === "number" ? (
                      formatNumber(row[col])
                    ) : (
                      row[col]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-6 gap-4 ">
      {/* Controls Section */}

      <div className="col-span-4 h-full flex flex-col gap-4">
        {/* Results Section */}
        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList>
            <TabsTrigger value="chart">Chart View</TabsTrigger>
            <TabsTrigger value="table">Data Table</TabsTrigger>
            <TabsTrigger value="map">Geographic View</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analytics Chart
                  {selectedDimensions.length > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      Multiple Dimensions Selected
                    </Badge>
                  )}
                </CardTitle>
                {selectedDimensions.length > 1 && (
                  <p className="text-sm text-muted-foreground">
                    Showing combined dimension values from:{" "}
                    {selectedDimensions.join(", ")}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-96">
                    <Spinner />
                  </div>
                ) : (
                  renderChart()
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Raw Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-96">
                    <Spinner />
                  </div>
                ) : (
                  <ScrollArea className="h-96">{renderDataTable()}</ScrollArea>
                )}
              </CardContent>
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
                <MapCompact size="responsive" data={mapData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Analytics Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Accordion type="single" collapsible className="w-full">
            {/* Time Period */}
            <AccordionItem value="time-period">
              <AccordionTrigger className="[&>svg]:hidden text-sm font-medium group">
                <div className="flex gap-2 items-center">
                  <div className="relative w-4 h-4">
                    <Plus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-100 group-data-[state=open]:opacity-0" />
                    <Minus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-0 group-data-[state=open]:opacity-100" />
                  </div>
                  Time Period
                  <Badge variant="secondary">
                    {selectedPeriod.toUpperCase()}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pt-2">
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger className="w-48 text-xs">
                    <div className="flex gap-2 items-center animate-fadeIn bg-background text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                      <Label className="w-15 text-left text-xs text-muted-foreground/60">
                        Period
                      </Label>
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_PERIODS.map((period) => (
                      <SelectItem
                        key={period.value}
                        value={period.value}
                        className="text-xs"
                      >
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </AccordionContent>
            </AccordionItem>

            {/* Metrics Selection */}
            <AccordionItem value="metrics">
              <AccordionTrigger className="[&>svg]:hidden text-sm font-medium group">
                <div className="flex gap-2 items-center">
                  <div className="relative w-4 h-4">
                    <Plus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-100 group-data-[state=open]:opacity-0" />
                    <Minus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-0 group-data-[state=open]:opacity-100" />
                  </div>
                  Metrics
                  <Badge variant="secondary">{selectedMetrics.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <MultipleSelector
                  value={selectedMetrics}
                  onChange={setSelectedMetrics}
                  defaultOptions={METRICS}
                  placeholder="Select metrics"
                  emptyIndicator={
                    <p className="text-center text-xs text-muted-foreground">
                      No metrics found
                    </p>
                  }
                  className="w-full text-sm focus:border-ring"
                />
              </AccordionContent>
            </AccordionItem>

            {/* Dimensions Selection */}
            <AccordionItem value="dimensions">
              <AccordionTrigger className="[&>svg]:hidden text-sm font-medium group">
                <div className="flex gap-2 items-center">
                  <div className="relative w-4 h-4">
                    <Plus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-100 group-data-[state=open]:opacity-0" />
                    <Minus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-0 group-data-[state=open]:opacity-100" />
                  </div>
                  Dimensions
                  <Badge variant="secondary">{selectedDimensions.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <MultipleSelector
                  badgeClassName="text-xs"
                  value={selectedDimensions}
                  onChange={setSelectedDimensions}
                  defaultOptions={availableDimensions}
                  options={availableDimensions}
                  placeholder="Select dimensions"
                  emptyIndicator={
                    <p className="text-center text-xs">No dimensions found</p>
                  }
                  className="w-full text-xs"
                />
              </AccordionContent>
            </AccordionItem>

            {/* Context Filters - Campaign, Link, and UTM filters when their dimensions are selected */}
            {selectedDimensions.some(
              (d) =>
                ["campaign", "link"].includes(d.value) ||
                d.value.startsWith("utm_") ||
                !DIMENSIONS.some((baseDim) => baseDim.value === d.value),
            ) && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="context-filters">
                  <AccordionTrigger className="[&>svg]:hidden text-sm font-medium group">
                    <div className="flex gap-2 items-center">
                      <div className="relative w-4 h-4">
                        <Plus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-100 group-data-[state=open]:opacity-0" />
                        <Minus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-0 group-data-[state=open]:opacity-100" />
                      </div>
                      Context Filters
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 gap-4">
                      {(() => {
                        const orderedFilters = selectedDimensions
                          .filter(
                            (d) =>
                              ["campaign", "link"].includes(d.value) ||
                              d.value.startsWith("utm_") ||
                              !DIMENSIONS.some(
                                (baseDim) => baseDim.value === d.value,
                              ),
                          )
                          .map((d) => d.value);

                        return orderedFilters.map((dimension) => {
                          if (dimension === "campaign") {
                            return (
                              <div key="campaign" className="space-y-2">
                                <Select
                                  value={filters.campaign || "all"}
                                  onValueChange={(value) =>
                                    setFilters({
                                      ...filters,
                                      campaign:
                                        value === "all" ? undefined : value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <div className="flex gap-2 items-center animate-fadeIn bg-background text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                                      <Label className="w-15 text-left text-xs text-muted-foreground/60">
                                        Campaigns
                                      </Label>
                                      <SelectValue
                                        className="text-right "
                                        placeholder="All campaigns"
                                      />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <Label className="text-xs text-muted-foreground/70">
                                      Campaigns
                                    </Label>
                                    <Separator className="mt-2" />
                                    <SelectItem
                                      className="text-left text-xs"
                                      value="all"
                                    >
                                      All campaigns
                                    </SelectItem>
                                    {filterOptions.campaign?.map(
                                      (value: string) => (
                                        <SelectItem
                                          key={value}
                                          value={value}
                                          className="text-xs"
                                        >
                                          {value}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          } else if (dimension === "link") {
                            return (
                              <div key="link" className="space-y-2">
                                <Select
                                  value={filters.link || "all"}
                                  onValueChange={(value) =>
                                    setFilters({
                                      ...filters,
                                      link: value === "all" ? undefined : value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <div className="flex gap-2 items-center animate-fadeIn bg-background text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                                      <Label className="w-15 text-left text-xs text-muted-foreground/60">
                                        Links
                                      </Label>
                                      <SelectValue
                                        className="text-xs text-foreground"
                                        placeholder="All links"
                                      />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent className="">
                                    <Label className="text-xs text-muted-foreground/70">
                                      Links
                                    </Label>
                                    <Separator className="mt-2" />

                                    <SelectItem
                                      className="text-muted-foreground text-xs"
                                      value="all"
                                    >
                                      All links
                                    </SelectItem>
                                    {filterOptions.link?.map(
                                      (value: string) => (
                                        <SelectItem
                                          className="font-normal text-xs"
                                          key={value}
                                          value={value}
                                        >
                                          {value}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          } else if (
                            dimension.startsWith("utm_") ||
                            !DIMENSIONS.some(
                              (baseDim) => baseDim.value === dimension,
                            )
                          ) {
                            // Handle UTM dimensions dynamically
                            const utmKey = dimension.startsWith("utm_")
                              ? dimension
                              : dimension;
                            const displayName = dimension
                              .replace(/^utm_/, "")
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase());
                            const filterKey = dimension;

                            return (
                              <div key={dimension} className="space-y-2">
                                <Select
                                  value={(filters as any)[filterKey] || "all"}
                                  onValueChange={(value) =>
                                    setFilters({
                                      ...filters,
                                      [filterKey]:
                                        value === "all" ? undefined : value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <div className="flex gap-2 items-center animate-fadeIn bg-background text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                                      <Label className="w-15 text-left text-xs text-muted-foreground/60">
                                        {displayName} (UTM)
                                      </Label>
                                      <SelectValue
                                        className="text-xs text-foreground"
                                        placeholder={`All ${displayName.toLowerCase()}`}
                                      />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <Label className="text-xs text-muted-foreground/70">
                                      {displayName} (UTM)
                                    </Label>
                                    <Separator className="mt-2" />
                                    <SelectItem className="text-xs" value="all">
                                      All {displayName.toLowerCase()}
                                    </SelectItem>
                                    {filterOptions[dimension]?.map(
                                      (value: string) => (
                                        <SelectItem
                                          key={value}
                                          value={value}
                                          className="text-xs"
                                        >
                                          {value}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          }
                          return null;
                        });
                      })()}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Advanced Filters */}
          </Accordion>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="drilldown-filters">
              <AccordionTrigger className="[&>svg]:hidden text-sm font-medium group">
                <div className="flex gap-2 items-center">
                  <div className="relative w-4 h-4">
                    <Plus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-100 group-data-[state=open]:opacity-0" />
                    <Minus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-0 group-data-[state=open]:opacity-100" />
                  </div>
                  Drilldown Filters
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="grid grid-cols-1 gap-4">
                  {/* Device Type Filter - Always shown */}
                  <div className="space-y-2">
                    <Select
                      value={filters.device_type || "all"}
                      onValueChange={(value) =>
                        setFilters({
                          ...filters,
                          device_type: value === "all" ? undefined : value,
                        })
                      }
                    >
                      <SelectTrigger className="h-8">
                        <div className="flex gap-2 items-center animate-fadeIn bg-background text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                          <Label className="w-15 text-left text-xs text-muted-foreground/60">
                            Device Type
                          </Label>
                          <SelectValue
                            className="text-xs text-foreground"
                            placeholder="All devices"
                          />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <Label className="text-xs text-muted-foreground/70">
                          Device Type
                        </Label>
                        <Separator className="mt-2" />
                        <SelectItem className="text-xs" value="all">
                          All devices
                        </SelectItem>
                        {filterOptions.device_type?.map((device) => (
                          <SelectItem
                            key={device}
                            value={device}
                            className="text-xs"
                          >
                            {device}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dynamic filters based on selected dimensions */}
                  {selectedDimensions.some(
                    (d) => d.value === "browser_name",
                  ) && (
                    <div className="space-y-2">
                      <Select
                        value={filters.browser_name || "all"}
                        onValueChange={(value) =>
                          setFilters({
                            ...filters,
                            browser_name: value === "all" ? undefined : value,
                          })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <div className="flex gap-2 items-center animate-fadeIn bg-background text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                            <Label className="w-15 text-left text-xs text-muted-foreground/60">
                              Browser
                            </Label>
                            <SelectValue
                              className="text-xs text-foreground"
                              placeholder="All browsers"
                            />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <Label className="text-xs text-muted-foreground/70">
                            Browser
                          </Label>
                          <Separator className="mt-2" />
                          <SelectItem className="text-xs" value="all">
                            All browsers
                          </SelectItem>
                          {filterOptions.browser_name?.map((browser) => (
                            <SelectItem
                              key={browser}
                              value={browser}
                              className="text-xs"
                            >
                              {browser}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedDimensions.some((d) => d.value === "country") && (
                    <div className="space-y-2">
                      <Select
                        value={filters.country || "all"}
                        onValueChange={(value) =>
                          setFilters({
                            ...filters,
                            country: value === "all" ? undefined : value,
                          })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <div className="flex gap-2 items-center animate-fadeIn bg-background text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                            <Label className="w-15 text-left text-xs text-muted-foreground/60">
                              Country
                            </Label>
                            <SelectValue
                              className="text-xs text-foreground"
                              placeholder="All countries"
                            />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <Label className="text-xs text-muted-foreground/70">
                            Country
                          </Label>
                          <Separator className="mt-2" />
                          <SelectItem className="text-xs" value="all">
                            All countries
                          </SelectItem>
                          {filterOptions.country?.map((country) => (
                            <SelectItem
                              key={country}
                              value={country}
                              className="text-xs"
                            >
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedDimensions.some((d) => d.value === "region") && (
                    <div className="space-y-2">
                      <Select
                        value={filters.region || "all"}
                        onValueChange={(value) =>
                          setFilters({
                            ...filters,
                            region: value === "all" ? undefined : value,
                          })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <div className="flex gap-2 items-center animate-fadeIn bg-background text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                            <Label className="w-15 text-left text-xs text-muted-foreground/60">
                              Region
                            </Label>
                            <SelectValue
                              className="text-xs text-foreground"
                              placeholder="All regions"
                            />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <Label className="text-xs text-muted-foreground/70">
                            Region
                          </Label>
                          <Separator className="mt-2" />
                          <SelectItem className="text-xs" value="all">
                            All regions
                          </SelectItem>
                          {filterOptions.region?.map((region) => (
                            <SelectItem
                              key={region}
                              value={region}
                              className="text-xs"
                            >
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedDimensions.some((d) => d.value === "city") && (
                    <div className="space-y-2">
                      <Select
                        value={filters.city || "all"}
                        onValueChange={(value) =>
                          setFilters({
                            ...filters,
                            city: value === "all" ? undefined : value,
                          })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <div className="flex gap-2 items-center animate-fadeIn bg-background text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                            <Label className="w-15 text-left text-xs text-muted-foreground/60">
                              City
                            </Label>
                            <SelectValue
                              className="text-xs text-foreground"
                              placeholder="All cities"
                            />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <Label className="text-xs text-muted-foreground/70">
                            City
                          </Label>
                          <Separator className="mt-2" />
                          <SelectItem className="text-xs" value="all">
                            All cities
                          </SelectItem>
                          {filterOptions.city?.map((city) => (
                            <SelectItem
                              key={city}
                              value={city}
                              className="text-xs"
                            >
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedDimensions.some((d) => d.value === "ref_source") && (
                    <div className="space-y-2">
                      <Select
                        value={filters.ref_source || "all"}
                        onValueChange={(value) =>
                          setFilters({
                            ...filters,
                            ref_source: value === "all" ? undefined : value,
                          })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <div className="flex gap-2 items-center animate-fadeIn bg-background text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                            <Label className="w-15 text-left text-xs text-muted-foreground/60">
                              Referral Source
                            </Label>
                            <SelectValue
                              className="text-xs text-foreground"
                              placeholder="All sources"
                            />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <Label className="text-xs text-muted-foreground/70">
                            Referral Source
                          </Label>
                          <Separator className="mt-2" />
                          <SelectItem className="text-xs" value="all">
                            All sources
                          </SelectItem>
                          {filterOptions.ref_source?.map((source) => (
                            <SelectItem
                              key={source}
                              value={source}
                              className="text-xs"
                            >
                              {source}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedDimensions.some((d) => d.value === "ref_type") && (
                    <div className="space-y-2">
                      <Select
                        value={filters.ref_type || "all"}
                        onValueChange={(value) =>
                          setFilters({
                            ...filters,
                            ref_type: value === "all" ? undefined : value,
                          })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <div className="flex gap-2 items-center animate-fadeIn bg-background text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                            <Label className="w-15 text-left text-xs text-muted-foreground/60">
                              Referral Type
                            </Label>
                            <SelectValue
                              className="text-xs text-foreground"
                              placeholder="All types"
                            />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <Label className="text-xs text-muted-foreground/70">
                            Referral Type
                          </Label>
                          <Separator className="mt-2" />
                          <SelectItem className="text-xs" value="all">
                            All types
                          </SelectItem>
                          {filterOptions.ref_type?.map((type) => (
                            <SelectItem
                              key={type}
                              value={type}
                              className="text-xs"
                            >
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Clear Filters Button */}
                {(filters.device_type ||
                  filters.browser_name ||
                  filters.country ||
                  filters.region ||
                  filters.city ||
                  filters.campaign ||
                  filters.link ||
                  filters.ref_source ||
                  filters.ref_type) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({})}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </Button>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
