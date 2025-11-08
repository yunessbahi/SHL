"use client";

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface AreaChartProps {
  data: Array<{ [key: string]: any }>;
  title?: string;
  description?: string;
  dataKey?: string;
  nameKey?: string;
  height?: number;
  className?: string;
  fillOpacity?: number;
}

export default function AreaChart({
  data,
  title = "Area Chart",
  description,
  dataKey = "value",
  nameKey = "name",
  height = 300,
  className = "",
  fillOpacity = 0.6,
}: AreaChartProps) {
  // Chart configuration
  const chartConfig = {
    [dataKey]: {
      label: "Value",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className={`min-h-[${height}px] w-full`}
        >
          <RechartsAreaChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-value)"
                  stopOpacity={fillOpacity}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-value)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend>
              <ChartLegendContent />
            </ChartLegend>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="var(--color-value)"
              fillOpacity={fillOpacity}
              fill="url(#colorValue)"
            />
          </RechartsAreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
