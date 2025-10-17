"use client";
import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";

export default function LinksPage() {
	const [items, setItems] = useState<any[]>([]);

	useEffect(() => {
		(async () => {
			const res = await authFetch("/api/links/");
			if (res.ok) setItems(await res.json());
		})();
	}, []);

	return (
		<div className="max-w-4xl mx-auto px-6 py-8">
			<h1 className="text-2xl font-bold mb-4">Links</h1>
			<div className="bg-white rounded border">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-gray-50 text-left">
							<th className="p-2">Short URL</th>
							<th className="p-2">Target URL</th>
							<th className="p-2">Expires</th>
							<th className="p-2">Created</th>
						</tr>
					</thead>
					<tbody>
						{items.map((l: any, idx: number) => (
							<tr key={idx} className="border-t">
								<td className="p-2 text-indigo-600">{l.short_url}</td>
								<td className="p-2">{l.target_url}</td>
								<td className="p-2">{l.expires_at ? new Date(l.expires_at).toLocaleDateString() : "—"}</td>
								<td className="p-2">{new Date(l.created_at).toLocaleDateString()}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
