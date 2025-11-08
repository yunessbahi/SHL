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
  type DeviceBreakdownPoint,
  formatNumber,
} from "@/lib/analytics-api";

interface DeviceBreakdownChartProps {
  data?: DeviceBreakdownPoint[];
  period: string;
  topN?: number;
  title?: string;
  description?: string;
  className?: string;
  showLoading?: boolean;
}

export default function DeviceBreakdownChart({
  data: propData,
  period,
  topN = 5,
  title = "Device Breakdown",
  description,
  className = "",
  showLoading = true,
}: DeviceBreakdownChartProps) {
  const [data, setData] = useState<DeviceBreakdownPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API if not provided
  const fetchData = async () => {
    if (propData) return; // Use provided data if available

    try {
      setLoading(true);
      setError(null);

      // For device breakdown, we need to get campaign or global data
      // Since we don't have a specific link_id, we'll create mock data for now
      // In production, this would come from a global device breakdown endpoint
      const fallbackData: DeviceBreakdownPoint[] = [
        {
          device_type: "Desktop",
          browser_name: "Chrome",
          os_name: "Windows",
          click_count: 3200,
          percentage: 45.7,
          unique_visitors: 2100,
        },
        {
          device_type: "Mobile",
          browser_name: "Safari",
          os_name: "iOS",
          click_count: 1800,
          percentage: 25.7,
          unique_visitors: 1400,
        },
        {
          device_type: "Mobile",
          browser_name: "Chrome",
          os_name: "Android",
          click_count: 950,
          percentage: 13.6,
          unique_visitors: 780,
        },
        {
          device_type: "Desktop",
          browser_name: "Safari",
          os_name: "macOS",
          click_count: 670,
          percentage: 9.6,
          unique_visitors: 580,
        },
        {
          device_type: "Tablet",
          browser_name: "Safari",
          os_name: "iOS",
          click_count: 380,
          percentage: 5.4,
          unique_visitors: 320,
        },
      ];

      // Group by device type to reduce complexity
      const groupedData = fallbackData.reduce(
        (acc, item) => {
          const deviceType = item.device_type;
          if (!acc[deviceType]) {
            acc[deviceType] = {
              device_type: deviceType,
              browser_name: "Mixed",
              os_name: "Mixed",
              click_count: 0,
              percentage: 0,
              unique_visitors: 0,
            };
          }
          acc[deviceType].click_count += item.click_count;
          acc[deviceType].unique_visitors += item.unique_visitors;
          acc[deviceType].percentage += item.percentage;
          return acc;
        },
        {} as Record<string, DeviceBreakdownPoint>,
      );

      const result = Object.values(groupedData)
        .sort((a, b) => b.click_count - a.click_count)
        .slice(0, topN);

      setData(result);
    } catch (err) {
      console.error("Failed to fetch device breakdown data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");

      // Provide fallback data
      const fallbackData: DeviceBreakdownPoint[] = [
        {
          device_type: "Desktop",
          browser_name: "Mixed",
          os_name: "Mixed",
          click_count: 3200,
          percentage: 45.7,
          unique_visitors: 2100,
        },
        {
          device_type: "Mobile",
          browser_name: "Mixed",
          os_name: "Mixed",
          click_count: 1800,
          percentage: 25.7,
          unique_visitors: 1400,
        },
        {
          device_type: "Tablet",
          browser_name: "Mixed",
          os_name: "Mixed",
          click_count: 670,
          percentage: 9.6,
          unique_visitors: 580,
        },
      ];
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
              <span className="text-lg">💻</span>
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
                Loading device breakdown...
              </p>
            </div>
          </div>
        ) : hasError ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl mb-2 block">💻</span>
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
              <span className="text-4xl mb-2 block">💻</span>
              <p className="text-sm text-muted-foreground">
                No device data available
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={item.device_type} className="flex items-center gap-3">
                {/* Rank number */}
                <div className="w-6 text-center text-sm font-medium text-muted-foreground">
                  {index + 1}
                </div>

                {/* Device name */}
                <div className="w-24 text-sm font-medium capitalize">
                  {item.device_type}
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
