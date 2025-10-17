"use client";
import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";

export default function CampaignsPage() {
	const [items, setItems] = useState<any[]>([]);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [defaultUtm, setDefaultUtm] = useState("{\n  \"utm_source\": \"\",\n  \"utm_medium\": \"\",\n  \"utm_campaign\": \"\"\n}");
	const [error, setError] = useState("");

	const load = async () => {
		const res = await authFetch("/api/campaigns/");
		if (res.ok) setItems(await res.json());
	};

	useEffect(() => {
		load();
	}, []);

	const create = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		try {
			const body = {
				name,
				description: description || null,
				default_utm: JSON.parse(defaultUtm || "{}"),
			};
			const res = await authFetch("/api/campaigns/", {
				method: "POST",
				body: JSON.stringify(body),
			});
			if (res.ok) {
				setName("");
				setDescription("");
				setDefaultUtm("{\n  \"utm_source\": \"\",\n  \"utm_medium\": \"\",\n  \"utm_campaign\": \"\"\n}");
				await load();
			} else {
				setError(await res.text());
			}
		} catch {
			setError("Invalid JSON in default UTM");
		}
	};

	return (
		<div className="max-w-4xl mx-auto px-6 py-8">
			<h1 className="text-2xl font-bold mb-4">Campaigns</h1>
			<form onSubmit={create} className="bg-white p-4 rounded border mb-6 space-y-3">
				<div>
					<label className="block text-sm">Name</label>
					<input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border p-2 rounded" required />
				</div>
				<div>
					<label className="block text-sm">Description</label>
					<input value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full border p-2 rounded" />
				</div>
				<div>
					<label className="block text-sm">Default UTM (JSON)</label>
					<textarea value={defaultUtm} onChange={(e)=>setDefaultUtm(e.target.value)} className="w-full border p-2 rounded font-mono" rows={6} />
				</div>
				{error && <div className="text-red-600 text-sm">{error}</div>}
				<button className="bg-indigo-600 text-white px-4 py-2 rounded">Create</button>
			</form>

			<div className="bg-white rounded border">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-gray-50 text-left">
							<th className="p-2">ID</th>
							<th className="p-2">Name</th>
							<th className="p-2">Created</th>
						</tr>
					</thead>
					<tbody>
						{items.map((c)=> (
							<tr key={c.id} className="border-t">
								<td className="p-2">{c.id}</td>
								<td className="p-2">{c.name}</td>
								<td className="p-2">{new Date(c.created_at).toLocaleDateString()}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
