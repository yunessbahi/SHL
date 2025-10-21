/*
"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Plus, Link, X, Edit, Trash2, Info, ChevronDown } from "lucide-react";
import { authFetch } from "@/lib/api";
import { UtmTemplateModal } from "@/app/components/UtmTemplateModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
//import MultiSelect from "@/app/components/MultiSelect";
import { MultiSelect } from "@/components/multi-select";

function getUtmParams(obj: any) {
  let utm = obj?.utm_params;
  if (utm && typeof utm === "string") {
    try {
      utm = JSON.parse(utm);
    } catch {
      utm = {};
    }
  }
  return utm || {};
}

interface Campaign {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  templates?: UTMTemplate[];
}

interface UTMTemplate {
  id: number;
  name: string;
  description: string;
  is_global: boolean;
  pinned?: boolean;
  utm_params: any;
  campaigns?: Campaign[];
  created_at?: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allTemplates, setAllTemplates] = useState<UTMTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  // Modal/Interaction State
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSelected, setAssignSelected] = useState<number[]>([]);
  const [templateDetail, setTemplateDetail] = useState<UTMTemplate | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<UTMTemplate | null>(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);

  // Fetch all campaigns and templates for assignment
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const cRes = await authFetch("/api/campaigns/");
      const tRes = await authFetch("/api/utm-templates/");
      if (cRes.ok) setCampaigns(await cRes.json());
      if (tRes.ok) setAllTemplates(await tRes.json());
      setLoading(false);
    };
    fetchAll();
  }, []);

  // When showing modal for a specific campaign, fetch latest template list for that campaign
  const openTemplatesModal = async (campaign: Campaign) => {
    setActiveCampaign(campaign);
    setShowTemplatesModal(true);
    const res = await authFetch(`/api/campaigns/${campaign.id}/templates`);
    if (res.ok) {
      const data = await res.json();
      setActiveCampaign((c) => (c ? { ...c, templates: data } : c));
    }
  };
  const closeTemplatesModal = () => {
    setShowTemplatesModal(false);
    setActiveCampaign(null);
    setTemplateDetail(null);
  };

  // Multi-select assignment modal logic (only templates not already mapped, user/global)
  const openAssignModal = () => {
    setShowAssignModal(true);
    setAssignSelected([]);
  };
  const closeAssignModal = () => {
    setShowAssignModal(false);
    setAssignSelected([]);
  };
  const handleAssign = async () => {
    if (!activeCampaign || assignSelected.length === 0) return;
    await authFetch(`/api/campaigns/${activeCampaign.id}/templates`, {
      method: "POST",
      body: JSON.stringify({ template_ids: assignSelected }),
    });
    await openTemplatesModal(activeCampaign); // Refresh list
    setShowAssignModal(false);
    setAssignSelected([]);
    window.dispatchEvent(new CustomEvent("campaignChanged"));
  };

  // Remove mapping
  const handleUnlink = async (templateId: number) => {
    if (!activeCampaign) return;
    await authFetch(
      `/api/campaigns/${activeCampaign.id}/templates/${templateId}`,
      { method: "DELETE" },
    );
    await openTemplatesModal(activeCampaign);
    // Notify other pages of campaign change
    window.dispatchEvent(new CustomEvent("campaignChanged"));
  };
  // Open template detail modal
  const showTemplateDetail = (template: UTMTemplate) => {
    setTemplateDetail(template);
  };

  const closeTemplateModal = () => setTemplateDetail(null);

  // Campaign edit/delete handlers
  const handleDeleteCampaign = async (campaignId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this campaign? This will also remove all template assignments.",
      )
    )
      return;
    const response = await authFetch(`/api/campaigns/${campaignId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      // Refresh campaigns list
      const cRes = await authFetch("/api/campaigns/");
      if (cRes.ok) setCampaigns(await cRes.json());
      // Notify other pages of campaign change
      window.dispatchEvent(new CustomEvent("campaignChanged"));
    }
  };

  // Compute templates that can be assigned (user/global not already mapped)
  const availableToAssign =
    (activeCampaign &&
      allTemplates.filter((t) => {
        if (!activeCampaign.templates) return false;
        const already = activeCampaign.templates.some((at) => at.id === t.id);
        return !already && (t.is_global || !t.is_global);
      })) ||
    [];

  if (loading) return <div>Loading...</div>;
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Button onClick={() => setShowCampaignModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Campaign
        </Button>
      </div>
      <div className="bg-white rounded border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2">ID</th>
              <th className="p-2">Name</th>
              <th className="p-2">Templates</th>
              <th className="p-2">Created</th>
              <th className="p-2">Actions</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.id}</td>
                <td className="p-2 font-semibold">{c.name}</td>
                <td className="p-2">
                  <span className="text-sm text-gray-600">
                    {c.templates ? c.templates.length : 0} templates
                  </span>
                </td>
                <td className="p-2">
                  {c.created_at
                    ? new Date(c.created_at).toLocaleDateString()
                    : ""}
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditCampaign(c)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCampaign(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
                <td className="p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openTemplatesModal(c)}
                  >
                    <Link className="h-4 w-4 mr-1 inline" />
                    {c.templates ? c.templates.length : 0} Templates
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/!* Assign/View Modal for Campaign Templates *!/}
      {showTemplatesModal && activeCampaign && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded shadow-lg w-full max-w-2xl relative">
            <button
              className="absolute right-4 top-4"
              onClick={closeTemplatesModal}
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold mb-4">
              Templates for {activeCampaign.name}
            </h2>
            <div className="mb-4 flex gap-2">
              <Button
                variant={showAssignModal ? "default" : "secondary"}
                onClick={() => setShowAssignModal((v) => !v)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {showAssignModal
                  ? "Hide Template Assignment"
                  : "Add Existing Templates"}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create New Template
              </Button>
            </div>
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-2">Name</th>
                  <th className="p-2">Global</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(activeCampaign.templates || []).map((t) => (
                  <tr key={t.id} className="border-t">
                    <td
                      className="p-2 font-semibold cursor-pointer"
                      onClick={() => showTemplateDetail(t)}
                    >
                      {t.name}
                    </td>
                    <td className="p-2">
                      {t.is_global ? (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                          Global
                        </span>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="p-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => showTemplateDetail(t)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditTemplate(t)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlink(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {activeCampaign.templates &&
                  activeCampaign.templates.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <span className="text-xs text-zinc-400">
                          No templates assigned.
                        </span>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
            {/!* Inside Templates Modal — replace old showAssignModal section *!/}
            {showAssignModal && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-base">
                    Assign Existing Templates
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAssignModal(false)}
                  >
                    <X className="h-4 w-4 mr-1" /> Close
                  </Button>
                </div>

                <MultiSelect
                  //placeholder="Select Templates to Assign"
                  options={availableToAssign.map((t) => ({
                    label: `${t.name}${t.is_global ? " (Global)" : ""}`,
                    value: String(t.id),
                  }))}
                  defaultValue={assignSelected.map(String)}
                  onValueChange={(vals) => setAssignSelected(vals.map(Number))}
                  placeholder="Choose one or more templates"
                  emptyIndicator="No templates available"
                  maxCount={3}
                />

                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleAssign}
                    disabled={assignSelected.length === 0}
                    className="ml-auto"
                  >
                    Assign Templates
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/!* Template Detail Modal *!/}
      {templateDetail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded shadow-lg w-full max-w-lg relative">
            <button
              className="absolute right-4 top-4"
              onClick={closeTemplateModal}
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold mb-2">{templateDetail.name}</h3>
            <div className="mb-2 text-muted-foreground">
              {templateDetail.description}
            </div>
            <div className="flex gap-2 flex-wrap mb-2">
              {templateDetail.is_global && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                  Global
                </span>
              )}
              {templateDetail.campaigns && templateDetail.campaigns.length
                ? templateDetail.campaigns.map((c) => (
                    <span
                      key={c.id}
                      className="bg-gray-100 px-2 py-1 rounded text-xs"
                    >
                      {c.name}
                    </span>
                  ))
                : null}
            </div>
            <div className="mt-2 mb-2">
              <strong>UTM Params:</strong>
              <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                {Object.entries(getUtmParams(templateDetail))
                  .filter(([key, value]) => value)
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
              {templateDetail.created_at
                ? new Date(templateDetail.created_at).toLocaleString()
                : ""}
            </div>
            {/!* Edit feature possible here (reuse UTM template modal) *!/}
          </div>
        </div>
      )}
      <UtmTemplateModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        initialValues={{
          campaign_ids: [activeCampaign?.id || 0],
          is_global: false,
          utm_params: {
            utm_source: "",
            utm_medium: "",
            utm_campaign: "",
            utm_term: "",
            utm_content: "",
          },
        }}
        onSave={async (values) => {
          await authFetch("/api/utm-templates/", {
            method: "POST",
            body: JSON.stringify(values),
          });
          await openTemplatesModal(activeCampaign!);
          setShowCreateModal(false);
        }}
        campaigns={campaigns}
      />
      <UtmTemplateModal
        open={!!editTemplate}
        onOpenChange={(o) => {
          if (!o) setEditTemplate(null);
        }}
        initialValues={
          editTemplate && {
            ...editTemplate,
            campaign_ids: [activeCampaign?.id || 0],
          }
        }
        onSave={async (values) => {
          await authFetch(`/api/utm-templates/${editTemplate!.id}`, {
            method: "PATCH",
            body: JSON.stringify(values),
          });
          await openTemplatesModal(activeCampaign!);
          setEditTemplate(null);
        }}
        campaigns={campaigns}
      />

      {/!* Campaign Creation Modal *!/}
      <Dialog open={showCampaignModal} onOpenChange={setShowCampaignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
          </DialogHeader>
          <CampaignForm
            onSave={async (values) => {
              const res = await authFetch("/api/campaigns/", {
                method: "POST",
                body: JSON.stringify(values),
              });
              if (res.ok) {
                const cRes = await authFetch("/api/campaigns/");
                if (cRes.ok) setCampaigns(await cRes.json());
                setShowCampaignModal(false);
                // Notify other pages of campaign change
                window.dispatchEvent(new CustomEvent("campaignChanged"));
              }
            }}
            onCancel={() => setShowCampaignModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/!* Campaign Edit Modal *!/}
      <Dialog
        open={!!editCampaign}
        onOpenChange={(open) => {
          if (!open) setEditCampaign(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
          </DialogHeader>
          <CampaignForm
            initialValues={editCampaign || undefined}
            onSave={async (values) => {
              const res = await authFetch(
                `/api/campaigns/${editCampaign!.id}`,
                {
                  method: "PATCH",
                  body: JSON.stringify(values),
                },
              );
              if (res.ok) {
                const cRes = await authFetch("/api/campaigns/");
                if (cRes.ok) setCampaigns(await cRes.json());
                setEditCampaign(null);
                // Notify other pages of campaign change
                window.dispatchEvent(new CustomEvent("campaignChanged"));
              }
            }}
            onCancel={() => setEditCampaign(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Campaign Form Component
function CampaignForm({
  onSave,
  onCancel,
  initialValues,
}: {
  onSave: (values: any) => void;
  onCancel: () => void;
  initialValues?: Campaign;
}) {
  const [form, setForm] = useState({
    name: initialValues?.name || "",
    description: initialValues?.description || "",
    default_utm: {
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_term: "",
      utm_content: "",
    },
  });

  // Update form when initialValues change
  useEffect(() => {
    if (initialValues) {
      setForm({
        name: initialValues.name || "",
        description: initialValues.description || "",
        default_utm: {
          utm_source: "",
          utm_medium: "",
          utm_campaign: "",
          utm_term: "",
          utm_content: "",
        },
      });
    }
  }, [initialValues]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Campaign Name *
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border p-2 rounded"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border p-2 rounded"
          rows={3}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Default UTM Parameters
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(form.default_utm).map(([key, value]) => (
            <div key={key}>
              <label className="block text-xs text-gray-600 mb-1">
                {key.replace("utm_", "").toUpperCase()}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) =>
                  setForm({
                    ...form,
                    default_utm: { ...form.default_utm, [key]: e.target.value },
                  })
                }
                className="w-full border p-2 rounded text-sm"
                placeholder={`Enter ${key.replace("utm_", "")}...`}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Button onClick={() => onSave(form)}>
          {initialValues ? "Update Campaign" : "Create Campaign"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
*/

"use client";
import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Plus, Link, X, Edit, Trash2, Info } from "lucide-react";
import { authFetch } from "@/lib/api";
import { UtmTemplateModal } from "@/app/components/UtmTemplateModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/multi-select";

function getUtmParams(obj: any) {
  let utm = obj?.utm_params;
  if (utm && typeof utm === "string") {
    try {
      utm = JSON.parse(utm);
    } catch {
      utm = {};
    }
  }
  return utm || {};
}

interface Campaign {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  templates?: UTMTemplate[];
}

interface UTMTemplate {
  id: number;
  name: string;
  description: string;
  is_global: boolean;
  pinned?: boolean;
  utm_params: any;
  campaigns?: Campaign[];
  created_at?: string;
}

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  default_utm: z.object({
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_term: z.string().optional(),
    utm_content: z.string().optional(),
  }),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allTemplates, setAllTemplates] = useState<UTMTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSelected, setAssignSelected] = useState<number[]>([]);
  const [templateDetail, setTemplateDetail] = useState<UTMTemplate | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<UTMTemplate | null>(null);
  const [campaignModalState, setCampaignModalState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    campaign?: Campaign;
  }>({ open: false, mode: "create" });

  // Fetch all campaigns and templates
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const cRes = await authFetch("/api/campaigns/");
      const tRes = await authFetch("/api/utm-templates/");
      if (cRes.ok) setCampaigns(await cRes.json());
      if (tRes.ok) setAllTemplates(await tRes.json());
      setLoading(false);
    };
    fetchAll();
  }, []);

  const refreshCampaigns = async () => {
    const cRes = await authFetch("/api/campaigns/");
    if (cRes.ok) setCampaigns(await cRes.json());
    window.dispatchEvent(new CustomEvent("campaignChanged"));
  };

  const openTemplatesModal = async (campaign: Campaign) => {
    setActiveCampaign(campaign);
    setShowTemplatesModal(true);
    const res = await authFetch(`/api/campaigns/${campaign.id}/templates`);
    if (res.ok) {
      const data = await res.json();
      setActiveCampaign((c) => (c ? { ...c, templates: data } : c));
    }
  };

  const handleAssign = async () => {
    if (!activeCampaign || assignSelected.length === 0) return;
    await authFetch(`/api/campaigns/${activeCampaign.id}/templates`, {
      method: "POST",
      body: JSON.stringify({ template_ids: assignSelected }),
    });
    await openTemplatesModal(activeCampaign);
    setShowAssignModal(false);
    setAssignSelected([]);
    window.dispatchEvent(new CustomEvent("campaignChanged"));
  };

  const handleUnlink = async (templateId: number) => {
    if (!activeCampaign) return;
    await authFetch(
      `/api/campaigns/${activeCampaign.id}/templates/${templateId}`,
      { method: "DELETE" },
    );
    await openTemplatesModal(activeCampaign);
    window.dispatchEvent(new CustomEvent("campaignChanged"));
  };

  const handleDeleteCampaign = async (campaignId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this campaign? This will also remove all template assignments.",
      )
    )
      return;
    const response = await authFetch(`/api/campaigns/${campaignId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      await refreshCampaigns();
    }
  };

  const availableToAssign =
    (activeCampaign &&
      allTemplates.filter((t) => {
        if (!activeCampaign.templates) return false;
        const already = activeCampaign.templates.some((at) => at.id === t.id);
        return !already;
      })) ||
    [];

  if (loading)
    return <div className="max-w-4xl mx-auto px-6 py-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Button
          onClick={() => setCampaignModalState({ open: true, mode: "create" })}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Campaign
        </Button>
      </div>

      <div className="bg-white rounded border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2">ID</th>
              <th className="p-2">Name</th>
              <th className="p-2">Templates</th>
              <th className="p-2">Created</th>
              <th className="p-2">Actions</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.id}</td>
                <td className="p-2 font-semibold">{c.name}</td>
                <td className="p-2">
                  <span className="text-sm text-gray-600">
                    {c.templates ? c.templates.length : 0} templates
                  </span>
                </td>
                <td className="p-2">
                  {c.created_at
                    ? new Date(c.created_at).toLocaleDateString()
                    : ""}
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCampaignModalState({
                          open: true,
                          mode: "edit",
                          campaign: c,
                        })
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCampaign(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
                <td className="p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openTemplatesModal(c)}
                  >
                    <Link className="h-4 w-4 mr-1 inline" />
                    {c.templates ? c.templates.length : 0} Templates
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Templates Modal */}
      {showTemplatesModal && activeCampaign && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded shadow-lg w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute right-4 top-4"
              onClick={() => {
                setShowTemplatesModal(false);
                setActiveCampaign(null);
                setTemplateDetail(null);
              }}
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold mb-4">
              Templates for {activeCampaign.name}
            </h2>
            <div className="mb-4 flex gap-2">
              <Button
                variant={showAssignModal ? "default" : "secondary"}
                onClick={() => setShowAssignModal((v) => !v)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {showAssignModal
                  ? "Hide Template Assignment"
                  : "Add Existing Templates"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create New Template
              </Button>
            </div>

            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-2">Name</th>
                  <th className="p-2">Global</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(activeCampaign.templates || []).map((t) => (
                  <tr key={t.id} className="border-t">
                    <td
                      className="p-2 font-semibold cursor-pointer hover:text-blue-600"
                      onClick={() => setTemplateDetail(t)}
                    >
                      {t.name}
                    </td>
                    <td className="p-2">
                      {t.is_global ? (
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                          Global
                        </span>
                      ) : null}
                    </td>
                    <td className="p-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTemplateDetail(t)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditTemplate(t)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlink(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {activeCampaign.templates &&
                  activeCampaign.templates.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center">
                        <span className="text-sm text-zinc-400">
                          No templates assigned.
                        </span>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>

            {showAssignModal && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-base">
                    Assign Existing Templates
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAssignModal(false)}
                  >
                    <X className="h-4 w-4 mr-1" /> Close
                  </Button>
                </div>

                <MultiSelect
                  options={availableToAssign.map((t) => ({
                    label: `${t.name}${t.is_global ? " (Global)" : ""}`,
                    value: String(t.id),
                  }))}
                  defaultValue={assignSelected.map(String)}
                  onValueChange={(vals) => setAssignSelected(vals.map(Number))}
                  placeholder="Choose one or more templates"
                  emptyIndicator="No templates available"
                  maxCount={3}
                />

                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleAssign}
                    disabled={assignSelected.length === 0}
                  >
                    Assign Templates
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Template Detail Modal */}
      {templateDetail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded shadow-lg w-full max-w-lg relative">
            <button
              className="absolute right-4 top-4"
              onClick={() => setTemplateDetail(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold mb-2">{templateDetail.name}</h3>
            <div className="mb-2 text-muted-foreground">
              {templateDetail.description}
            </div>
            <div className="flex gap-2 flex-wrap mb-2">
              {templateDetail.is_global && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                  Global
                </span>
              )}
              {templateDetail.campaigns && templateDetail.campaigns.length
                ? templateDetail.campaigns.map((c) => (
                    <span
                      key={c.id}
                      className="bg-gray-100 px-2 py-1 rounded text-xs"
                    >
                      {c.name}
                    </span>
                  ))
                : null}
            </div>
            <div className="mt-2 mb-2">
              <strong>UTM Params:</strong>
              <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                {Object.entries(getUtmParams(templateDetail))
                  .filter(([key, value]) => value)
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
              {templateDetail.created_at
                ? new Date(templateDetail.created_at).toLocaleString()
                : ""}
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      <UtmTemplateModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        initialValues={{
          campaign_ids: activeCampaign ? [activeCampaign.id] : [],
          is_global: false,
          utm_params: {
            utm_source: "",
            utm_medium: "",
            utm_campaign: "",
            utm_term: "",
            utm_content: "",
          },
        }}
        onSave={async (values) => {
          await authFetch("/api/utm-templates/", {
            method: "POST",
            body: JSON.stringify(values),
          });
          if (activeCampaign) {
            await openTemplatesModal(activeCampaign);
          }
          setShowCreateModal(false);
        }}
        campaigns={campaigns}
      />

      {/* Edit Template Modal */}

      <UtmTemplateModal
        open={!!editTemplate}
        onOpenChange={(o) => {
          if (!o) setEditTemplate(null);
        }}
        initialValues={
          editTemplate
            ? {
                name: editTemplate.name,
                description: editTemplate.description,
                utm_params: editTemplate.utm_params,
                is_global: editTemplate.is_global,
                campaign_ids: editTemplate.campaigns?.map((c) => c.id) || [],
              }
            : undefined
        }
        onSave={async (values) => {
          await authFetch(`/api/utm-templates/${editTemplate!.id}`, {
            method: "PATCH",
            body: JSON.stringify(values),
          });
          await openTemplatesModal(activeCampaign!);
          setEditTemplate(null);
        }}
        campaigns={campaigns}
      />

      {/* Campaign Modal */}
      <Dialog
        open={campaignModalState.open}
        onOpenChange={(open) => {
          if (!open) {
            setCampaignModalState({ open: false, mode: "create" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {campaignModalState.mode === "create"
                ? "Create New Campaign"
                : "Edit Campaign"}
            </DialogTitle>
          </DialogHeader>
          <CampaignForm
            initialValues={campaignModalState.campaign}
            onSave={async (values) => {
              if (
                campaignModalState.mode === "edit" &&
                campaignModalState.campaign
              ) {
                await authFetch(
                  `/api/campaigns/${campaignModalState.campaign.id}`,
                  {
                    method: "PATCH",
                    body: JSON.stringify(values),
                  },
                );
              } else {
                await authFetch("/api/campaigns/", {
                  method: "POST",
                  body: JSON.stringify(values),
                });
              }
              await refreshCampaigns();
              setCampaignModalState({ open: false, mode: "create" });
            }}
            onCancel={() =>
              setCampaignModalState({ open: false, mode: "create" })
            }
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Campaign Form Component with shadcn
function CampaignForm({
  onSave,
  onCancel,
  initialValues,
}: {
  onSave: (values: CampaignFormValues) => void;
  onCancel: () => void;
  initialValues?: Campaign;
}) {
  const defaultValues: CampaignFormValues = {
    name: initialValues?.name || "",
    description: initialValues?.description || "",
    default_utm: {
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_term: "",
      utm_content: "",
    },
  };

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues,
  });

  const { control, handleSubmit, formState } = form;
  const { isSubmitting } = formState;

  const onSubmit = async (values: CampaignFormValues) => {
    await onSave(values);
  };

  const utmKeys = [
    { key: "utm_source" as const, label: "Source" },
    { key: "utm_medium" as const, label: "Medium" },
    { key: "utm_campaign" as const, label: "Campaign" },
    { key: "utm_term" as const, label: "Term" },
    { key: "utm_content" as const, label: "Content" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter campaign name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Enter campaign description"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <label className="text-sm font-medium mb-2 block">
            Default UTM Parameters
          </label>
          <div className="grid grid-cols-2 gap-4">
            {utmKeys.map(({ key, label }) => (
              <FormField
                key={key}
                control={control}
                name={`default_utm.${key}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{label}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={`Enter ${label.toLowerCase()}`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : initialValues
                ? "Update Campaign"
                : "Create Campaign"}
          </Button>
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
