"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { authFetch } from "@/lib/api";
import TraceViewer from "@/app/components/TraceViewer";

export default function PreviewPage() {
	const params = useParams();
	const linkId = Number(params?.id);
	const [context, setContext] = useState({ country: "", device_type: "", referrer: "" });
	const [result, setResult] = useState<any>(null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const run = async (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		setError("");
		setLoading(true);
		const res = await authFetch("/api/rules/preview", {
			method: "POST",
			body: JSON.stringify({ link_id: linkId, ...context }),
		});
		setLoading(false);
		if (res.ok) setResult(await res.json());
		else setError(await res.text());
	};

	useEffect(() => {
		if (linkId) run();
	}, [linkId]);

	return (
		<div className="max-w-4xl mx-auto px-6 py-8 space-y-4">
			<h1 className="text-2xl font-bold">Rules Preview for Link #{linkId}</h1>
			<form onSubmit={run} className="bg-white p-4 rounded border grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<label className="block text-sm">Country (ISO2)</label>
					<input value={context.country} onChange={(e)=>setContext({ ...context, country: e.target.value })} className="w-full border p-2 rounded" />
				</div>
				<div>
					<label className="block text-sm">Device</label>
					<select className="w-full border p-2 rounded" value={context.device_type} onChange={(e)=> setContext({ ...context, device_type: e.target.value })}>
						<option value="">Any</option>
						<option value="mobile">Mobile</option>
						<option value="desktop">Desktop</option>
					</select>
				</div>
				<div className="md:col-span-1">
					<label className="block text-sm">Referrer</label>
					<input value={context.referrer} onChange={(e)=>setContext({ ...context, referrer: e.target.value })} className="w-full border p-2 rounded" />
				</div>
				<div className="md:col-span-3">
					<button className="bg-indigo-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? "Running..." : "Run Preview"}</button>
				</div>
			</form>

			{error && <div className="text-red-600 text-sm">{error}</div>}
			{result && (
				<div className="space-y-4">
					{result.final_url && (
						<div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
							Chosen URL: <a className="underline" href={result.final_url} target="_blank" rel="noreferrer">{result.final_url}</a>
						</div>
					)}
					<TraceViewer trace={result.trace} />
				</div>
			)}
		</div>
	);
}
