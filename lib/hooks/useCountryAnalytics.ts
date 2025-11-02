"use client";
import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/api";

export type CountryAnalytics = {
  country_code: string;
  country_name: string;
  click_count: number;
  unique_links: number;
  first_click: string;
  last_click: string;
};

export type CountryStatistics = {
  total_countries: number;
  active_countries: number;
  inactive_countries: number;
};

export function useCountryAnalytics() {
  const [analytics, setAnalytics] = useState<CountryAnalytics[]>([]);
  const [statistics, setStatistics] = useState<CountryStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/countries/analytics/clicks");
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as CountryAnalytics[];
      setAnalytics(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load country analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/countries/statistics/overview");
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as CountryStatistics;
      setStatistics(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load country statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, statsRes] = await Promise.allSettled([
        authFetch("/api/countries/analytics/clicks"),
        authFetch("/api/countries/statistics/overview"),
      ]);

      if (analyticsRes.status === "fulfilled" && analyticsRes.value.ok) {
        const analyticsData =
          (await analyticsRes.value.json()) as CountryAnalytics[];
        setAnalytics(analyticsData);
      }

      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const statsData = (await statsRes.value.json()) as CountryStatistics;
        setStatistics(statsData);
      }

      // If both failed, set an error
      if (
        analyticsRes.status === "rejected" &&
        statsRes.status === "rejected"
      ) {
        throw new Error("Failed to load country analytics data");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load country analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return {
    analytics,
    statistics,
    loading,
    error,
    reloadAnalytics: loadAnalytics,
    reloadStatistics: loadStatistics,
    reloadAll: loadAll,
  };
}
