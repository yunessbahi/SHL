"use client";
import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/api";

export type Group = {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
};

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/groups/");
      if (!res.ok) throw new Error(await res.text());
      setGroups(await res.json());
    } catch (e: any) {
      setError(e?.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(
    async (payload: Partial<Group>) => {
      const res = await authFetch("/api/groups/", {
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

  return { groups, loading, error, reload: load, create };
}
