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
import {
  Globe,
  RefreshCw,
  Link as LinkIcon,
  Target,
  SquareDashedMousePointer,
} from "lucide-react";
import {
  analyticsAPI,
  type TopLinkPoint,
  type TopCampaignPoint,
  formatNumber,
} from "@/lib/analytics-api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/global-tooltip";
import { Spinner } from "@/components/ui/spinner";

interface TopLinksCampaignsChartProps {
  data?: TopLinkPoint[] | TopCampaignPoint[];
  period: string;
  type?: "links" | "campaigns";
  topN?: number;
  title?: string;
  description?: string;
  className?: string;
  showLoading?: boolean;
  refreshTrigger?: number;
  noCard?: boolean;
}

export default function TopLinksCampaignsChart({
  data: propData,
  period,
  type = "links",
  topN = 5,
  title,
  description,
  className = "",
  showLoading = true,
  refreshTrigger,
  noCard = false,
}: TopLinksCampaignsChartProps) {
  const [data, setData] = useState<TopLinkPoint[] | TopCampaignPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to truncate text to 46 characters with ellipsis
  const truncateText = (text: string, maxLength: number = 46) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Fetch data from API if not provided
  const fetchData = async () => {
    if (propData) return; // Use provided data if available

    try {
      setLoading(true);
      setError(null);
      let result: TopLinkPoint[] | TopCampaignPoint[];

      if (type === "links") {
        result = await analyticsAPI.getGlobalTopLinks(period, topN);
      } else {
        result = await analyticsAPI.getGlobalTopCampaigns(period, topN);
      }

      // Ensure we don't show more than topN items
      setData(result.slice(0, topN));
    } catch (err) {
      console.error(`Failed to fetch top ${type} data:`, err);
      setError(err instanceof Error ? err.message : "Failed to load data");
      setData([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, type, topN, propData, refreshTrigger]);

  // Calculate max clicks for bar width
  const maxClicks = Math.max(...data.map((item) => item.click_count), 1);

  const isLoading = showLoading && loading;
  const hasError = error && data.length === 0;

  const getTitle = () => {
    if (title) return title;
    return type === "links" ? "Top Links" : "Top Campaigns";
  };

  const getDescription = () => {
    if (description) return description;
    return type === "links"
      ? "Most clicked links in your account"
      : "Most active campaigns by click count";
  };

  const getIcon = () => {
    return type === "links" ? (
      <LinkIcon className="h-5 w-5 text-muted-foreground" />
    ) : (
      <Target className="h-5 w-5 text-muted-foreground" />
    );
  };

  const getEmptyMessage = () => {
    return type === "links"
      ? "No link data available"
      : "No campaign data available";
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
              {getIcon()}
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
                    <div key={item.id} className="flex items-center gap-3">
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
                            {truncateText(item.name)}
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
                      <div className="font-medium">{item.name}</div>
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
                      {type === "campaigns" && "link_count" in item && (
                        <div>
                          Links:{" "}
                          <span className="font-mono">{item.link_count}</span>
                        </div>
                      )}
                      {type === "links" && "short_url" in item && (
                        <div>
                          URL:{" "}
                          <span className="font-mono text-xs">
                            {item.short_url}
                          </span>
                        </div>
                      )}
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
              {getIcon()}
              {getTitle()}
            </CardTitle>
            {description && (
              <CardDescription className="text-sm">
                {getDescription()}
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
              {getIcon()}
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
                    <div key={item.id} className="flex items-center gap-3">
                      {/* Rank number */}
                      <div className=" text-center text-sm font-medium text-muted-foreground">
                        {index + 1}
                      </div>

                      {/* Item name */}
                      <div className="w-24 text-sm font-normal truncate">
                        {truncateText(item.name)}
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
                    <div className="space-y-1">
                      <div className="font-medium">{item.name}</div>
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
                      {type === "campaigns" && "link_count" in item && (
                        <div>
                          Links:{" "}
                          <span className="font-mono">{item.link_count}</span>
                        </div>
                      )}
                      {type === "links" && "short_url" in item && (
                        <div>
                          URL:{" "}
                          <span className="font-mono text-xs">
                            {item.short_url}
                          </span>
                        </div>
                      )}
                    </div>
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
