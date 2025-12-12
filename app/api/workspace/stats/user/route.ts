import { UserStats } from "@/app/workspace/landing/types/workspaceTypes";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * GET /api/workspace/stats/user
 * Fetch user statistics
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("time_range") || "week";

    // Base mock stats
    let mockStats: UserStats = {
      totalLinks: 42,
      activeLinks: 28,
      totalClicks: 1245,
      clickThroughRate: 4.2,
      topPerformingLink: "link_123",
    };

    // Adjust stats based on time range
    switch (timeRange) {
      case "day":
        mockStats = {
          ...mockStats,
          totalLinks: 3,
          activeLinks: 2,
          totalClicks: 45,
          clickThroughRate: 3.8,
        };
        break;
      case "month":
        mockStats = {
          ...mockStats,
          totalLinks: 120,
          activeLinks: 85,
          totalClicks: 3850,
          clickThroughRate: 4.5,
        };
        break;
      case "year":
        mockStats = {
          ...mockStats,
          totalLinks: 480,
          activeLinks: 320,
          totalClicks: 18500,
          clickThroughRate: 4.8,
        };
        break;
      // week is default
    }

    return NextResponse.json({
      success: true,
      data: mockStats,
      timeRange,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user stats" },
      { status: 500 },
    );
  }
}
