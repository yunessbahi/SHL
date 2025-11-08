// Analytics API client for connecting to FastAPI backend
import { createClient } from "@/lib/supabase/client";

export interface AnalyticsOverview {
  total_clicks: number;
  total_links: number;
  active_campaigns: number;
  new_links_created: number;
  clicks_change_vs_previous?: number;
  period: string;
}

export interface TimeSeriesPoint {
  bucket_start: string;
  bucket_end: string;
  total_clicks: number;
  unique_links: number;
  mobile_clicks: number;
  desktop_clicks: number;
}

export interface DeviceBreakdownPoint {
  device_type: string;
  browser_name: string;
  os_name: string;
  click_count: number;
  percentage: number;
  unique_visitors: number;
}

export interface GeoBreakdownPoint {
  location: string;
  click_count: number;
  unique_visitors: number;
  percentage: number;
}

export interface UTMBreakdownPoint {
  medium: string;
  total_clicks: number;
  sources: Array<{
    source: string;
    clicks: number;
  }>;
}

export interface TargetPerformancePoint {
  target_id: number;
  target_url: string;
  weight: number;
  click_count: number;
  click_rate_per_weight: number;
}

export interface TrafficSourcePoint {
  source: string;
  click_count: number;
  unique_visitors: number;
  percentage: number;
}

export interface AnalyticsFilters {
  start_date?: string;
  end_date?: string;
  device_type?: string;
  browser_name?: string;
  country?: string;
  campaign_id?: number;
  link_id?: number;
}

export interface ExploreResponse {
  data: Array<Record<string, any>>;
  total_count: number;
  filters_applied: AnalyticsFilters;
  metrics_requested: string[];
  dimensions_requested: string[];
}

class AnalyticsAPIClient {
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

    console.log(`Making API request to: ${this.baseURL}${endpoint}`);
    console.log("Auth token:", session.access_token ? "Present" : "Missing");

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

  // Get overview analytics
  async getOverview(period: string = "7d"): Promise<AnalyticsOverview> {
    return this.makeRequest<AnalyticsOverview>(
      `/api/analytics/overview?period=${period}`,
    );
  }

  // Get time series data for a campaign
  async getCampaignTimeSeries(
    campaignId: number,
    interval: string = "day",
    period: string = "30d",
  ): Promise<TimeSeriesPoint[]> {
    return this.makeRequest<TimeSeriesPoint[]>(
      `/api/analytics/campaigns/${campaignId}/time-series?interval=${interval}&period=${period}`,
    );
  }

  // Get global time series data for all user's clicks
  async getGlobalTimeSeries(
    interval: string = "day",
    period: string = "30d",
  ): Promise<TimeSeriesPoint[]> {
    return this.makeRequest<TimeSeriesPoint[]>(
      `/api/analytics/time-series?interval=${interval}&period=${period}`,
    );
  }

  // Get device breakdown for a link
  async getLinkDeviceBreakdown(
    linkId: number,
    period: string = "30d",
  ): Promise<DeviceBreakdownPoint[]> {
    return this.makeRequest<DeviceBreakdownPoint[]>(
      `/api/analytics/links/${linkId}/device-breakdown?period=${period}`,
    );
  }

  // Get geographic breakdown for a campaign
  async getCampaignGeoBreakdown(
    campaignId: number,
    granularity: string = "country",
    period: string = "30d",
    topN: number = 10,
  ): Promise<GeoBreakdownPoint[]> {
    return this.makeRequest<GeoBreakdownPoint[]>(
      `/api/analytics/campaigns/${campaignId}/geo-breakdown?granularity=${granularity}&period=${period}&top_n=${topN}`,
    );
  }

  // Get global top countries for all user's clicks (respects global time filters)
  async getGlobalTopCountries(
    granularity: string = "country",
    period: string = "30d",
    topN: number = 10,
  ): Promise<GeoBreakdownPoint[]> {
    return this.makeRequest<GeoBreakdownPoint[]>(
      `/api/analytics/top-countries?granularity=${granularity}&period=${period}&top_n=${topN}`,
    );
  }

  // Get global traffic sources for all user's clicks
  async getGlobalTrafficSources(
    period: string = "30d",
    topN: number = 5,
  ): Promise<TrafficSourcePoint[]> {
    return this.makeRequest<TrafficSourcePoint[]>(
      `/api/analytics/traffic-sources?period=${period}&top_n=${topN}`,
    );
  }

  // Get UTM breakdown for a campaign
  async getCampaignUTMBreakdown(
    campaignId: number,
    period: string = "30d",
  ): Promise<UTMBreakdownPoint[]> {
    return this.makeRequest<UTMBreakdownPoint[]>(
      `/api/analytics/campaigns/${campaignId}/utm-breakdown?period=${period}`,
    );
  }

  // Get target performance for a link
  async getLinkTargetPerformance(
    linkId: number,
    period: string = "30d",
  ): Promise<TargetPerformancePoint[]> {
    return this.makeRequest<TargetPerformancePoint[]>(
      `/api/analytics/links/${linkId}/target-performance?period=${period}`,
    );
  }

  // Convenience function for getting traffic sources
  async getTrafficSources(
    params: { period?: string; topN?: number } = {},
  ): Promise<TrafficSourcePoint[]> {
    return this.getGlobalTrafficSources(params.period, params.topN);
  }
  // Explore analytics with custom filters
  async exploreAnalytics(
    filters: AnalyticsFilters,
    metrics: string[] = ["clicks", "unique_visitors"],
    dimensions: string[] = ["device_type", "browser_name", "country"],
  ): Promise<ExploreResponse> {
    return this.makeRequest<ExploreResponse>("/api/analytics/explore", {
      method: "POST",
      body: JSON.stringify({
        filters,
        metrics,
        dimensions,
      }),
    });
  }
}

export const analyticsAPI = new AnalyticsAPIClient();

// Utility function to format numbers
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
};

// Utility function to format percentage
export const formatPercentage = (num: number): string => {
  return `${num.toFixed(1)}%`;
};

// Utility function to get change color
export const getChangeColor = (change: number): string => {
  return change >= 0 ? "text-green-600" : "text-red-600";
};

// Utility function to get change icon
export const getChangeIcon = (change: number): string => {
  return change >= 0 ? "↗" : "↘";
};
