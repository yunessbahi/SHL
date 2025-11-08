"use client";

import {
  BarChart,
  Bar,
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

interface BarChartProps {
  data: Array<{ [key: string]: any }>;
  title?: string;
  description?: string;
  dataKey?: string;
  nameKey?: string;
  height?: number;
  className?: string;
  colors?: string[];
}

export default function BarChart({
  data,
  title = "Bar Chart",
  description,
  dataKey = "value",
  nameKey = "name",
  height = 300,
  className = "",
  colors = [],
}: BarChartProps) {
  // Chart configuration
  const chartConfig = {
    [dataKey]: {
      label: "Value",
      color: "hsl(var(--chart-1))",
    },
  };

  // Use provided colors or fall back to default chart colors
  const defaultColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

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
          <BarChart
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
            <Bar
              dataKey={dataKey}
              fill="var(--color-value)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
