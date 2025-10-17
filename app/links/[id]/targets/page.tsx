"use client";
import React, { useEffect, useMemo, useReducer, useState } from "react";
import { useParams } from "next/navigation";
import { authFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import WeightSlider from "@/app/components/WeightSlider";
import RuleTabs from "@/app/components/RuleTabs";
import TargetMetadataSelector from "@/app/components/TargetMetadataSelector";

type Draft = {
  id: number | null;
  target_url: string;
  weight: number;
  rules: any;
  campaign_id?: number | null;
  group_id?: number | null;
  utm_template_id?: number | null;
};

type Action =
  | { type: "set_field"; key: keyof Draft; value: any }
  | { type: "merge_rules"; value: any }
  | { type: "replace_rules"; value: any }
  | { type: "load"; value: Draft }
  | { type: "reset" };

const initialDraft: Draft = {
  id: null,
  target_url: "",
  weight: 10,
  rules: { country_allow: [], utm_overrides: {} },
  campaign_id: null,
  group_id: null,
  utm_template_id: null,
};

function draftReducer(state: Draft, action: Action): Draft {
  switch (action.type) {
    case "set_field":
      return { ...state, [action.key]: action.value } as Draft;
    case "merge_rules":
      return { ...state, rules: { ...state.rules, ...action.value } };
    case "replace_rules":
      return { ...state, rules: action.value };
    case "load":
      return { ...action.value };
    case "reset":
      return { ...initialDraft };
    default:
      return state;
  }
}

export default function TargetsPage() {
  const params = useParams();
  const linkId = Number(params?.id);
  const storageKey = useMemo(() => `targets_draft_link_${linkId}`, [linkId]);

  const [items, setItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<string>("audience");

  const [draft, dispatch] = useReducer(draftReducer, initialDraft);

  // Load session
  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setHasSession(!!data.session?.access_token);
    };
    run();
  }, []);

  // Load persisted draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        dispatch({ type: "load", value: { ...initialDraft, ...parsed } });
        setEditingId(parsed?.id ?? null);
      }
    } catch {}
  }, [storageKey]);

  // Persist draft
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {}
  }, [storageKey, draft]);

  // Fetch targets
  const load = async () => {
    const res = await authFetch(`/api/targets/link/${linkId}`);
    if (res.ok) setItems(await res.json());
  };
  useEffect(() => {
    if (linkId && hasSession) load();
  }, [linkId, hasSession]);

  const resetDraft = () => {
    dispatch({ type: "reset" });
    setEditingId(null);
  };

  const editTarget = (target: any) => {
    setEditingId(target.id);
    dispatch({
      type: "load",
      value: {
        id: target.id,
        target_url: target.target_url,
        weight: target.weight,
        rules: target.rules || {},
        campaign_id: target.campaign_id,
        group_id: target.group_id,
        utm_template_id: target.utm_template_id,
      },
    });
  };

  const cancelEdit = () => {
    resetDraft();
  };

  const deleteTarget = async (id: number) => {
    if (!window.confirm("Remove this target?")) return;
    setError("");
    const res = await authFetch(`/api/targets/${id}`, { method: "DELETE" });
    if (res.ok) {
      await load();
      if (editingId === id) cancelEdit();
    } else setError(await res.text());
  };

  const saveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); /* already persisted */
  };

  const apply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!draft.target_url) {
      setError("Target URL required");
      return;
    }
    const body = {
      target_url: draft.target_url,
      weight: Number(draft.weight) || 1,
      rules: draft.rules || {},
      campaign_id: draft.campaign_id,
      group_id: draft.group_id,
      utm_template_id: draft.utm_template_id,
    };
    try {
      let res;
      if (editingId)
        res = await authFetch(`/api/targets/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      else
        res = await authFetch(`/api/targets/link/${linkId}`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      if (res.ok) {
        await load();
        resetDraft();
      } else setError(await res.text());
    } catch (err: any) {
      setError(err?.message || "Failed to save target");
    }
  };

  if (hasSession === false) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        Please sign in to manage targets.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Targets for Link #{linkId}</h1>

      <form
        onSubmit={saveDraft}
        className="bg-white p-4 rounded border mb-6 space-y-4"
      >
        <div>
          <label className="block text-sm">Target URL</label>
          <input
            value={draft.target_url}
            onChange={(e) =>
              dispatch({
                type: "set_field",
                key: "target_url",
                value: e.target.value,
              })
            }
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-3">Metadata</label>
          <TargetMetadataSelector
            campaignId={draft.campaign_id ?? undefined}
            groupId={draft.group_id ?? undefined}
            utmTemplateId={draft.utm_template_id ?? undefined}
            onCampaignChange={(id) =>
              dispatch({ type: "set_field", key: "campaign_id", value: id })
            }
            onGroupChange={(id) =>
              dispatch({ type: "set_field", key: "group_id", value: id })
            }
            onUTMTemplateChange={(id) =>
              dispatch({ type: "set_field", key: "utm_template_id", value: id })
            }
          />
        </div>
        <WeightSlider
          value={draft.weight}
          onChange={(v) =>
            dispatch({ type: "set_field", key: "weight", value: v })
          }
        />
        <RuleTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          rules={draft.rules}
          setRules={(next) => {
            if (typeof next === "function") {
              const merged = next(draft.rules);
              dispatch({ type: "merge_rules", value: merged });
            } else {
              dispatch({ type: "merge_rules", value: next });
            }
          }}
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-gray-100 border px-4 py-2 rounded"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={apply}
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
            {items.map((t: any) => (
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
