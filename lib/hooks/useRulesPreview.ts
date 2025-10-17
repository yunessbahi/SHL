"use client";
import { useCallback, useState } from "react";
import { authFetch } from "@/lib/api";

export function useRulesPreview(linkId: number) {
	const [result, setResult] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const run = useCallback(async (context: Record<string, any>) => {
		setLoading(true);
		setError(null);
		try {
			const res = await authFetch("/api/rules/preview", {
				method: "POST",
				body: JSON.stringify({ link_id: linkId, ...context }),
			});
			if (!res.ok) throw new Error(await res.text());
			setResult(await res.json());
		} catch (e: any) {
			setError(e?.message || "Failed to run preview");
		} finally {
			setLoading(false);
		}
	}, [linkId]);

	return { result, loading, error, run };
}
