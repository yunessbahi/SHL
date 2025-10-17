"use client";
import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/api";

export type Campaign = {
  id: number;
  name: string;
  description?: string | null;
  default_utm?: Record<string, any> | null;
  created_at: string;
};

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/campaigns/");
      if (!res.ok) throw new Error(await res.text());
      setCampaigns(await res.json());
    } catch (e: any) {
      setError(e?.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(
    async (payload: Partial<Campaign>) => {
      const res = await authFetch("/api/campaigns/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
    },
    [load],
  );

  useEffect(() => {
    load();
  }, [load]);

  return { campaigns, loading, error, reload: load, create };
}
