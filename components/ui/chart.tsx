import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { cn } from "@/lib/utils";

export interface ChartConfig {
  [key: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
    color?: string;
    theme?: {
      light: string;
      dark: string;
    };
  };
}

type ChartProps = React.HTMLAttributes<HTMLDivElement> & {
  config: ChartConfig;
};

const ChartContainer = React.forwardRef<HTMLDivElement, ChartProps>(
  ({ config, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick-value]:fill-foreground [&_.recharts-cartesian-grid]:[stroke-linecap:butt] [&_.recharts-cartesian-grid-line]:[stroke:theme(colors.border)] [&_.recharts-curve.recharts-tooltip-cursor]:stroke-muted [&_.recharts-dot.recharts-tooltip-cursor]:fill-muted [&_.recharts-layer]:outline-none [&_.recharts-polar-grid]:[stroke:theme(colors.border)] [&_.recharts-radial-grid-line]:[stroke:theme(colors.border)] [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line]:[stroke:theme(colors.border)] [&_.recharts-sector.recharts-tooltip-cursor]:fill-muted [&_.recharts-sector]:[stroke:theme(colors.background)] [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    );
  },
);
ChartContainer.displayName = "ChartContainer";

const ChartTooltip = Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
  }
>(
  (
    {
      hideLabel,
      hideIndicator,
      indicator = "dot",
      nameKey,
      labelKey,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md outline-none",
          className,
        )}
        {...props}
      />
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltipContent";

const ChartLegend = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    nameKey?: string;
  }
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", className)}
      {...props}
    />
  );
});
ChartLegend.displayName = "ChartLegend";

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    className?: string;
    nameKey?: string;
  }
>(({ className, nameKey, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", className)}
      {...props}
    />
  );
});
ChartLegendContent.displayName = "ChartLegendContent";

const ChartTooltipEmpty = () => (
  <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md">
    <div className="text-center text-sm text-muted-foreground">
      No data available
    </div>
  </div>
);

const ChartTooltipVerticalLine = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-w-[8rem] items-center gap-1.5 rounded-lg border bg-popover p-2 text-popover-foreground shadow-md",
        className,
      )}
      {...props}
    />
  );
});
ChartTooltipVerticalLine.displayName = "ChartTooltipVerticalLine";

const ChartTooltipHorizontalLine = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-[8rem] items-center gap-1.5 rounded-lg border bg-popover p-2 text-popover-foreground shadow-md",
        className,
      )}
      {...props}
    />
  );
});
ChartTooltipHorizontalLine.displayName = "ChartTooltipHorizontalLine";

export {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartTooltipEmpty,
  ChartTooltipVerticalLine,
  ChartTooltipHorizontalLine,
};
