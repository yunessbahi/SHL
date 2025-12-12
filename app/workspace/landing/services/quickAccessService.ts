/**
 * Quick Access Service - Handles quick action management
 */

import { QuickAction } from "../types/workspaceTypes";

class QuickAccessService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = "/api/workspace";
  }

  /**
   * Fetch available quick actions
   * @returns Promise<QuickAction[]>
   */
  async fetchQuickActions(): Promise<QuickAction[]> {
    try {
      // Call the actual API endpoint
      const response = await fetch("/api/workspace/quick-actions");

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch quick actions");
      }

      return result.data;
    } catch (error) {
      console.error("Error fetching quick actions:", error);
      throw error;
    }
  }

  /**
   * Add a custom quick action
   * @param action Quick action data (without ID)
   * @returns Promise<QuickAction> Created action with ID
   */
  async addCustomAction(action: Omit<QuickAction, "id">): Promise<QuickAction> {
    try {
      // Call the actual API endpoint
      const response = await fetch("/api/workspace/quick-actions/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(action),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to create custom action");
      }

      return result.data;
    } catch (error) {
      console.error("Error adding custom action:", error);
      throw error;
    }
  }
}

export default QuickAccessService;
