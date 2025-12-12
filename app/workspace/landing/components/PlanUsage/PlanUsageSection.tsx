import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const UsageCard = () => {
  const metrics = [
    { name: "Edge Requests", used: 317000, total: 1000000, unit: "" },
    { name: "Fast Origin Transfer", used: 3.07, total: 10, unit: " GB" },
    { name: "Speed Insights", used: 791, total: 10000, unit: "" },
    { name: "Fast Data Transfer", used: 90, total: 100, unit: " GB" },
    { name: "Function Duration", used: 3.1, total: 100, unit: " GB-Hrs" },
    { name: "Web Analytics", used: 1300, total: 50000, unit: "" },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  const getPieData = (used: number, total: number) => [
    { name: "used", value: used },
    { name: "remaining", value: total - used },
  ];

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="">
            <CardTitle className="text-xl">Monthly Usage</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Last 30 days
            </CardDescription>
          </div>
          <Button size="sm" className="h-7 text-xs">
            Upgrade
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 ">
        <div className="flex flex-col justify-between h-full">
          <div className="mb-4 p-2 bg-amber-400/5 border border-amber-500/30 dark:border-amber-200/20 text-amber-900/70 dark:text-amber-100/70 rounded">
            <h3 className="font-medium text-sm mb-2">Available Templates</h3>
            <p className="text-xs ">
              These UTM templates are available for links created in this
              campaign.
            </p>
          </div>
          <div className="divide-y">
            {metrics.map((metric, index) => {
              const pieData = getPieData(metric.used, metric.total);
              const percentage = (metric.used / metric.total) * 100;

              return (
                <div
                  key={index}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="h-5 w-5 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={4}
                          outerRadius={9}
                          startAngle={90}
                          endAngle={450}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          <Cell fill="hsl(var(--primary))" />
                          <Cell fill="hsl(var(--muted))" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <span className="flex-1 truncate text-sm">{metric.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatNumber(metric.used)}
                    {metric.unit}
                    <span className="mx-1">/</span>
                    <span className="text-foreground">
                      {formatNumber(metric.total)}
                      {metric.unit}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageCard;
