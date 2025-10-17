"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { authFetch } from "@/lib/api";
import WeightSlider from "@/app/components/WeightSlider";
import RuleTabs from "@/app/components/RuleTabs";

export default function TargetsPage() {
	const params = useParams();
	const linkId = Number(params?.id);
	const [items, setItems] = useState<any[]>([]);
	const [draft, setDraft] = useState({
		target_url: "",
		weight: 10,
		rules: { country_allow: [], utm_overrides: {} },
	});
	const [error, setError] = useState("");

	const load = async () => {
		const res = await authFetch(`/api/targets/link/${linkId}`);
		if (res.ok) setItems(await res.json());
	};

	useEffect(() => {
		if (linkId) load();
	}, [linkId]);

	const setDraftField = useCallback((key: string, value: any) => {
		setDraft((prev) => ({ ...prev, [key]: value }));
	}, []);

	const setDraftRules = useCallback((updates: any) => {
		setDraft((prev) => ({ ...prev, rules: { ...prev.rules, ...updates } }));
	}, []);

	const replaceDraftRules = useCallback((nextObj: any) => {
		setDraft((prev) => ({ ...prev, rules: nextObj }));
	}, []);

	const create = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		try {
			const body = {
				target_url: draft.target_url,
				weight: Number(draft.weight) || 1,
				rules: draft.rules,
			};
			const res = await authFetch(`/api/targets/link/${linkId}`, {
				method: "POST",
				body: JSON.stringify(body),
			});
			if (res.ok) {
				setDraft({ target_url: "", weight: 10, rules: { country_allow: [], utm_overrides: {} } });
				await load();
			} else {
				setError(await res.text());
			}
		} catch (err: any) {
			setError(err?.message || "Failed to add target");
		}
	};

	return (
		<div className="max-w-5xl mx-auto px-6 py-8">
			<h1 className="text-2xl font-bold mb-4">Targets for Link #{linkId}</h1>
			<form onSubmit={create} className="bg-white p-4 rounded border mb-6 space-y-4">
				<div>
					<label className="block text-sm">Target URL</label>
					<input
						value={draft.target_url}
						onChange={e => setDraftField('target_url', e.target.value)}
						className="w-full border p-2 rounded" required
					/>
				</div>
				<WeightSlider value={draft.weight} onChange={v => setDraftField('weight', v)} />
				{/* Updated RuleTabs: passes two props for merge/replace */}
				<RuleTabs
					rules={draft.rules}
					setRules={(updatesOrObj) => typeof updatesOrObj === "function"
						? setDraftRules(updatesOrObj)
						: replaceDraftRules(updatesOrObj)
					}
				/>
				{error && <div className="text-red-600 text-sm">{error}</div>}
				<button className="bg-indigo-600 text-white px-4 py-2 rounded">Add Target</button>
			</form>

			<div className="bg-white rounded border">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-gray-50 text-left">
							<th className="p-2">ID</th>
							<th className="p-2">URL</th>
							<th className="p-2">Weight</th>
							<th className="p-2">Rules</th>
						</tr>
					</thead>
					<tbody>
						{items.map((t)=> (
							<tr key={t.id} className="border-t">
								<td className="p-2">{t.id}</td>
								<td className="p-2">{t.target_url}</td>
								<td className="p-2">{t.weight}</td>
								<td className="p-2 font-mono text-xs">{JSON.stringify(t.rules)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
