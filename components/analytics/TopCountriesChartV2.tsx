// import React from 'react';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, ResponsiveContainer } from 'recharts';
// import { MoreVertical } from 'lucide-react';
// import {
//     ChartConfig,
//     ChartContainer,
//     ChartTooltip,
//     ChartTooltipContent,
//   } from "@/components/ui/chart"

// // Custom Tooltip Component
// const CustomTooltip = ({ active, payload }: any) => {
//   if (active && payload && payload.length) {
//     return (
//       <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
//         <div className="flex flex-col gap-1">
//           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
//             {payload[0].payload.country}
//           </p>
//           <div className="flex items-center gap-2">
//             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill }}></div>
//             <p className="text-xs font-mono text-slate-900 dark:text-slate-100">
//               {payload[0].value.toLocaleString()}
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }
//   return null;
// };

// const data = [
//   { country: 'IN', sales: 20000 },
//   { country: 'US', sales: 18988 },
//   { country: 'CA', sales: 15473 },
//   { country: 'JA', sales: 13042 },
//   { country: 'AU', sales: 9933 },
// ];

// const chartConfig = {
//     sales: {
//       label: "sales",
//       color: "var(--chart-1)"
//     },
//   } satisfies ChartConfig

//   const VerticalTooltipContent = (props: any) => {
//     const { active, payload } = props;
//     if (!active || !payload?.length) return null;

//     const item = payload[0];
//     return (
//       <ChartTooltipContent
//         hideLabel
//         label={item.payload.country} // <-- manually pass your Y-axis label
//         payload={payload}
//       />
//     );
//   };

// export default function SalesCountryChart() {
//   return (
//     <div className=''>
//       <div className="bg-card text-slate-950 dark:text-slate-50 flex flex-col gap-6 rounded-xl border border-slate-200 dark:border-slate-800 py-6 shadow-sm w-full max-w-2xl">
//         {/* Card Header */}
//         <div className="px-6 flex justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-6">
//           <div className="flex flex-col gap-1">
//             <span className="text-lg font-semibold">Sale Country</span>
//             <span className="text-slate-500 dark:text-slate-400 text-sm">until your daily purchase target</span>
//           </div>
//           <button
//             className="inline-flex shrink-0 items-center justify-center text-sm font-medium whitespace-nowrap transition-all outline-none hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 size-6 rounded-full"
//             type="button"
//           >
//             <MoreVertical className="size-4" />
//             <span className="sr-only">Menu</span>
//           </button>
//         </div>

//         {/* Chart Content */}
//         <div className="px-6 flex flex-1">
//           {/* <ResponsiveContainer width="100%" height={220} className=""> */}
//           <ChartContainer config={chartConfig} className="h-[220px] w-full">
//             <BarChart
//             accessibilityLayer
//               data={data}
//               layout="vertical"
//               margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
//             >
//               <CartesianGrid
//                 strokeDasharray="4"
//                 stroke="rgb(226 232 240)"
//                 className="dark:stroke-slate-800"
//                 vertical={true}
//                 horizontal={false}
//               />
//               <XAxis
//                 type="number"
//                 dataKey="sales"
//                 domain={[0, 20000]}
//                 ticks={[0, 4000, 8000, 12000, 16000, 20000]}
//                 tickFormatter={(value) => `${value / 1000}K`}
//                 //stroke="hsl(0 0% 63.9%)"
//                 //className='stroke-accent-foreground'
//                 fontSize={12}
//                 tickLine={false}
//                 axisLine={false}
//               />
//               <YAxis
//                 type="category"
//                 dataKey="country"
//                 //stroke="hsl(0 0% 63.9%)"
//                 fontSize={14}
//                 tickLine={false}
//                 axisLine={false}
//                 width={30}
//               />
//               <Bar
//                 dataKey="sales"
//                 fill='hsl(0 0% 98%)'
//                 radius={[6, 6, 6, 6]}
//                 barSize={24}
//                 className='fill-accent-foreground'
//               >
//                 <LabelList
//                   dataKey="sales"
//                   position="insideLeft"
//                   offset={10}
//                   className="fill-accent text-xs font-normal"
//                 />
//               </Bar>
//               <ChartTooltip labelClassName='text-red-500' cursor={false} content={<CustomTooltip />} />

//             </BarChart>
//           </ChartContainer>
//         </div>
//       </div>
//       </div>
//   );
// }

"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import { Globe, RefreshCw } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import {
  analyticsAPI,
  type GeoBreakdownPoint,
  formatNumber,
} from "@/lib/analytics-api";

interface SalesCountryChartProps {
  data?: GeoBreakdownPoint[];
  period: string;
  granularity?: "country" | "region" | "city";
  topN?: number;
  title?: string;
  description?: string;
  className?: string;
  showLoading?: boolean;
  width_?: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {payload[0].payload.country}
          </p>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: payload[0].fill }}
            ></div>
            <p className="text-xs font-mono text-slate-900 dark:text-slate-100">
              {formatNumber(payload[0].value)}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const chartConfig = {
  sales: {
    label: "Sales",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export default function SalesCountryChart({
  data: propData,
  period,
  granularity = "country",
  topN = 5,
  title = "Top Countries",
  description = "until your daily purchase target",
  className = "",
  showLoading = true,
  width_ = 20,
}: SalesCountryChartProps) {
  const [data, setData] = useState<{ country: string; sales: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (propData) return;

    try {
      setLoading(true);
      setError(null);

      const result = await analyticsAPI.getGlobalTopCountries(
        granularity,
        period,
        topN,
      );

      setData(
        result.slice(0, topN).map((item) => ({
          country: item.location,
          sales: item.click_count,
        })),
      );
    } catch (err) {
      console.error("Failed to fetch top countries:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");

      // Fallback data
      const fallbackData = [
        { country: "United States", sales: 2450 },
        { country: "United Kingdom", sales: 1230 },
        { country: "Canada", sales: 890 },
        { country: "Germany", sales: 670 },
        { country: "Australia", sales: 450 },
      ];
      setData(fallbackData.slice(0, topN));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, granularity, topN, propData]);

  const isLoading = showLoading && loading;

  return (
    <div className={className}>
      <div className="bg-card text-slate-950 dark:text-slate-50 flex flex-col gap-6 rounded-xl border border-slate-200 dark:border-slate-800 py-6 shadow-sm w-full max-w-2xl">
        {/* Header */}
        <div className="px-6 flex justify-between items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Globe className="size-5 text-slate-500 dark:text-slate-400" />
              <span className="text-lg font-semibold">{title}</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="text-xs"
          >
            {/* {loading ? "Loading..." : "Refresh"} */}
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Chart */}
        <div className="px-6 flex flex-1">
          {isLoading ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-slate-500">
              Loading...
            </div>
          ) : error ? (
            <div className="h-[220px] flex items-center justify-center flex-col gap-2 text-center text-sm text-slate-500">
              <p>Error loading data</p>
              <Button variant="outline" size="sm" onClick={fetchData}>
                Try Again
              </Button>
            </div>
          ) : data.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-slate-500">
              No data available
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="h-[180px] w-full p-0 m-0"
            >
              <BarChart
                accessibilityLayer
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="4"
                  stroke="rgb(226 232 240)"
                  className="dark:stroke-slate-800"
                  vertical
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, Math.max(...data.map((d) => d.sales), 1)]}
                  //tickFormatter={(v) => `${Math.round(v / 1000)}K`}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="country"
                  fontSize={14}
                  tickLine={false}
                  axisLine={false}
                  width={width_}
                />
                <Bar
                  dataKey="sales"
                  fill="hsl(0 0% 98%)"
                  radius={[4, 4, 4, 4]}
                  barSize={22}
                  className="fill-accent-foreground"
                >
                  <LabelList
                    dataKey="sales"
                    position="insideLeft"
                    offset={10}
                    className="fill-accent text-xs font-normal"
                    formatter={(value: number) => formatNumber(value)}
                  />
                </Bar>
                <ChartTooltip cursor={false} content={<CustomTooltip />} />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </div>
    </div>
  );
}
