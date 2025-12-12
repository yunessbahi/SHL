import { LinkCreationStats } from "@/app/workspace/landing/types/workspaceTypes";
import { NextResponse } from "next/server";

/**
 * GET /api/workspace/stats/links
 * Fetch link creation statistics
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("time_range") || "week";
    const groupBy = searchParams.get("group_by") || "day";

    // Generate mock data based on time range
    let daysCount = 7;
    let groupCount = 7;

    switch (timeRange) {
      case "day":
        daysCount = 1;
        groupCount = 24; // hours
        break;
      case "month":
        daysCount = 30;
        groupCount = 30;
        break;
      case "year":
        daysCount = 365;
        groupCount = 12; // months
        break;
    }

    // Generate timestamps
    const timestamps: string[] = [];
    const counts: number[] = [];

    for (let i = 0; i < groupCount; i++) {
      const date = new Date();
      if (timeRange === "day") {
        date.setHours(date.getHours() - (groupCount - 1 - i));
      } else {
        date.setDate(date.getDate() - (groupCount - 1 - i));
      }
      timestamps.push(date.toISOString());

      // Generate realistic counts with some variation
      const baseCount = 2 + Math.floor(Math.random() * 5);
      counts.push(baseCount);
    }

    // Calculate growth rate (mock)
    const firstPeriodSum = counts
      .slice(0, Math.floor(groupCount / 2))
      .reduce((a, b) => a + b, 0);
    const secondPeriodSum = counts
      .slice(Math.floor(groupCount / 2))
      .reduce((a, b) => a + b, 0);
    const growthRate =
      secondPeriodSum > 0
        ? ((secondPeriodSum - firstPeriodSum) / firstPeriodSum) * 100
        : 0;

    const stats: LinkCreationStats = {
      timestamps,
      counts,
      growthRate: parseFloat(growthRate.toFixed(1)),
    };

    return NextResponse.json({
      success: true,
      data: stats,
      timeRange,
      groupBy,
    });
  } catch (error) {
    console.error("Error fetching link creation stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch link creation stats" },
      { status: 500 },
    );
  }
}
