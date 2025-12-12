/**
 * Workspace Landing Page Type Definitions
 */

// Activity Types
export interface Activity {
  id: string;
  type: "link_created" | "link_updated" | "campaign_started" | "notification";
  timestamp: Date | string;
  content: string;
  metadata?: Record<string, any>;
  readStatus?: boolean;
}

// Quick Access Types
export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  isCustom?: boolean;
}

// Stats Types
export interface UserStats {
  totalLinks: number;
  activeLinks: number;
  totalClicks: number;
  clickThroughRate: number;
  topPerformingLink?: string;
}

export interface LinkCreationStats {
  timestamps: Date[] | string[];
  counts: number[];
  growthRate: number;
}

// Time Range Type
export type TimeRange = "day" | "week" | "month" | "year";

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Filter Types
export interface ActivityFilter {
  type?: "all" | "links" | "notifications" | "campaigns";
  timeRange?: TimeRange;
  limit?: number;
  offset?: number;
}
