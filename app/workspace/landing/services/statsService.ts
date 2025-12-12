/**
 * Stats Service - Handles statistics and analytics data
 */

import {
  LinkCreationStats,
  TimeRange,
  UserStats,
} from "../types/workspaceTypes";

class StatsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = "/api/workspace";
  }

  /**
   * Fetch user statistics
   * @param timeRange Time range for statistics
   * @returns Promise<UserStats>
   */
  async fetchUserStats(timeRange: TimeRange = "week"): Promise<UserStats> {
    try {
      // Call the actual API endpoint
      const response = await fetch(
        `/api/workspace/stats/user?time_range=${timeRange}`,
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch user stats");
      }

      return result.data;
    } catch (error) {
      console.error("Error fetching user stats:", error);
      throw error;
    }
  }

  /**
   * Fetch link creation statistics
   * @param timeRange Time range for statistics
   * @returns Promise<LinkCreationStats>
   */
  async fetchLinkCreationStats(
    timeRange: TimeRange = "week",
  ): Promise<LinkCreationStats> {
    try {
      // Call the actual API endpoint
      const response = await fetch(
        `/api/workspace/stats/links?time_range=${timeRange}`,
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch link creation stats");
      }

      return result.data;
    } catch (error) {
      console.error("Error fetching link creation stats:", error);
      throw error;
    }
  }
}

export default StatsService;
