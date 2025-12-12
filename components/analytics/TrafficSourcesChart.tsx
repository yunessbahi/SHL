"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/global-tooltip";
import { Spinner } from "@/components/ui/spinner";
import {
  analyticsAPI,
  formatNumber,
  type TrafficSourcePoint,
} from "@/lib/analytics-api";
import { RefreshCw, SquareDashedMousePointer } from "lucide-react";
import { useEffect, useState } from "react";

interface TrafficSourcesChartProps {
  data?: TrafficSourcePoint[];
  period: string;
  topN?: number;
  title?: string;
  description?: string;
  className?: string;
  showLoading?: boolean;
  refreshTrigger?: number;
  noCard?: boolean;
}

export default function TrafficSourcesChart({
  data: propData,
  period,
  topN = 5,
  title = "Traffic Sources",
  description,
  className = "",
  showLoading = true,
  refreshTrigger,
  noCard = false,
}: TrafficSourcesChartProps) {
  const [data, setData] = useState<TrafficSourcePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API if not provided
  const fetchData = async () => {
    if (propData) return; // Use provided data if available

    try {
      setLoading(true);
      setError(null);
      const result = await analyticsAPI.getGlobalTrafficSources(period, topN);
      // Ensure we don't show more than topN items
      setData(result.slice(0, topN));
    } catch (err) {
      console.error("Failed to fetch traffic sources data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");

      // Provide fallback data for demonstration (exactly topN sources to match default)
      const fallbackData: TrafficSourcePoint[] = [
        {
          source: "organic",
          type: "organic",
          click_count: 3200,
          unique_visitors: 2100,
          percentage: 45.7,
        },
        {
          source: "direct",
          type: "direct",
          click_count: 1800,
          unique_visitors: 1400,
          percentage: 25.7,
        },
        {
          source: "social",
          type: "social",
          click_count: 950,
          unique_visitors: 780,
          percentage: 13.6,
        },
        {
          source: "email",
          type: "email",
          click_count: 670,
          unique_visitors: 580,
          percentage: 9.6,
        },
        {
          source: "referral",
          type: "referral",
          click_count: 380,
          unique_visitors: 320,
          percentage: 5.4,
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
  }, [period, topN, propData, refreshTrigger]);

  // Calculate max clicks for bar width
  const maxClicks = Math.max(...data.map((item) => item.click_count), 1);

  const isLoading = showLoading && loading;
  const hasError = error && data.length === 0;

  if (noCard) {
    return (
      <div className={className}>
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <Spinner className="size-4" />
            <span className="ml-2 text-xs">Loading</span>
          </div>
        ) : hasError ? (
          <div className="h-40 flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl mb-2 block">📊</span>
              <p className="text-sm text-muted-foreground mb-2">
                Error loading data
              </p>
              <Button variant="outline" size="sm" onClick={fetchData}>
                Try Again
              </Button>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className=" h-40 flex flex-col items-center justify-center text-center gap-4">
            <SquareDashedMousePointer className="w-6 h-6 text-muted-foreground/70" />

            <p className="text-sm text-muted-foreground/70">
              No traffic source data available
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <TooltipProvider>
              {data.map((item, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger>
                    <div key={item.source} className="flex items-center gap-3">
                      {/* Rank number */}
                      <div className="text-center text-sm font-medium font-mono text-muted-foreground content-center rounded-full bg-muted w-6 h-6">
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
                            {item.source}
                          </div>
                          <div
                            className="h-full bg-popover-foreground rounded-md transition-all duration-500 ease-out"
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
                      <div className="font-medium">{item.source}</div>
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
              <span className="text-lg">📊</span>
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
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <Spinner className="size-4" />
            <span className="ml-2 text-xs">Loading</span>
          </div>
        ) : hasError ? (
          <div className="h-40 flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl mb-2 block">📊</span>
              <p className="text-sm text-muted-foreground mb-2">
                Error loading data
              </p>
              <Button variant="outline" size="sm" onClick={fetchData}>
                Try Again
              </Button>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-40 flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl mb-2 block">📊</span>
              <p className="text-sm text-muted-foreground">
                No traffic source data available
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <TooltipProvider>
              {data.map((item, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger>
                    <div key={item.source} className="flex items-center gap-3">
                      {/* Rank number */}
                      <div className="text-center text-sm font-medium font-mono text-muted-foreground content-center rounded-full bg-muted w-6 h-6">
                        {index + 1}
                      </div>

                      {/* Source name */}
                      <div className="w-24 text-sm font-normal capitalize">
                        {item.source}
                      </div>

                      {/* Bar */}
                      <div className="flex-1 relative">
                        <div className="h-6 bg-muted rounded-md overflow-hidden">
                          <div
                            className="h-full bg-popover-foreground rounded-md transition-all duration-500 ease-out"
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
                        {item.source}:
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
