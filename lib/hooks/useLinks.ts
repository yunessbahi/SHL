"use client";
import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/api";

export type LinkItem = {
  short_url: string;
  target_url: string;
  expires_at: string | null;
  created_at: string;
};

export function useLinks() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/links/");
      if (!res.ok) throw new Error(await res.text());
      setLinks(await res.json());
    } catch (e: any) {
      setError(e?.message || "Failed to load links");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { links, loading, error, reload: load };
}
