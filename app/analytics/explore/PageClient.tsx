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
} from "lucide-react";
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
import { useCampaigns } from "@/lib/hooks/useCampaigns";
import { useLinks } from "@/lib/hooks/useLinks";
import { Span } from "next/dist/trace";
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

const DEVICE_TYPES = ["Mobile", "Desktop"];

const TIME_PERIODS = [
  { value: "1d", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "365d", label: "Last Year" },
];

const CHART_TYPES = [
  { value: "bar", label: "Bar Chart", icon: <BarChart3 className="w-4 h-4" /> },
  {
    value: "line",
    label: "Line Chart",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    value: "area",
    label: "Area Chart",
    icon: <TrendingUp className="w-4 h-4" />,
  },
];

const COLORS = [
  "#3b82f6",
  "#10b981",
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
  const [chartType, setChartType] = useState("bar");
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [availableDimensions, setAvailableDimensions] =
    useState<Option[]>(DIMENSIONS);

  // Use existing hooks for campaigns and links
  const { campaigns, loading: loadingCampaigns } = useCampaigns();
  const { links, loading: loadingLinks } = useLinks();

  // Filter links based on selected campaign filter
  const filteredLinks = useMemo(() => {
    if (!filters.campaign_id) return links;
    return links.filter((link) => link.campaign_id === filters.campaign_id);
  }, [links, filters.campaign_id]);

  // Filter campaigns based on selected link filter
  const filteredCampaigns = useMemo(() => {
    if (!filters.link_id) return campaigns;
    const selectedLink = links.find(
      (link) => link.id === filters.link_id?.toString(),
    );
    if (!selectedLink?.campaign_id) return campaigns;
    return campaigns.filter(
      (campaign) => campaign.id === selectedLink.campaign_id,
    );
  }, [campaigns, links, filters.link_id]);

  // Dynamic filter options based on selected dimensions
  const [filterOptions, setFilterOptions] = useState<Record<string, string[]>>(
    {},
  );

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

  // Extract filter options from explore data
  useEffect(() => {
    if (exploreData?.data) {
      const newFilterOptions: Record<string, string[]> = {};

      selectedDimensions.forEach((dimension) => {
        const values = new Set<string>();
        exploreData.data.forEach((item) => {
          const value = item[dimension.value];
          if (value !== undefined && value !== null && value !== "") {
            values.add(String(value));
          }
        });
        newFilterOptions[dimension.value] = Array.from(values).sort();
      });

      // Also add UTM dimensions to filter options
      if (exploreData.available_dimensions) {
        exploreData.available_dimensions.forEach((utmDim) => {
          if (!newFilterOptions[utmDim]) {
            const values = new Set<string>();
            exploreData.data.forEach((item) => {
              const value = item[utmDim];
              if (value !== undefined && value !== null && value !== "") {
                values.add(String(value));
              }
            });
            newFilterOptions[utmDim] = Array.from(values).sort();
          }
        });
      }

      setFilterOptions(newFilterOptions);
    }
  }, [exploreData, selectedDimensions]);

  const chartData = useMemo(() => {
    if (!exploreData?.data) return [];

    // Apply client-side filtering
    const filteredData = exploreData.data.filter((item) => {
      if (!item.coalesce) return false;

      // Check campaign filter
      if (filters.campaign_id !== undefined) {
        const selectedCampaign = campaigns.find(
          (c) => c.id.toString() == filters.campaign_id?.toString(),
        );
        if (selectedCampaign && item.campaign !== selectedCampaign.name)
          return false;
      }

      // Check link filter
      if (filters.link_id !== undefined) {
        const selectedLink = links.find(
          (l) => l.id.toString() == filters.link_id?.toString(),
        );
        if (
          selectedLink &&
          item.link !== selectedLink.name &&
          item.link !== selectedLink.short_url
        )
          return false;
      }

      // Check other filters
      for (const key in filters) {
        if (
          key !== "campaign_id" &&
          key !== "link_id" &&
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
        fill: COLORS[index % COLORS.length],
      };
    });
  }, [exploreData, filters, campaigns, links]);

  const mapData = useMemo(() => {
    if (
      !selectedDimensions.some((d) => d.value === "country") ||
      !exploreData?.data
    )
      return undefined;

    // Apply client-side filtering
    const filteredData = exploreData.data.filter((item: any) => {
      if (!item.coalesce || !item.country || item.country.length !== 2)
        return false;

      // Check campaign filter
      if (filters.campaign_id !== undefined) {
        const selectedCampaign = campaigns.find(
          (c) => c.id.toString() == filters.campaign_id?.toString(),
        );
        if (selectedCampaign && item.campaign !== selectedCampaign.name)
          return false;
      }

      // Check link filter
      if (filters.link_id !== undefined) {
        const selectedLink = links.find(
          (l) => l.id.toString() == filters.link_id?.toString(),
        );
        if (
          selectedLink &&
          item.link !== selectedLink.name &&
          item.link !== selectedLink.short_url
        )
          return false;
      }

      // Check other filters
      for (const key in filters) {
        if (
          key !== "campaign_id" &&
          key !== "link_id" &&
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
  }, [exploreData, selectedDimensions, filters, campaigns, links]);

  const renderChart = () => {
    if (!chartData.length) return null;

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedMetrics.map((metric, index) => (
                <Line
                  key={metric.value}
                  type="monotone"
                  dataKey={metric.value}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedMetrics.map((metric, index) => (
                <Area
                  key={metric.value}
                  type="monotone"
                  dataKey={metric.value}
                  stackId="1"
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey={selectedMetrics[0].value}
                nameKey="name"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      default: // bar
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedMetrics.map((metric, index) => (
                <Bar
                  key={metric.value}
                  dataKey={metric.value}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderDataTable = () => {
    if (!exploreData?.data?.length) return null;

    // Filter out rows with empty coalesce values and apply client-side filters
    const filteredData = exploreData.data.filter((row) => {
      if (!row.coalesce) return false;

      // Check campaign filter
      if (filters.campaign_id !== undefined) {
        const selectedCampaign = campaigns.find(
          (c) => c.id.toString() == filters.campaign_id?.toString(),
        );
        if (selectedCampaign && row.campaign !== selectedCampaign.name)
          return false;
      }

      // Check link filter
      if (filters.link_id !== undefined) {
        const selectedLink = links.find(
          (l) => l.id.toString() == filters.link_id?.toString(),
        );
        if (
          selectedLink &&
          row.link !== selectedLink.name &&
          row.link !== selectedLink.short_url
        )
          return false;
      }

      // Check other filters
      for (const key in filters) {
        if (
          key !== "campaign_id" &&
          key !== "link_id" &&
          filters[key] !== undefined &&
          row[key] !== filters[key]
        ) {
          return false;
        }
      }
      return true;
    });

    if (!filteredData.length) return null;

    const columns = ["coalesce", ...selectedMetrics.map((m) => m.value)];

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
                    {typeof row[col] === "number"
                      ? formatNumber(row[col])
                      : row[col]}
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

        {/* Summary Stats */}
        {exploreData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Records
                    </p>
                    <p className="text-2xl font-bold">
                      {formatNumber(exploreData.total_count)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Metrics
                    </p>
                    <p className="text-2xl font-bold">
                      {selectedMetrics.length}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Dimensions
                    </p>
                    <p className="text-2xl font-bold">
                      {selectedDimensions.length}
                    </p>
                  </div>
                  <Filter className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Time Period
                    </p>
                    <p className="text-2xl font-bold">
                      {selectedPeriod.toUpperCase()}
                    </p>
                  </div>
                  <CalendarDays className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
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
              <AccordionTrigger className="text-sm font-medium">
                Time Period
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pt-2">
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_PERIODS.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </AccordionContent>
            </AccordionItem>

            {/* Metrics Selection */}
            <AccordionItem value="metrics">
              <AccordionTrigger className="text-sm font-medium">
                Metrics
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
              <AccordionTrigger className="text-sm font-medium">
                Dimensions
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <MultipleSelector
                  value={selectedDimensions}
                  onChange={setSelectedDimensions}
                  defaultOptions={availableDimensions}
                  options={availableDimensions}
                  placeholder="Select dimensions"
                  emptyIndicator={
                    <p className="text-center text-sm">No dimensions found</p>
                  }
                  className="w-full"
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
                  <AccordionTrigger className="text-sm font-medium">
                    Context Filters
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
                                  value={
                                    filters.campaign_id?.toString() || "all"
                                  }
                                  onValueChange={(value) =>
                                    setFilters({
                                      ...filters,
                                      campaign_id:
                                        value === "all"
                                          ? undefined
                                          : parseInt(value),
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
                                      className="text-left"
                                      value="all"
                                    >
                                      All campaigns
                                    </SelectItem>
                                    {filteredCampaigns.map((campaign) => (
                                      <SelectItem
                                        key={campaign.id}
                                        value={campaign.id.toString()}
                                      >
                                        {campaign.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          } else if (dimension === "link") {
                            return (
                              <div key="link" className="space-y-2">
                                <Select
                                  value={filters.link_id?.toString() || "all"}
                                  onValueChange={(value) =>
                                    setFilters({
                                      ...filters,
                                      link_id:
                                        value === "all"
                                          ? undefined
                                          : parseInt(value),
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
                                      className="text-muted-foreground"
                                      value="all"
                                    >
                                      All links
                                    </SelectItem>
                                    {filteredLinks.map((link) => (
                                      <SelectItem
                                        className="font-normal"
                                        key={link.id}
                                        value={link.id.toString()}
                                      >
                                        {link.name || link.short_url}
                                      </SelectItem>
                                    ))}
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
                                    <SelectItem value="all">
                                      All {displayName.toLowerCase()}
                                    </SelectItem>
                                    {filterOptions[dimension]?.map(
                                      (value: string) => (
                                        <SelectItem key={value} value={value}>
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
            <AccordionItem value="advanced-filters">
              <AccordionTrigger className="text-sm font-medium">
                Advanced Filters
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
                        <SelectItem value="all">All devices</SelectItem>
                        {DEVICE_TYPES.map((device) => (
                          <SelectItem key={device} value={device}>
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
                          <SelectItem value="all">All browsers</SelectItem>
                          {filterOptions.browser_name?.map((browser) => (
                            <SelectItem key={browser} value={browser}>
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
                          <SelectItem value="all">All countries</SelectItem>
                          {filterOptions.country?.map((country) => (
                            <SelectItem key={country} value={country}>
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
                          <SelectItem value="all">All regions</SelectItem>
                          {filterOptions.region?.map((region) => (
                            <SelectItem key={region} value={region}>
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
                          <SelectItem value="all">All cities</SelectItem>
                          {filterOptions.city?.map((city) => (
                            <SelectItem key={city} value={city}>
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
                          <SelectItem value="all">All sources</SelectItem>
                          {filterOptions.ref_source?.map((source) => (
                            <SelectItem key={source} value={source}>
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
                          <SelectItem value="all">All types</SelectItem>
                          {filterOptions.ref_type?.map((type) => (
                            <SelectItem key={type} value={type}>
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
                  filters.campaign_id ||
                  filters.link_id ||
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

          {/* Chart Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Chart Type</Label>
            <div className="flex gap-2">
              {CHART_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant={chartType === type.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType(type.value)}
                  className="flex items-center gap-2"
                >
                  {type.icon}
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
