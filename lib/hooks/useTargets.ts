"use client";
import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/api";

export type TargetItem = {
  id: number;
  target_url: string;
  weight: number;
  rules: Record<string, any>;
};

export function useTargets(linkId: number) {
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!linkId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/targets/link/${linkId}`);
      if (!res.ok) throw new Error(await res.text());
      setTargets(await res.json());
    } catch (e: any) {
      setError(e?.message || "Failed to load targets");
    } finally {
      setLoading(false);
    }
  }, [linkId]);

  const create = useCallback(
    async (payload: Partial<TargetItem>) => {
      const res = await authFetch(`/api/targets/link/${linkId}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      await load();
    },
    [linkId, load],
  );

  useEffect(() => {
    load();
  }, [load]);

  return { targets, loading, error, reload: load, create };
}
