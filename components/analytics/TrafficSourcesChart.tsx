"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  analyticsAPI,
  type TrafficSourcePoint,
  formatNumber,
} from "@/lib/analytics-api";

interface TrafficSourcesChartProps {
  data?: TrafficSourcePoint[];
  period: string;
  topN?: number;
  title?: string;
  description?: string;
  className?: string;
  showLoading?: boolean;
}

export default function TrafficSourcesChart({
  data: propData,
  period,
  topN = 5,
  title = "Traffic Sources",
  description,
  className = "",
  showLoading = true,
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
  }, [period, topN, propData]);

  const isLoading = showLoading && loading;
  const hasError = error && data.length === 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{period}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">
                Loading traffic sources...
              </p>
            </div>
          </div>
        ) : hasError ? (
          <div className="h-[200px] flex items-center justify-center">
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
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl mb-2 block">📊</span>
              <p className="text-sm text-muted-foreground">
                No traffic source data available
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={item.source} className="flex items-center gap-3">
                {/* Rank number */}
                <div className="w-6 text-center text-sm font-medium text-muted-foreground">
                  {index + 1}
                </div>

                {/* Source name */}
                <div className="w-24 text-sm font-medium capitalize">
                  {item.source}
                </div>

                {/* Bar */}
                <div className="flex-1 relative">
                  <div className="h-6 bg-muted rounded-md overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-md transition-all duration-500 ease-out"
                      style={{
                        width: `${(item.click_count / Math.max(...data.map((d) => d.click_count))) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Click count label */}
                  <div className="absolute inset-0 flex items-center justify-end px-2 text-xs font-medium text-muted-foreground">
                    {formatNumber(item.click_count)} (
                    {item.percentage.toFixed(1)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
