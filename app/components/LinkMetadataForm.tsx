"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authFetch } from "@/lib/api";

interface Campaign {
  id: number;
  name: string;
  description: string;
}

interface Group {
  id: number;
  name: string;
  description: string;
}

interface LinkMetadataFormProps {
  name: string;
  description: string;
  campaignId: number | null;
  groupId: number | null;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onCampaignChange: (id: number | null) => void;
  onGroupChange: (id: number | null) => void;
  onCreateCampaign?: () => void;
  onCreateGroup?: () => void;
}

export default function LinkMetadataForm({
  name,
  description,
  campaignId,
  groupId,
  onNameChange,
  onDescriptionChange,
  onCampaignChange,
  onGroupChange,
  onCreateCampaign,
  onCreateGroup,
}: LinkMetadataFormProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: "", description: "" });
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });

  // Load campaigns and groups
  useEffect(() => {
    const loadData = async () => {
      try {
        const [campaignsRes, groupsRes] = await Promise.all([
          authFetch("/api/campaigns/"),
          authFetch("/api/groups/"),
        ]);

        if (campaignsRes.ok) setCampaigns(await campaignsRes.json());
        if (groupsRes.ok) setGroups(await groupsRes.json());
      } catch (error) {
        console.error("Failed to load metadata:", error);
      } finally {
        setLoadingCampaigns(false);
        setLoadingGroups(false);
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

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="link-name">Link Name *</Label>
          <Input
            id="link-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter link name"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="link-description">Description</Label>
          <Textarea
            id="link-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Enter link description"
            rows={3}
            className="mt-1"
          />
        </div>
      </div>

      {/* Metadata Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Campaign Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Campaign</CardTitle>
            <CardDescription className="text-xs">
              Associate with a marketing campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingCampaigns ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <select
                value={campaignId || ""}
                onChange={(e) =>
                  onCampaignChange(
                    e.target.value ? Number(e.target.value) : null,
                  )
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
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onCreateCampaign
                  ? onCreateCampaign()
                  : setShowCampaignForm(true)
              }
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
            {loadingGroups ? (
              <Skeleton className="h-10 w-full" />
            ) : (
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
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onCreateGroup ? onCreateGroup() : setShowGroupForm(true)
              }
              className="w-full"
            >
              <Plus className="h-3 w-3 mr-1" />
              New Group
            </Button>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
}
