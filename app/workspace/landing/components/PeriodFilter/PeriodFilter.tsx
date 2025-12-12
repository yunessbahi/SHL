"use client";

import { TimeRange } from "../../types/workspaceTypes";

interface PeriodFilterProps {
  selectedTimeRange: TimeRange;
  onTimeRangeChange: (timeRange: TimeRange) => void;
  className?: string;
}

export default function PeriodFilter({
  selectedTimeRange,
  onTimeRangeChange,
  className = "",
}: PeriodFilterProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-600">Period:</span>
      <select
        className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={selectedTimeRange}
        onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
      >
        <option value="day">Last 24 Hours</option>
        <option value="week">Last 7 Days</option>
        <option value="month">Last 30 Days</option>
        <option value="year">Last Year</option>
      </select>
    </div>
  );
}
