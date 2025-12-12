"use client";

import { Activity } from "../../types/workspaceTypes";

interface RecentActivitiesProps {
  activities: Activity[];
  isLoading: boolean;
  timeRange: string;
  onViewAllActivities?: () => void;
}

export default function RecentActivities({
  activities,
  isLoading,
  timeRange,
  onViewAllActivities,
}: RecentActivitiesProps) {
  // Format timestamp for display
  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "link_created":
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
        );
      case "campaign_started":
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
      case "link_updated":
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Activities
            </h3>
            <div className="flex items-center space-x-2">
              <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
                <option>All Types</option>
                <option>Links</option>
                <option>Campaigns</option>
                <option>Notifications</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 capitalize">
              {timeRange} view
            </span>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {isLoading ? (
          <div className="p-4">
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-start space-x-4 animate-pulse"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-gray-500">No recent activities found</p>
          </div>
        ) : (
          activities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {activity.content}
                    </h4>
                    <time className="text-xs text-gray-500 whitespace-nowrap">
                      {formatTimestamp(activity.timestamp)}
                    </time>
                  </div>
                  {activity.metadata &&
                    Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {Object.entries(activity.metadata).map(
                          ([key, value]) => (
                            <span
                              key={key}
                              className="px-2 py-1 bg-gray-100 rounded-full text-gray-600"
                            >
                              {key}:{" "}
                              {typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value)}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                </div>

                <div className="flex-shrink-0">
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={onViewAllActivities}
          className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
        >
          View All Activities
        </button>
      </div>
    </div>
  );
}
