"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { authFetch } from "@/lib/api";
import WeightSlider from "@/app/components/WeightSlider";
import RuleTabs from "@/app/components/RuleTabs";

export default function TargetsPage() {
  const params = useParams();
  const linkId = Number(params?.id);
  const [items, setItems] = useState<any[]>([]);
  const [draft, setDraft] = useState({
    id: null,
    target_url: "",
    weight: 10,
    rules: { country_allow: [], utm_overrides: {} },
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Load targets
  const load = async () => {
    const res = await authFetch(`/api/targets/link/${linkId}`);
    if (res.ok) setItems(await res.json());
  };
  useEffect(() => {
    if (linkId) load();
  }, [linkId]);

  // Reset draft
  const resetDraft = () =>
    setDraft({
      id: null,
      target_url: "",
      weight: 10,
      rules: { country_allow: [], utm_overrides: {} },
    });

  // Start editing
  const editTarget = (target: any) => {
    setEditingId(target.id);
    setDraft({
      id: target.id,
      target_url: target.target_url,
      weight: target.weight,
      rules: target.rules || {},
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    resetDraft();
  };

  // Delete action
  const deleteTarget = async (id: number) => {
    if (!window.confirm("Remove this target?")) return;
    setError("");
    const res = await authFetch(`/api/targets/${id}`, { method: "DELETE" });
    if (res.ok) {
      load();
      if (editingId === id) cancelEdit();
    } else setError(await res.text());
  };

  // Apply (add or update)
  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!draft.target_url) {
      setError("Target URL required");
      return;
    }
    if (!draft.rules) draft.rules = { country_allow: [], utm_overrides: {} };
    try {
      let res,
        body = {
          target_url: draft.target_url,
          weight: Number(draft.weight) || 1,
          rules: draft.rules,
        };
      if (editingId) {
        res = await authFetch(`/api/targets/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        res = await authFetch(`/api/targets/link/${linkId}`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      if (res.ok) {
        resetDraft();
        setEditingId(null);
        await load();
      } else {
        setError(await res.text());
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save target");
    }
  };

  // Unified field setters
  const setDraftField = (k: string, v: any) =>
    setDraft((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Targets for Link #{linkId}</h1>
      <form
        onSubmit={apply}
        className="bg-white p-4 rounded border mb-6 space-y-4"
      >
        <div>
          <label className="block text-sm">Target URL</label>
          <input
            value={draft.target_url}
            onChange={(e) => setDraftField("target_url", e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <WeightSlider
          value={draft.weight}
          onChange={(v) => setDraftField("weight", v)}
        />
        <RuleTabs
          rules={draft.rules}
          setRules={(updatesOrObj) =>
            typeof updatesOrObj === "function"
              ? setDraft((d) => ({
                  ...d,
                  rules: { ...d.rules, ...updatesOrObj(d.rules) },
                }))
              : setDraft((d) => ({
                  ...d,
                  rules: { ...d.rules, ...updatesOrObj },
                }))
          }
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded"
          >
            {editingId ? "Apply Changes" : "Add Target"}
          </button>
          {editingId && (
            <button
              type="button"
              className="bg-gray-100 border px-4 py-2 rounded"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <div className="bg-white rounded border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2">ID</th>
              <th className="p-2">URL</th>
              <th className="p-2">Weight</th>
              <th className="p-2">Rules</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-2">{t.id}</td>
                <td className="p-2">{t.target_url}</td>
                <td className="p-2">{t.weight}</td>
                <td className="p-2 font-mono text-xs">
                  {JSON.stringify(t.rules)}
                </td>
                <td className="p-2">
                  <button
                    onClick={() => editTarget(t)}
                    className="text-indigo-600 underline mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTarget(t.id)}
                    className="text-red-600 underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
