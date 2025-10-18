"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { authFetch } from "@/lib/api";
import { UtmTemplateModal } from "@/app/components/UtmTemplateModal";

interface Campaign {
  id: number;
  name: string;
}
interface UTMTemplate {
  id: number;
  name: string;
  description: string;
  utm_params: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
  is_global: boolean;
  campaigns: Campaign[];
  created_at: string;
}

export default function UTMTemplatesPage() {
  const [templates, setTemplates] = useState<UTMTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UTMTemplate | null>(null);
  const [modalInitial, setModalInitial] = useState<any>(null);
  // Fetch campaigns for dropdown
  const loadCampaigns = async () => {
    const res = await authFetch("/api/campaigns/");
    if (res.ok) setCampaigns(await res.json());
  };
  const loadTemplates = async () => {
    try {
      const response = await authFetch("/api/utm-templates/");
      if (response.ok) setTemplates(await response.json());
    } catch (error) {
      console.error("Failed to load UTM templates:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadTemplates();
    loadCampaigns();
  }, []);
  // Launch create
  const openCreate = () => {
    setModalInitial(undefined);
    setEditing(null);
    setModalOpen(true);
  };
  // Launch edit
  const handleEdit = (template: UTMTemplate) => {
    setModalInitial({
      ...template,
      campaign_ids: template.campaigns?.map((c) => c.id) || [],
    });
    setEditing(template);
    setModalOpen(true);
  };
  // Save logic (create or edit)
  const handleSave = async (values: any) => {
    let url = "/api/utm-templates/";
    let method: "POST" | "PATCH" = "POST";
    if (editing) {
      url = `/api/utm-templates/${editing.id}`;
      method = "PATCH";
    }
    const res = await authFetch(url, { method, body: JSON.stringify(values) });
    if (!res.ok) throw new Error(await res.text());
    await loadTemplates();
    setEditing(null);
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this UTM template?")) return;
    const response = await authFetch(`/api/utm-templates/${id}`, {
      method: "DELETE",
    });
    if (response.ok) await loadTemplates();
  };
  if (loading) return <div>Loading...</div>;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">UTM Templates</h1>
          <p className="text-muted-foreground">
            Create reusable UTM parameter sets for consistent tracking.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>
      <UtmTemplateModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialValues={modalInitial}
        onSave={handleSave}
        campaigns={campaigns}
      />
      <div className="grid gap-4">
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No UTM templates created yet.
            </p>
            <Button onClick={openCreate} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template.id} className="bg-card p-6 rounded-lg border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  {template.description && (
                    <p className="text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  )}
                  <div className="mt-1 flex gap-2 flex-wrap text-xs text-muted-foreground">
                    {template.is_global ? (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        Global
                      </span>
                    ) : template.campaigns && template.campaigns.length ? (
                      template.campaigns.map((c) => (
                        <span
                          key={c.id}
                          className="px-2 py-1 bg-gray-100 rounded"
                        >
                          {c.name}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        No campaigns
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-2">
                      UTM Parameters:
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                      {Object.entries(template.utm_params).map(
                        ([key, value]) =>
                          value && (
                            <div key={key} className="bg-muted p-2 rounded">
                              <span className="font-medium">
                                {key.replace("utm_", "")}:
                              </span>
                              <span className="ml-1">{value}</span>
                            </div>
                          ),
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Created {new Date(template.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
