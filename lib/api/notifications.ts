/**
 * Notification API Client
 * Handles all notification-related API calls to the backend
 */

import { createClient } from "@/lib/supabase/client";

export interface Notification {
  id: number;
  category: "links" | "campaigns" | "system" | "activities" | "insights";
  subtype: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  limit: number;
  offset: number;
}

export interface UnreadNotificationsResponse {
  total_unread: number;
  by_category: Record<string, number>;
}

export interface CreateNotificationRequest {
  category: Notification["category"];
  subtype: string;
  severity: Notification["severity"];
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

class NotificationAPIClient {
  private supabase = createClient();
  private baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  private async makeRequest<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    if (!session) {
      throw new Error("User not authenticated");
    }

    console.log(
      `Making notification API request to: ${this.baseURL}${endpoint}`,
    );

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    console.log("Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();
    console.log("API Response data:", data);
    return data;
  }

  /**
   * Get notifications with optional filtering
   */
  async getNotifications(params?: {
    category?: string;
    severity?: string;
    is_read?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<NotificationListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.category) searchParams.set("category", params.category);
    if (params?.severity) searchParams.set("severity", params.severity);
    if (params?.is_read !== undefined)
      searchParams.set("is_read", params.is_read.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());

    const query = searchParams.toString();
    const endpoint = `/api/notifications${query ? `?${query}` : ""}`;

    return this.makeRequest<NotificationListResponse>(endpoint);
  }

  /**
   * Get unread notifications count and summary
   */
  async getUnreadNotifications(): Promise<UnreadNotificationsResponse> {
    return this.makeRequest<UnreadNotificationsResponse>(
      "/api/notifications/unread",
    );
  }

  /**
   * Get fast unread count
   */
  async getUnreadCount() {
    return this.makeRequest("/api/notifications/unread/count");
  }

  /**
   * Mark a specific notification as read
   */
  async markNotificationRead(
    id: number,
  ): Promise<{ id: number; is_read: boolean; updated_at: string }> {
    return this.makeRequest(`/api/notifications/${id}/read`, {
      method: "PATCH",
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsRead(): Promise<{
    message: string;
    updated_count: number;
  }> {
    return this.makeRequest("/api/notifications/read-all", {
      method: "PATCH",
    });
  }

  /**
   * Delete a specific notification
   */
  async deleteNotification(id: number): Promise<{ message: string }> {
    return this.makeRequest(`/api/notifications/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Delete all read notifications
   */
  async deleteAllReadNotifications(): Promise<{
    message: string;
    deleted_count: number;
  }> {
    return this.makeRequest("/api/notifications/", {
      method: "DELETE",
    });
  }

  /**
   * Create a new notification (admin/system use)
   */
  async createNotification(
    data: CreateNotificationRequest,
  ): Promise<Notification> {
    return this.makeRequest("/api/notifications/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Create a test notification to verify the system works
   */
  async createTestNotification(): Promise<Notification> {
    return this.makeRequest("/api/notifications/test", {
      method: "POST",
    });
  }

  /**
   * Run the notification engine to check for new notifications
   */
  async runNotificationEngine(): Promise<{
    message: string;
    created_count: number;
    debug_data?: any;
  }> {
    return this.makeRequest("/api/notifications/engine/run", {
      method: "POST",
    });
  }

  async cleanupDuplicateNotifications(): Promise<{
    message: string;
    deleted_count: number;
    final_count: number;
  }> {
    return this.makeRequest("/api/notifications/cleanup-duplicates", {
      method: "POST",
    });
  }

  /**
   * Debug endpoint to check user's data for notification rules
   */
  async debugUserData(): Promise<{
    user_id: string;
    expiring_links_count: number;
    expiring_within_30_days_count: number;
    sample_expiring_links: Array<{
      id: number;
      short_code: string;
      expires_at: string;
    }>;
    expired_links_count: number;
    expiring_campaigns_count: number;
    expired_campaigns_count: number;
    campaign_mismatches_count: number;
    active_links_expired_campaigns_count: number;
    total_links: number;
    total_campaigns: number;
  }> {
    return this.makeRequest("/api/notifications/debug");
  }

  /**
   * Get notifications grouped by category (for UI display)
   */
  async getNotificationsGroupedByCategory(): Promise<{
    [category: string]: Notification[];
  }> {
    const response = await this.getNotifications({ limit: 100 });
    const grouped: { [category: string]: Notification[] } = {};

    response.notifications.forEach((notification) => {
      if (!grouped[notification.category]) {
        grouped[notification.category] = [];
      }
      grouped[notification.category].push(notification);
    });

    return grouped;
  }

  /**
   * Get recent notifications (last 24 hours)
   */
  async getRecentNotifications(hours: number = 24): Promise<Notification[]> {
    // Note: This would require a backend endpoint for time-based filtering
    // For now, we'll fetch recent notifications and filter client-side
    const response = await this.getNotifications({ limit: 50 });
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    return response.notifications.filter((notification) => {
      const createdAt = new Date(notification.created_at);
      return createdAt >= cutoffTime;
    });
  }
}

export const notificationAPI = new NotificationAPIClient();

/**
 * Format notification timestamp for display
 */
export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );
    return diffInMinutes <= 1 ? "Just now" : `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
}

/**
 * Get severity color for UI display
 */
export function getSeverityColor(severity: Notification["severity"]): string {
  switch (severity) {
    case "low":
      return "text-gray-600";
    case "medium":
      return "text-yellow-600";
    case "high":
      return "text-orange-600";
    case "critical":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(
  category: Notification["category"],
): string {
  switch (category) {
    case "links":
      return "Links";
    case "campaigns":
      return "Campaigns";
    case "system":
      return "System";
    case "activities":
      return "Activities";
    case "insights":
      return "Insights";
    default:
      return category;
  }
}
