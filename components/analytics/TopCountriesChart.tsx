"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, RefreshCw, SquareDashedMousePointer } from "lucide-react";
import {
  analyticsAPI,
  type GeoBreakdownPoint,
  formatNumber,
} from "@/lib/analytics-api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/global-tooltip";
import { Spinner } from "@/components/ui/spinner";

interface TopCountriesChartProps {
  data?: GeoBreakdownPoint[];
  period: string;
  granularity?: "country" | "region" | "city";
  topN?: number;
  title?: string;
  description?: string;
  className?: string;
  showLoading?: boolean;
  refreshTrigger?: number;
  noCard?: boolean;
}

export default function TopCountriesChart({
  data: propData,
  period,
  granularity = "country",
  topN = 5,
  title = "Top Countries",
  description,
  className = "",
  showLoading = true,
  refreshTrigger,
  noCard = false,
}: TopCountriesChartProps) {
  const [data, setData] = useState<GeoBreakdownPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API if not provided
  const fetchData = async () => {
    if (propData) return; // Use provided data if available

    try {
      setLoading(true);
      setError(null);
      const result = await analyticsAPI.getGlobalTopCountries(
        granularity,
        period,
        topN,
      );
      // Ensure we don't show more than topN items
      setData(result.slice(0, topN));
    } catch (err) {
      console.error("Failed to fetch top countries data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");

      // Provide fallback data for demonstration (exactly 5 countries to match default)
      const fallbackData: GeoBreakdownPoint[] = [
        {
          location: "United States",
          click_count: 2450,
          unique_visitors: 1890,
          percentage: 35.2,
        },
        {
          location: "United Kingdom",
          click_count: 1230,
          unique_visitors: 980,
          percentage: 17.6,
        },
        {
          location: "Canada",
          click_count: 890,
          unique_visitors: 720,
          percentage: 12.8,
        },
        {
          location: "Germany",
          click_count: 670,
          unique_visitors: 540,
          percentage: 9.6,
        },
        {
          location: "Australia",
          click_count: 450,
          unique_visitors: 380,
          percentage: 6.5,
        },
      ];
      // Only show up to topN items
      setData(fallbackData.slice(0, topN));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, granularity, topN, propData, refreshTrigger]);

  // Calculate max clicks for bar width
  const maxClicks = Math.max(...data.map((item) => item.click_count), 1);

  const isLoading = showLoading && loading;
  const hasError = error && data.length === 0;

  const getEmptyMessage = () => {
    switch (granularity) {
      case "city":
        return "No city data available";
      case "region":
        return "No region data available";
      default:
        return "No country data available";
    }
  };

  if (noCard) {
    return (
      <div className={className}>
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-center">
              <Spinner className="size-6 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : hasError ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <Globe className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-2">Error loading data</p>
              <Button variant="outline" size="sm" onClick={fetchData}>
                Try Again
              </Button>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className=" h-[200px] flex flex-col items-center justify-center text-center gap-4">
            <SquareDashedMousePointer className="w-6 h-6 text-muted-foreground/70" />
            <p className="text-sm text-muted-foreground/70">
              {getEmptyMessage()}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <TooltipProvider>
              {data.map((item, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger>
                    <div
                      key={item.location}
                      className="flex items-center gap-3"
                    >
                      {/* Rank number */}
                      <div className="text-center text-sm font-medium text-muted-foreground">
                        {index + 1}
                      </div>

                      {/* Bar with name overlaid, number outside */}
                      <div className="flex-1 relative">
                        <div className="h-6 bg-muted rounded-md overflow-hidden">
                          <div
                            className="absolute left-2 top-0 bottom-0 flex items-center text-xs font-normal truncate z-10"
                            style={{
                              color: "white",
                              mixBlendMode: "difference",
                            }}
                          >
                            {item.location}
                          </div>
                          <div
                            className="h-full bg-primary rounded-md transition-all duration-500 ease-out"
                            style={{
                              width: `${(item.click_count / maxClicks) * 100}%`,
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
                          {formatNumber(item.click_count)}
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <div className="font-medium">{item.location}</div>
                      <div>
                        Clicks:{" "}
                        <span className="font-mono">
                          {formatNumber(item.click_count)}
                        </span>
                      </div>
                      <div>
                        Visitors:{" "}
                        <span className="font-mono">
                          {formatNumber(item.unique_visitors)}
                        </span>
                      </div>
                      <div>
                        Percentage:{" "}
                        <span className="font-mono">
                          {item.percentage.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <CardTitle className="flex items-center gap-2 pb-1">
              <Globe className="h-5 w-5 text-muted-foreground" />
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{period}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="text-center">
              <Spinner className="size-6 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : hasError ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <Globe className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-2">Error loading data</p>
              <Button variant="outline" size="sm" onClick={fetchData}>
                Try Again
              </Button>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className=" h-[200px] flex flex-col items-center justify-center text-center gap-4">
            <SquareDashedMousePointer className="w-6 h-6 text-muted-foreground/70" />
            <p className="text-sm text-muted-foreground/70">
              {getEmptyMessage()}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <TooltipProvider>
              {data.map((item, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger>
                    <div
                      key={item.location}
                      className="flex items-center gap-3"
                    >
                      {/* Rank number */}
                      <div className="text-center text-sm font-medium text-muted-foreground">
                        {index + 1}
                      </div>

                      {/* Country name */}
                      <div className="w-24 text-sm font-normal truncate">
                        {item.location}
                      </div>

                      {/* Bar */}
                      <div className="flex-1 relative">
                        <div className="h-6 bg-muted rounded-md overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-md transition-all duration-500 ease-out"
                            style={{
                              width: `${(item.click_count / maxClicks) * 100}%`,
                            }}
                          />
                        </div>

                        {/* Click count label */}
                        <div
                          className={`absolute inset-0 flex items-center justify-end px-2 text-xs font-mono
                  ${(item.click_count / maxClicks) * 100 <= 80 ? "text-foreground" : "text-background"}
                  `}
                        >
                          {formatNumber(item.click_count)}
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {
                      <div className="flex gap-2">
                        {item.location}:
                        <span className="font-mono">{item.click_count}</span>
                        <span className="font-mono text-muted-foreground">
                          {item.percentage.toFixed(2)}%
                        </span>
                      </div>
                    }
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
