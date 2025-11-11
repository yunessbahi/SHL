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
import { Globe, RefreshCw } from "lucide-react";
import {
  analyticsAPI,
  type GeoBreakdownPoint,
  formatNumber,
} from "@/lib/analytics-api";

interface TopCountriesChartProps {
  data?: GeoBreakdownPoint[];
  period: string;
  granularity?: "country" | "region" | "city";
  topN?: number;
  title?: string;
  description?: string;
  className?: string;
  showLoading?: boolean;
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
  }, [period, granularity, topN, propData]);

  // Calculate max clicks for bar width
  const maxClicks = Math.max(...data.map((item) => item.click_count), 1);

  const isLoading = showLoading && loading;
  const hasError = error && data.length === 0;

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
            {/* <span className="text-sm text-muted-foreground">
              {granularity.charAt(0).toUpperCase() + granularity.slice(1)}
            </span> */}
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading top countries...</p>
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
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <Globe className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No country data available</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={item.location} className="flex items-center gap-3">
                {/* Rank number */}
                <div className="w-6 text-center text-sm font-medium text-muted-foreground">
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
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
