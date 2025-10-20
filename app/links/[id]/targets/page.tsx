"use client";
import React, { useEffect, useMemo, useReducer, useState } from "react";
import { useParams } from "next/navigation";
import { authFetch } from "@/lib/api";
import WeightSlider from "@/app/components/WeightSlider";
import RuleTabs from "@/app/components/RuleTabs";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Info, Plus } from "lucide-react";
import { UtmTemplateModal } from "@/app/components/UtmTemplateModal";
import { MultiSelect } from "@/components/multi-select";

interface UTMTemplate {
  id: number;
  name: string;
  description: string;
  is_global: boolean;
  utm_params: any;
  campaigns?: any[];
  created_at?: string;
}

interface Campaign {
  id: number;
  name: string;
}

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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<UTMTemplate[]>([]);
  const [templateModal, setTemplateModal] = useState<UTMTemplate | null>(null);
  const [templatePreview, setTemplatePreview] = useState<any>({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState<any>(null);

  // ✅ Whenever templatePreview changes, inject it into utm_overrides if not set
  useEffect(() => {
    if (draft.utm_template_id && templatePreview) {
      // Only inject if utm_overrides is empty
      if (
        !draft.rules?.utm_overrides ||
        Object.keys(draft.rules.utm_overrides).length === 0
      ) {
        dispatch({
          type: "merge_rules",
          value: { utm_overrides: { ...templatePreview } },
        });
      }
    }
  }, [draft.utm_template_id, templatePreview]);

  // ✅ Check Supabase session
  useEffect(() => {
    const run = async () => {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data } = await supabase.auth.getSession();
      setHasSession(!!data.session?.access_token);
    };
    run();
  }, []);

  // ✅ Load targets when session ready
  useEffect(() => {
    if (linkId && hasSession) loadTargets();
  }, [linkId, hasSession]);

  const loadTargets = async () => {
    const res = await authFetch(`/api/targets/link/${linkId}`);
    if (res.ok) setItems(await res.json());
  };

  // ✅ Load campaigns
  useEffect(() => {
    (async () => {
      const cRes = await authFetch("/api/campaigns/");
      if (cRes.ok) setCampaigns(await cRes.json());
    })();
  }, []);

  // ✅ Load templates filtered by campaign
  const loadTemplates = async () => {
    const tRes = await authFetch(`/api/utm-templates/`);
    if (!tRes.ok) return;

    const allTemplates: UTMTemplate[] = await tRes.json();

    // Filter templates by campaign or global
    const filteredTemplates = draft.campaign_id
      ? allTemplates.filter((t) =>
          t.campaigns?.some((c) => c.id === draft.campaign_id),
        )
      : allTemplates.filter((t) => t.is_global);

    // Deduplicate
    const unique = new Map<number, UTMTemplate>();
    filteredTemplates.forEach((t) => unique.set(t.id, t));

    const result = Array.from(unique.values());
    setTemplates(result);
    console.log(
      "Loaded templates for campaign:",
      draft.campaign_id,
      "→",
      result.map((t) => t.name),
    );
  };

  // Load when campaign changes
  useEffect(() => {
    loadTemplates();
  }, [draft.campaign_id]);

  // Load templates if draft already has campaign (e.g. editing)
  useEffect(() => {
    if (draft.campaign_id) loadTemplates();
  }, []);

  // ✅ Update template preview
  useEffect(() => {
    if (draft.utm_template_id) {
      const tpl = templates.find((t) => t.id === draft.utm_template_id);
      setTemplatePreview(tpl?.utm_params || {});
    } else {
      setTemplatePreview({});
    }
  }, [draft.utm_template_id, templates]);

  // ✅ Persist draft locally
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {}
  }, [storageKey, draft]);

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

  const cancelEdit = () => resetDraft();

  const deleteTarget = async (id: number) => {
    if (!window.confirm("Remove this target?")) return;
    setError("");
    const res = await authFetch(`/api/targets/${id}`, { method: "DELETE" });
    if (res.ok) {
      await loadTargets();
      if (editingId === id) cancelEdit();
    } else setError(await res.text());
  };

  const saveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
        await loadTargets();
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

        {/* ✅ Campaign selection */}
        <div>
          <label className="block text-sm mb-2">Campaign (Optional)</label>
          <select
            value={draft.campaign_id || ""}
            onChange={(e) =>
              dispatch({
                type: "set_field",
                key: "campaign_id",
                value: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-full border p-2 rounded"
          >
            <option value="">Select campaign...</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ MultiSelect for templates */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm">UTM Template (Optional)</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setModalInitial({
                  campaign_ids: draft.campaign_id ? [draft.campaign_id] : [],
                  is_global: !draft.campaign_id,
                  utm_params: {
                    utm_source: "",
                    utm_medium: "",
                    utm_campaign: "",
                    utm_term: "",
                    utm_content: "",
                  },
                });
                setCreateModalOpen(true);
              }}
            >
              <Plus className="h-3 w-3 mr-1" /> Create New Template
            </Button>
          </div>

          <MultiSelect
            placeholder="Select Template"
            options={templates.map((t) => ({
              label: `${t.name}${t.is_global ? " (Global)" : ""}`,
              value: String(t.id),
            }))}
            defaultValue={
              draft.utm_template_id ? [String(draft.utm_template_id)] : []
            }
            onValueChange={(vals: string[]) =>
              dispatch({
                type: "set_field",
                key: "utm_template_id",
                value: vals.length ? Number(vals[0]) : null,
              })
            }
          />

          {draft.utm_template_id && (
            <Button
              type="button"
              variant="ghost"
              className="ml-2"
              onClick={() => {
                const tpl = templates.find(
                  (t) => t.id === draft.utm_template_id,
                );
                setTemplateModal(tpl || null);
              }}
            >
              <Info className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* ✅ Template Preview */}
        {draft.utm_template_id && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">
              Inherited UTM Parameters:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(templatePreview)
                .filter(([_, v]) => v)
                .map(([key, value]) => (
                  <div key={key} className="bg-white p-2 rounded border">
                    <span className="font-medium">
                      {key.replace("utm_", "")}:
                    </span>
                    <span className="ml-1">{String(value)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

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
            const merged =
              typeof next === "function" ? next(draft.rules) : next;
            dispatch({ type: "merge_rules", value: merged });
          }}
        />

        {/* ✅ Live preview of combined UTM params */}
        <div className="py-2">
          <label className="block text-xs text-muted-foreground mb-1 font-semibold">
            Final UTM Params (inherited + overridden)
          </label>
          <pre className="bg-gray-50 border rounded p-2 text-xs overflow-x-auto">
            {JSON.stringify(templatePreview, null, 2)}
          </pre>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex gap-3">
          <Button type="submit" variant="secondary">
            Save Draft
          </Button>
          <Button type="button" onClick={apply}>
            {editingId ? "Apply Changes" : "Add Target"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={cancelEdit}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      {/* ✅ Target List */}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editTarget(t)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteTarget(t.id)}
                    className="ml-2"
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Template Detail Modal */}
      <Dialog
        open={!!templateModal}
        onOpenChange={(o) => !o && setTemplateModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>UTM Template: {templateModal?.name}</DialogTitle>
          </DialogHeader>
          <div className="mb-2 text-muted-foreground">
            {templateModal?.description}
          </div>
          <div className="flex gap-2 flex-wrap mb-2">
            {templateModal?.is_global && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                Global
              </span>
            )}
            {templateModal?.campaigns?.map((c) => (
              <span
                key={c.id}
                className="bg-gray-100 px-2 py-1 rounded text-xs"
              >
                {c.name}
              </span>
            ))}
          </div>

          <div className="mt-2 mb-2">
            <strong>UTM Params:</strong>
            <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
              {templateModal?.utm_params &&
                Object.entries(templateModal.utm_params)
                  .filter(([_, v]) => v)
                  .map(([key, value]) => (
                    <div key={key} className="bg-muted p-2 rounded">
                      <span className="font-medium">
                        {key.replace("utm_", "")}:
                      </span>
                      <span className="ml-1">{String(value)}</span>
                    </div>
                  ))}
            </div>
          </div>
          <div className="mt-4 text-xs text-zinc-500">
            Created{" "}
            {templateModal?.created_at
              ? new Date(templateModal.created_at).toLocaleString()
              : "Unknown"}
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ Create UTM Template Modal */}
      <UtmTemplateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        initialValues={modalInitial}
        campaigns={campaigns}
        onSave={async (values) => {
          const res = await authFetch("/api/utm-templates/", {
            method: "POST",
            body: JSON.stringify(values),
          });
          if (res.ok) {
            const tpl = await res.json();
            await loadTemplates();
            dispatch({
              type: "set_field",
              key: "utm_template_id",
              value: tpl.id,
            });
            setCreateModalOpen(false);
          }
        }}
      />
    </div>
  );
}
