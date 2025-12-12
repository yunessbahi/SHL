import { Activity } from "@/app/workspace/landing/types/workspaceTypes";
import { NextResponse } from "next/server";

/**
 * GET /api/workspace/activities
 * Fetch recent activities with optional filtering
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "10";
    const offset = searchParams.get("offset") || "0";
    const type = searchParams.get("type") || "all";
    const timeRange = searchParams.get("timeRange") || "week";

    // Mock data - in production this would come from a database
    const mockActivities: Activity[] = [
      {
        id: "1",
        type: "link_created",
        timestamp: new Date().toISOString(),
        content: "You created a new Smart Link",
        metadata: { linkId: "link_123", campaign: "Summer Sale" },
      },
      {
        id: "2",
        type: "campaign_started",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        content: 'Your campaign "Summer Sale" started',
        metadata: { campaignId: "camp_456", links: 3 },
      },
      {
        id: "3",
        type: "link_updated",
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        content: "You updated link settings",
        metadata: { linkId: "link_789", changes: ["targeting", "schedule"] },
      },
      {
        id: "4",
        type: "link_created",
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        content: "You created a new Single Link",
        metadata: { linkId: "link_101", destination: "https://example.com" },
      },
      {
        id: "5",
        type: "campaign_started",
        timestamp: new Date(Date.now() - 345600000).toISOString(),
        content: 'Your campaign "Black Friday" started',
        metadata: { campaignId: "camp_789", links: 5 },
      },
      {
        id: "6",
        type: "link_created",
        timestamp: new Date(Date.now() - 604800000).toISOString(),
        content: "You created a new campaign link",
        metadata: { linkId: "link_202", campaign: "Winter Sale" },
      },
      {
        id: "7",
        type: "link_updated",
        timestamp: new Date(Date.now() - 1209600000).toISOString(),
        content: "You updated campaign targeting",
        metadata: { linkId: "link_303", changes: ["audience"] },
      },
    ];

    // Apply filtering
    let filteredActivities = [...mockActivities];

    if (type !== "all") {
      filteredActivities = filteredActivities.filter(
        (activity) => activity.type === type,
      );
    }

    // Apply time range filtering
    const now = new Date();
    let timeRangeStart: Date;

    switch (timeRange) {
      case "day":
        timeRangeStart = new Date(now.getTime() - 86400000); // 24 hours
        break;
      case "week":
        timeRangeStart = new Date(now.getTime() - 604800000); // 7 days
        break;
      case "month":
        timeRangeStart = new Date(now.getTime() - 2592000000); // 30 days
        break;
      case "year":
        timeRangeStart = new Date(now.getTime() - 31536000000); // 365 days
        break;
      default:
        timeRangeStart = new Date(now.getTime() - 604800000); // default to week
    }

    filteredActivities = filteredActivities.filter((activity) => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= timeRangeStart;
    });

    // Apply pagination
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    const paginatedActivities = filteredActivities.slice(start, end);

    return NextResponse.json({
      success: true,
      data: paginatedActivities,
      total: filteredActivities.length,
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activities" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/workspace/activities
 * Create a new activity (for testing purposes)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.content) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Mock creation - in production this would save to database
    const newActivity: Activity = {
      id: `activity_${Date.now()}`,
      type: body.type,
      timestamp: new Date().toISOString(),
      content: body.content,
      metadata: body.metadata || {},
    };

    return NextResponse.json({
      success: true,
      data: newActivity,
    });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create activity" },
      { status: 500 },
    );
  }
}
