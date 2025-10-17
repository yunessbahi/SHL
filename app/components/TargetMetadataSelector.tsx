"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Plus, X } from "lucide-react";
import { authFetch } from "@/lib/api";

interface Campaign {
  id: number;
  name: string;
  description: string;
  default_utm: any;
}

interface Group {
  id: number;
  name: string;
  description: string;
}

interface UTMTemplate {
  id: number;
  name: string;
  description: string;
  utm_params: any;
}

interface TargetMetadataSelectorProps {
  campaignId?: number;
  groupId?: number;
  utmTemplateId?: number;
  onCampaignChange: (id: number | null) => void;
  onGroupChange: (id: number | null) => void;
  onUTMTemplateChange: (id: number | null) => void;
}

export default function TargetMetadataSelector({
  campaignId,
  groupId,
  utmTemplateId,
  onCampaignChange,
  onGroupChange,
  onUTMTemplateChange,
}: TargetMetadataSelectorProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [utmTemplates, setUtmTemplates] = useState<UTMTemplate[]>([]);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: "", description: "" });
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });
  const [newTemplate, setNewTemplate] = useState({
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

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [campaignsRes, groupsRes, templatesRes] = await Promise.all([
          authFetch("/api/campaigns/"),
          authFetch("/api/groups/"),
          authFetch("/api/utm-templates/"),
        ]);

        if (campaignsRes.ok) setCampaigns(await campaignsRes.json());
        if (groupsRes.ok) setGroups(await groupsRes.json());
        if (templatesRes.ok) setUtmTemplates(await templatesRes.json());
      } catch (error) {
        console.error("Failed to load metadata:", error);
      }
    };
    loadData();
  }, []);

  const createCampaign = async () => {
    try {
      const res = await authFetch("/api/campaigns/", {
        method: "POST",
        body: JSON.stringify(newCampaign),
      });
      if (res.ok) {
        const campaign = await res.json();
        setCampaigns([campaign, ...campaigns]);
        onCampaignChange(campaign.id);
        setShowCampaignForm(false);
        setNewCampaign({ name: "", description: "" });
      }
    } catch (error) {
      console.error("Failed to create campaign:", error);
    }
  };

  const createGroup = async () => {
    try {
      const res = await authFetch("/api/groups/", {
        method: "POST",
        body: JSON.stringify(newGroup),
      });
      if (res.ok) {
        const group = await res.json();
        setGroups([group, ...groups]);
        onGroupChange(group.id);
        setShowGroupForm(false);
        setNewGroup({ name: "", description: "" });
      }
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  const createTemplate = async () => {
    try {
      const res = await authFetch("/api/utm-templates/", {
        method: "POST",
        body: JSON.stringify(newTemplate),
      });
      if (res.ok) {
        const template = await res.json();
        setUtmTemplates([template, ...utmTemplates]);
        onUTMTemplateChange(template.id);
        setShowTemplateForm(false);
        setNewTemplate({
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
      console.error("Failed to create UTM template:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Campaign Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Campaign</CardTitle>
          <CardDescription className="text-xs">
            Associate with a marketing campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <select
            value={campaignId || ""}
            onChange={(e) =>
              onCampaignChange(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            <option value="">No campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCampaignForm(true)}
            className="w-full"
          >
            <Plus className="h-3 w-3 mr-1" />
            New Campaign
          </Button>
        </CardContent>
      </Card>

      {/* Group Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Group</CardTitle>
          <CardDescription className="text-xs">
            Organize for A/B testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <select
            value={groupId || ""}
            onChange={(e) =>
              onGroupChange(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            <option value="">No group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowGroupForm(true)}
            className="w-full"
          >
            <Plus className="h-3 w-3 mr-1" />
            New Group
          </Button>
        </CardContent>
      </Card>

      {/* UTM Template Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">UTM Template</CardTitle>
          <CardDescription className="text-xs">
            Apply predefined UTM parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <select
            value={utmTemplateId || ""}
            onChange={(e) =>
              onUTMTemplateChange(
                e.target.value ? Number(e.target.value) : null,
              )
            }
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            <option value="">No template</option>
            {utmTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateForm(true)}
            className="w-full"
          >
            <Plus className="h-3 w-3 mr-1" />
            New Template
          </Button>
        </CardContent>
      </Card>

      {/* Campaign Creation Modal */}
      {showCampaignForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create Campaign</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCampaignForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="campaign-name">Name</Label>
                <Input
                  id="campaign-name"
                  value={newCampaign.name}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, name: e.target.value })
                  }
                  placeholder="Enter campaign name"
                />
              </div>
              <div>
                <Label htmlFor="campaign-description">Description</Label>
                <Input
                  id="campaign-description"
                  value={newCampaign.description}
                  onChange={(e) =>
                    setNewCampaign({
                      ...newCampaign,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter campaign description"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={createCampaign}
                  disabled={!newCampaign.name.trim()}
                >
                  Create
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCampaignForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Group Creation Modal */}
      {showGroupForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create Group</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGroupForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="group-name">Name</Label>
                <Input
                  id="group-name"
                  value={newGroup.name}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, name: e.target.value })
                  }
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <Label htmlFor="group-description">Description</Label>
                <Input
                  id="group-description"
                  value={newGroup.description}
                  onChange={(e) =>
                    setNewGroup({ ...newGroup, description: e.target.value })
                  }
                  placeholder="Enter group description"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createGroup} disabled={!newGroup.name.trim()}>
                  Create
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowGroupForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* UTM Template Creation Modal */}
      {showTemplateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create UTM Template</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplateForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template-name">Name</Label>
                <Input
                  id="template-name"
                  value={newTemplate.name}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, name: e.target.value })
                  }
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <Label htmlFor="template-description">Description</Label>
                <Input
                  id="template-description"
                  value={newTemplate.description}
                  onChange={(e) =>
                    setNewTemplate({
                      ...newTemplate,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter template description"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">UTM Parameters</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label htmlFor="utm-source" className="text-xs">
                      Source
                    </Label>
                    <Input
                      id="utm-source"
                      value={newTemplate.utm_params.utm_source}
                      onChange={(e) =>
                        setNewTemplate({
                          ...newTemplate,
                          utm_params: {
                            ...newTemplate.utm_params,
                            utm_source: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g., google"
                    />
                  </div>
                  <div>
                    <Label htmlFor="utm-medium" className="text-xs">
                      Medium
                    </Label>
                    <Input
                      id="utm-medium"
                      value={newTemplate.utm_params.utm_medium}
                      onChange={(e) =>
                        setNewTemplate({
                          ...newTemplate,
                          utm_params: {
                            ...newTemplate.utm_params,
                            utm_medium: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g., cpc"
                    />
                  </div>
                  <div>
                    <Label htmlFor="utm-campaign" className="text-xs">
                      Campaign
                    </Label>
                    <Input
                      id="utm-campaign"
                      value={newTemplate.utm_params.utm_campaign}
                      onChange={(e) =>
                        setNewTemplate({
                          ...newTemplate,
                          utm_params: {
                            ...newTemplate.utm_params,
                            utm_campaign: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g., summer_sale"
                    />
                  </div>
                  <div>
                    <Label htmlFor="utm-term" className="text-xs">
                      Term
                    </Label>
                    <Input
                      id="utm-term"
                      value={newTemplate.utm_params.utm_term}
                      onChange={(e) =>
                        setNewTemplate({
                          ...newTemplate,
                          utm_params: {
                            ...newTemplate.utm_params,
                            utm_term: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g., running shoes"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="utm-content" className="text-xs">
                      Content
                    </Label>
                    <Input
                      id="utm-content"
                      value={newTemplate.utm_params.utm_content}
                      onChange={(e) =>
                        setNewTemplate({
                          ...newTemplate,
                          utm_params: {
                            ...newTemplate.utm_params,
                            utm_content: e.target.value,
                          },
                        })
                      }
                      placeholder="e.g., logolink"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={createTemplate}
                  disabled={!newTemplate.name.trim()}
                >
                  Create
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowTemplateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
