/**
 * Activity Service - Handles activity-related API calls and data processing
 */

import { Activity, ActivityFilter } from "../types/workspaceTypes";

class ActivityService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = "/api/workspace";
  }

  /**
   * Fetch recent activities
   * @param filter Optional filter parameters
   * @returns Promise<Activity[]>
   */
  async fetchRecentActivities(filter?: ActivityFilter): Promise<Activity[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filter) {
        if (filter.limit) params.append("limit", filter.limit.toString());
        if (filter.offset) params.append("offset", filter.offset.toString());
        if (filter.type && filter.type !== "all")
          params.append("type", filter.type);
        if (filter.timeRange) params.append("timeRange", filter.timeRange);
      }

      // Call the actual API endpoint
      const response = await fetch(
        `/api/workspace/activities?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch activities");
      }

      return result.data;
    } catch (error) {
      console.error("Error fetching activities:", error);
      throw error;
    }
  }

  /**
   * Fetch notifications
   * @param limit Number of notifications to fetch
   * @returns Promise<Activity[]>
   */
  async fetchNotifications(limit: number = 5): Promise<Activity[]> {
    try {
      // Call the actual API endpoint
      const response = await fetch(
        `/api/workspace/notifications?limit=${limit}`,
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch notifications");
      }

      return result.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   * @param ids Array of notification IDs to mark as read
   * @returns Promise<boolean> Success status
   */
  async markNotificationsAsRead(ids: string[]): Promise<boolean> {
    try {
      // Call the actual API endpoint
      const response = await fetch("/api/workspace/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notification_ids: ids }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to mark notifications as read");
      }

      return true;
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      throw error;
    }
  }
}

export default ActivityService;
