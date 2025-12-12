"use client";

import {
  type LinkCreationStats,
  type TimeRange,
} from "../../types/workspaceTypes";

interface LinkCreationStatsProps {
  stats: LinkCreationStats | null;
  isLoading: boolean;
  timeRange: TimeRange;
}

export default function LinkCreationStats({
  stats,
  isLoading,
  timeRange,
}: LinkCreationStatsProps) {
  // Format number with commas
  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="h-40 bg-gray-100 rounded"></div>
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="h-2 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
            <div>
              <div className="h-2 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <p className="text-gray-500">No link creation statistics available</p>
      </div>
    );
  }

  // Calculate max value for chart scaling
  const maxValue = Math.max(...stats.counts, 1);
  const minValue = Math.min(...stats.counts);

  // Format timestamps for display
  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    if (timeRange === "day") {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Find highest day
  const highestDayIndex = stats.counts.indexOf(Math.max(...stats.counts));
  const highestDay = stats.timestamps[highestDayIndex];
  const highestDayCount = stats.counts[highestDayIndex];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Link Creation Activity
        </h3>
      </div>

      <div className="h-40 relative">
        {/* Simple bar chart */}
        <div className="flex items-end justify-between h-full space-x-1">
          {stats.counts.map((count, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="bg-blue-500 rounded-t-md hover:bg-blue-600 transition-colors"
                style={{
                  height: `${(count / maxValue) * 80}%`,
                  width: "80%",
                  minHeight: "4px",
                }}
                title={`${count} links on ${formatTimestamp(stats.timestamps[index])}`}
              />
              <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                {formatTimestamp(stats.timestamps[index])}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Total Links Created</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(stats.counts.reduce((a, b) => a + b, 0))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Growth Rate</p>
            <p
              className={`text-2xl font-bold ${stats.growthRate >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {stats.growthRate >= 0 ? "+" : ""}
              {stats.growthRate.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Highest {timeRange}</p>
            <p className="font-medium text-gray-900">
              {formatTimestamp(highestDay)} - {highestDayCount} links
            </p>
          </div>
          <div>
            <p className="text-gray-500">Average</p>
            <p className="font-medium text-gray-900">
              {formatNumber(
                Math.round(
                  stats.counts.reduce((a, b) => a + b, 0) / stats.counts.length,
                ),
              )}{" "}
              links/{timeRange}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
