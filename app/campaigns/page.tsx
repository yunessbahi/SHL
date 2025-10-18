"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Plus, Link, X, Edit, Trash2, Info, ChevronDown } from "lucide-react";
import { authFetch } from "@/lib/api";
import { UtmTemplateModal } from "@/app/components/UtmTemplateModal";

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
    await openTemplatesModal(activeCampaign); // Refresh with updates
    closeAssignModal();
  };
  // Remove mapping
  const handleUnlink = async (templateId: number) => {
    if (!activeCampaign) return;
    await authFetch(
      `/api/campaigns/${activeCampaign.id}/templates/${templateId}`,
      { method: "DELETE" },
    );
    await openTemplatesModal(activeCampaign);
  };
  // Open template detail modal
  const showTemplateDetail = (template: UTMTemplate) => {
    setTemplateDetail(template);
  };

  const closeTemplateModal = () => setTemplateDetail(null);

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
      <h1 className="text-2xl font-bold mb-4">Campaigns</h1>
      <div className="bg-white rounded border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2">ID</th>
              <th className="p-2">Name</th>
              <th className="p-2">Templates</th>
              <th className="p-2">Created</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.id}</td>
                <td className="p-2 font-semibold">{c.name}</td>
                <td className="p-2">
                  {c.templates && c.templates.length > 0 ? (
                    <div className="flex gap-1 flex-wrap">
                      {c.templates.map((t: any) => (
                        <span
                          key={t.id}
                          className="inline-block px-2 py-1 bg-gray-100 rounded cursor-pointer"
                          title={t.description}
                          onClick={() => showTemplateDetail(t)}
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400">No templates</span>
                  )}
                </td>
                <td className="p-2">
                  {c.created_at
                    ? new Date(c.created_at).toLocaleDateString()
                    : ""}
                </td>
                <td className="p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openTemplatesModal(c)}
                  >
                    <Link className="h-4 w-4 mr-1 inline" />
                    Templates
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Assign/View Modal for Campaign Templates */}
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
            <div className="mb-4">
              <Button
                variant="secondary"
                onClick={() => setShowCreateModal(true)}
                className="mr-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Template
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
            {showAssignModal && (
              <div className="mb-4 border-t pt-4">
                <h3 className="font-semibold mb-2">
                  Assign Existing Templates
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <select
                    multiple
                    className="w-full border px-2 py-1 rounded"
                    value={assignSelected.map(String)}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions).map(
                        (opt) => Number(opt.value),
                      );
                      setAssignSelected(values);
                    }}
                  >
                    {availableToAssign.length === 0 && (
                      <option disabled>No assignable templates</option>
                    )}
                    {availableToAssign.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.is_global ? " (global)" : ""}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAssign}
                    disabled={assignSelected.length === 0}
                  >
                    Assign
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={closeAssignModal}
                  >
                    Cancel
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
                {Object.entries(templateDetail.utm_params)
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
            {/* Edit feature possible here (reuse UTM template modal) */}
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
    </div>
  );
}
