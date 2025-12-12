require("@testing-library/jest-dom");

// Mock API responses for testing
const mockApiResponses = {
  "/api/workspace/activities": {
    success: true,
    data: [
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
    ],
    total: 2,
  },
  "/api/workspace/notifications": {
    success: true,
    data: [
      {
        id: "1",
        type: "notification",
        timestamp: new Date().toISOString(),
        content: "New feature available",
        readStatus: false,
      },
    ],
  },
  "/api/workspace/quick-actions": {
    success: true,
    data: [
      {
        id: "create_link",
        title: "Create Link",
        description: "Create a new smart link",
        icon: "link",
        route: "/workspace/create",
      },
      {
        id: "view_stats",
        title: "View Stats",
        description: "View your link statistics",
        icon: "chart",
        route: "/workspace/stats",
      },
    ],
  },
  "/api/workspace/stats/user": {
    success: true,
    data: {
      totalLinks: 42,
      activeLinks: 28,
      totalClicks: 1245,
      clickThroughRate: 4.2,
      topPerformingLink: "link_123",
    },
  },
  "/api/workspace/stats/links": {
    success: true,
    data: {
      timestamps: [new Date().toISOString()],
      counts: [5],
      growthRate: 10.5,
    },
  },
};

// Mock fetch implementation
global.fetch = jest.fn((url, options) => {
  // Handle POST requests for adding custom actions
  if (
    options &&
    options.method === "POST" &&
    url.includes("/api/workspace/quick-actions/custom")
  ) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            id: "custom_1",
            title: "Test Action",
            description: "Test description",
            icon: "test",
            route: "/test",
            isCustom: true,
          },
        }),
    });
  }

  // Handle different API endpoints
  if (url.includes("/api/workspace/activities")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve(mockApiResponses["/api/workspace/activities"]),
    });
  } else if (url.includes("/api/workspace/notifications")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve(mockApiResponses["/api/workspace/notifications"]),
    });
  } else if (url.includes("/api/workspace/quick-actions")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve(mockApiResponses["/api/workspace/quick-actions"]),
    });
  } else if (url.includes("/api/workspace/stats/user")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve(mockApiResponses["/api/workspace/stats/user"]),
    });
  } else if (url.includes("/api/workspace/stats/links")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve(mockApiResponses["/api/workspace/stats/links"]),
    });
  }

  // Default response for other endpoints
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: {} }),
  });
});
