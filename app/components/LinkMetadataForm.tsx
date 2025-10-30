"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Campaign {
  id: number;
  name: string;
  description: string;
  lifecycle_attr?: number; // Campaign lifecycle type
}

interface Group {
  id: number;
  name: string;
  description?: string | null;
}

interface LinkMetadataFormProps {
  // Form values
  name: string;
  description: string;
  campaignIds: number[]; // Changed to array for MultiSelect
  groupIds: number[]; // Changed to array for MultiSelect

  // Available options
  campaigns?: Campaign[];
  groups?: Group[];
  loadingCampaigns?: boolean;
  loadingGroups?: boolean;

  // Change handlers
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onCampaignChange: (ids: number[]) => void;
  onGroupChange: (ids: number[]) => void;

  // Action callbacks
  onCreateCampaign?: () => void;
  onCreateGroup?: () => void;

  // Campaign change callback with lifecycle info
  onCampaignChangeWithLifecycle?: (
    campaignId: number | null,
    lifecycleAttr?: number,
  ) => void;
}

/**
 * Clean, focused LinkMetadataForm component
 * Handles only UI rendering and user interactions
 * All data fetching and creation handled by parent components
 * Updated to use MultiSelect for better dropdown functionality
 */
export default function LinkMetadataForm({
  name,
  description,
  campaignIds = [],
  groupIds = [],
  campaigns = [],
  groups = [],
  loadingCampaigns = false,
  loadingGroups = false,
  onNameChange,
  onDescriptionChange,
  onCampaignChange,
  onGroupChange,
  onCreateCampaign,
  onCampaignChangeWithLifecycle,
  onCreateGroup,
}: LinkMetadataFormProps) {
  // Get selected values (take first item from arrays for single selection)
  const selectedCampaignId = campaignIds.length > 0 ? campaignIds[0] : "";
  const selectedGroupId = groupIds.length > 0 ? groupIds[0] : "";

  const handleCampaignChange = (value: string) => {
    if (value === "none") {
      onCampaignChange([]);
      if (onCampaignChangeWithLifecycle) {
        onCampaignChangeWithLifecycle(null, undefined);
      }
    } else {
      const campaignId = parseInt(value);
      onCampaignChange([campaignId]);

      // Find campaign and pass lifecycle info
      const campaign = campaigns.find((c) => c.id === campaignId);
      if (onCampaignChangeWithLifecycle) {
        onCampaignChangeWithLifecycle(campaignId, campaign?.lifecycle_attr);
      }
    }
  };

  const handleGroupChange = (value: string) => {
    if (value === "none") {
      onGroupChange([]);
    } else {
      onGroupChange([parseInt(value)]);
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
            required
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
              Associate with marketing campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingCampaigns ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedCampaignId.toString()}
                onValueChange={handleCampaignChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No campaign</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem
                      key={campaign.id}
                      value={campaign.id.toString()}
                    >
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCreateCampaign}
              className="w-full"
              disabled={!onCreateCampaign}
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
              <Select
                value={selectedGroupId.toString()}
                onValueChange={handleGroupChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No group</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCreateGroup}
              className="w-full"
              disabled={!onCreateGroup}
            >
              <Plus className="h-3 w-3 mr-1" />
              New Group
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
