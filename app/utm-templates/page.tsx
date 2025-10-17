"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { authFetch } from "@/lib/api";

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
  created_at: string;
}

export default function UTMTemplatesPage() {
  const [templates, setTemplates] = useState<UTMTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<UTMTemplate | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    utm_params: {
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_term: "",
      utm_content: "",
    },
  });

  const loadTemplates = async () => {
    try {
      const response = await authFetch("/api/utm-templates/");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to load UTM templates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const url = editingTemplate
        ? `/api/utm-templates/${editingTemplate.id}`
        : "/api/utm-templates/";
      const method = editingTemplate ? "PATCH" : "POST";

      const response = await authFetch(url, {
        method,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadTemplates();
        setShowForm(false);
        setEditingTemplate(null);
        setFormData({
          name: "",
          description: "",
          utm_params: {
            utm_source: "",
            utm_medium: "",
            utm_campaign: "",
            utm_term: "",
            utm_content: "",
          },
        });
      }
    } catch (error) {
      console.error("Failed to save UTM template:", error);
    }
  };

  const handleEdit = (template: UTMTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      utm_params: {
        utm_source: template.utm_params.utm_source || "",
        utm_medium: template.utm_params.utm_medium || "",
        utm_campaign: template.utm_params.utm_campaign || "",
        utm_term: template.utm_params.utm_term || "",
        utm_content: template.utm_params.utm_content || "",
      },
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this UTM template?")) return;

    try {
      const response = await authFetch(`/api/utm-templates/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await loadTemplates();
      }
    } catch (error) {
      console.error("Failed to delete UTM template:", error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setFormData({
      name: "",
      description: "",
      utm_params: {
        utm_source: "",
        utm_medium: "",
        utm_campaign: "",
        utm_term: "",
        utm_content: "",
      },
    });
  };

  const updateUTMParam = (key: string, value: string) => {
    setFormData({
      ...formData,
      utm_params: {
        ...formData.utm_params,
        [key]: value,
      },
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">UTM Templates</h1>
          <p className="text-muted-foreground">
            Create reusable UTM parameter sets for consistent tracking.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {showForm && (
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">
            {editingTemplate ? "Edit UTM Template" : "Create New UTM Template"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter template name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter template description"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">UTM Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Source
                  </label>
                  <input
                    type="text"
                    value={formData.utm_params.utm_source}
                    onChange={(e) =>
                      updateUTMParam("utm_source", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., google, facebook"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Medium
                  </label>
                  <input
                    type="text"
                    value={formData.utm_params.utm_medium}
                    onChange={(e) =>
                      updateUTMParam("utm_medium", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., cpc, email, social"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Campaign
                  </label>
                  <input
                    type="text"
                    value={formData.utm_params.utm_campaign}
                    onChange={(e) =>
                      updateUTMParam("utm_campaign", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., summer_sale"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Term</label>
                  <input
                    type="text"
                    value={formData.utm_params.utm_term}
                    onChange={(e) => updateUTMParam("utm_term", e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., running shoes"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Content
                  </label>
                  <input
                    type="text"
                    value={formData.utm_params.utm_content}
                    onChange={(e) =>
                      updateUTMParam("utm_content", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="e.g., logolink, textlink"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editingTemplate ? "Update Template" : "Create Template"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No UTM templates created yet.
            </p>
            <Button onClick={() => setShowForm(true)} className="mt-4">
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
