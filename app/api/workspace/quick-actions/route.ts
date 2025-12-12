import { QuickAction } from "@/app/workspace/landing/types/workspaceTypes";
import { NextResponse } from "next/server";

/**
 * GET /api/workspace/quick-actions
 * Fetch available quick actions
 */
export async function GET(request: Request) {
  try {
    // Mock quick actions data
    const mockQuickActions: QuickAction[] = [
      {
        id: "create-single-link",
        title: "Create Single Link",
        description: "Create a basic link with custom destination",
        icon: "link",
        route: "/workspace/create",
      },
      {
        id: "create-smart-link",
        title: "Create Smart Link",
        description: "Create an intelligent link with rules and targeting",
        icon: "smart",
        route: "/workspace/create/smart",
      },
      {
        id: "view-analytics",
        title: "View Analytics",
        description: "Check your link performance and analytics",
        icon: "analytics",
        route: "/analytics",
      },
      {
        id: "manage-campaigns",
        title: "Manage Campaigns",
        description: "View and manage your marketing campaigns",
        icon: "campaign",
        route: "/workspace/campaigns",
      },
      {
        id: "view-links",
        title: "View All Links",
        description: "Browse and manage all your links",
        icon: "list",
        route: "/workspace/links",
      },
      {
        id: "create-group",
        title: "Create Link Group",
        description: "Organize links into groups",
        icon: "group",
        route: "/workspace/groups/create",
      },
    ];

    return NextResponse.json({
      success: true,
      data: mockQuickActions,
    });
  } catch (error) {
    console.error("Error fetching quick actions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch quick actions" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/workspace/quick-actions/custom
 * Add a custom quick action
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.route) {
      return NextResponse.json(
        { success: false, error: "Title and route are required" },
        { status: 400 },
      );
    }

    // Mock creation - in production this would save to database
    const newAction: QuickAction = {
      id: `custom_${Date.now()}`,
      title: body.title,
      description: body.description || "",
      icon: body.icon || "default",
      route: body.route,
      isCustom: true,
    };

    return NextResponse.json({
      success: true,
      data: newAction,
    });
  } catch (error) {
    console.error("Error creating custom quick action:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create custom quick action" },
      { status: 500 },
    );
  }
}
