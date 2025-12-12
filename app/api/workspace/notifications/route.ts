import { Activity } from "@/app/workspace/landing/types/workspaceTypes";
import { NextResponse } from "next/server";

/**
 * GET /api/workspace/notifications
 * Fetch notifications with optional filtering
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "5";
    const offset = searchParams.get("offset") || "0";
    const readStatus = searchParams.get("read_status");

    // Mock notification data
    const mockNotifications: Activity[] = [
      {
        id: "notif_1",
        type: "notification",
        timestamp: new Date().toISOString(),
        content: 'Your link "Summer Sale" has received 100+ clicks!',
        metadata: { linkId: "link_123", clicks: 105 },
        readStatus: false,
      },
      {
        id: "notif_2",
        type: "notification",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        content: 'Campaign "Black Friday" is performing well',
        metadata: { campaignId: "camp_456", performance: "high" },
        readStatus: true,
      },
      {
        id: "notif_3",
        type: "notification",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        content: "New feature available: Smart Link Rules",
        metadata: { feature: "smart_link_rules", version: "2.1.0" },
        readStatus: false,
      },
      {
        id: "notif_4",
        type: "notification",
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        content: "Your account usage is increasing",
        metadata: { usage: "85%", limit: "1000 links" },
        readStatus: false,
      },
      {
        id: "notif_5",
        type: "notification",
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        content: "Maintenance scheduled for tomorrow",
        metadata: { maintenanceWindow: "02:00-04:00 UTC" },
        readStatus: true,
      },
    ];

    // Apply filtering
    let filteredNotifications = [...mockNotifications];

    if (readStatus) {
      const isRead = readStatus === "true";
      filteredNotifications = filteredNotifications.filter(
        (notification) => notification.readStatus === isRead,
      );
    }

    // Apply pagination
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    const paginatedNotifications = filteredNotifications.slice(start, end);

    return NextResponse.json({
      success: true,
      data: paginatedNotifications,
      total: filteredNotifications.length,
      unreadCount: filteredNotifications.filter((n) => !n.readStatus).length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/workspace/notifications/mark-read
 * Mark notifications as read
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.notification_ids || !Array.isArray(body.notification_ids)) {
      return NextResponse.json(
        { success: false, error: "Invalid notification IDs" },
        { status: 400 },
      );
    }

    // Mock implementation - in production this would update database
    console.log(
      `Marking notifications as read: ${body.notification_ids.join(", ")}`,
    );

    return NextResponse.json({
      success: true,
      message: `Marked ${body.notification_ids.length} notifications as read`,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark notifications as read" },
      { status: 500 },
    );
  }
}
