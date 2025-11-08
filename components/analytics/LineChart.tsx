"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
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

interface LineChartProps {
  data: Array<{ [key: string]: any }>;
  title?: string;
  description?: string;
  dataKey?: string;
  nameKey?: string;
  height?: number;
  className?: string;
  showDots?: boolean;
  enableArea?: boolean;
  areaFillOpacity?: number;
}

export default function LineChart({
  data,
  title = "Line Chart",
  description,
  dataKey = "value",
  nameKey = "name",
  height = 300,
  className = "",
  showDots = true,
  enableArea = false,
  areaFillOpacity = 0.3,
}: LineChartProps) {
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
          <RechartsLineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend>
              <ChartLegendContent />
            </ChartLegend>
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={
                showDots
                  ? { fill: "var(--color-value)", strokeWidth: 2, r: 4 }
                  : false
              }
              activeDot={{ r: 6 }}
            />
            {enableArea && (
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke="var(--color-value)"
                fill="var(--color-value)"
                fillOpacity={areaFillOpacity}
              />
            )}
          </RechartsLineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
