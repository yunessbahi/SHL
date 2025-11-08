"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: number;
  change?: number | null;
  icon: ReactNode;
  loading?: boolean;
  formatter?: (value: number) => string;
}

export default function KPICard({
  title,
  value,
  change,
  icon,
  loading = false,
  formatter = (val) => val.toLocaleString(),
}: KPICardProps) {
  const formatValue = (val: number) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + "M";
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + "K";
    }
    return formatter(val);
  };

  const getChangeColor = (changeValue: number) => {
    return changeValue >= 0 ? "text-green-600" : "text-red-600";
  };

  const getChangeIcon = (changeValue: number) => {
    return changeValue >= 0 ? (
      <TrendingUp className="h-3 w-3" />
    ) : (
      <TrendingDown className="h-3 w-3" />
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-16 mt-2"></div>
          <div className="h-3 bg-gray-200 rounded w-24 mt-2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        <div className="text-gray-400">{icon}</div>
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatValue(value)}
        </p>
        {change !== null && change !== undefined && (
          <div
            className={`flex items-center mt-1 text-sm ${getChangeColor(change)}`}
          >
            {getChangeIcon(change)}
            <span className="ml-1">
              {Math.abs(change).toFixed(1)}% vs previous period
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
