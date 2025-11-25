"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Combobox,
  formatCampaignOptions,
  formatGroupOptions,
} from "@/components/ui/combobox-default";

interface Campaign {
  id: number;
  name: string;
  description: string;
  lifecycle_attr?: number; // Campaign lifecycle type
  status?: string; // Campaign status: active, paused, inactive
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
  fallbackUrl: string; // New fallback URL field
  campaignIds: number[]; // Changed to array for MultiSelect
  groupIds: number[]; // Changed to array for MultiSelect

  // Advanced validation fields
  ipAddresses?: string; // Comma-separated IP addresses
  referers?: string; // Comma-separated referer patterns

  // Available options
  campaigns?: Campaign[];
  groups?: Group[];
  loadingCampaigns?: boolean;
  loadingGroups?: boolean;

  // Edit mode flag
  isEdit?: boolean;

  // Change handlers
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onFallbackUrlChange: (url: string) => void; // New handler
  onCampaignChange: (ids: number[]) => void;
  onGroupChange: (ids: number[]) => void;

  // Advanced validation handlers
  onIpAddressesChange: (ipAddresses: string) => void;
  onReferersChange: (referers: string) => void;

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
  fallbackUrl,
  campaignIds = [],
  groupIds = [],
  ipAddresses = "",
  referers = "",
  campaigns = [],
  groups = [],
  loadingCampaigns = false,
  loadingGroups = false,
  isEdit = false,
  onNameChange,
  onDescriptionChange,
  onFallbackUrlChange,
  onCampaignChange,
  onGroupChange,
  onIpAddressesChange,
  onReferersChange,
  onCreateCampaign,
  onCampaignChangeWithLifecycle,
  onCreateGroup,
}: LinkMetadataFormProps) {
  // State for collapsible advanced rules section
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Get selected values (take first item from arrays for single selection)
  const selectedCampaignId = campaignIds.length > 0 ? campaignIds[0] : "";
  const selectedGroupId = groupIds.length > 0 ? groupIds[0] : "";

  // Check if selected campaign is inactive (for edit mode warnings)
  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);
  const isSelectedCampaignInactive =
    selectedCampaign && selectedCampaign.status !== "active";

  const handleCampaignChange = (value: string | number | null) => {
    if (!value) {
      onCampaignChange([]);
      if (onCampaignChangeWithLifecycle) {
        onCampaignChangeWithLifecycle(null, undefined);
      }
    } else {
      const campaignId = parseInt(String(value));
      onCampaignChange([campaignId]);

      // Find campaign and pass lifecycle info
      const campaign = campaigns.find((c) => c.id === campaignId);
      if (onCampaignChangeWithLifecycle) {
        onCampaignChangeWithLifecycle(campaignId, campaign?.lifecycle_attr);
      }
    }
  };

  const handleGroupChange = (value: string | number | null) => {
    if (!value) {
      onGroupChange([]);
    } else {
      onGroupChange([parseInt(String(value))]);
    }
  };

  // Format campaign and group options
  // In edit mode, show all campaigns (including inactive) so users can reassign
  // In create mode, only show active campaigns
  const campaignOptions = formatCampaignOptions(campaigns, true, !isEdit);
  const groupOptions = formatGroupOptions(groups, true);

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

        <div>
          <Label htmlFor="fallback-url">Fallback URL</Label>
          <Input
            id="fallback-url"
            value={fallbackUrl}
            onChange={(e) => onFallbackUrlChange(e.target.value)}
            placeholder="Enter fallback URL (used when no targets match)"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            This URL will be used when no targets match the user's conditions
            (smart links only)
          </p>
        </div>
      </div>

      {/* Campaign Status Warning for Edit Mode */}
      {isEdit && isSelectedCampaignInactive && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-900">
                Campaign Status Warning
              </p>
              <p className="text-amber-700">
                This link is associated with a {selectedCampaign?.status}{" "}
                campaign. Consider reassigning it to an active campaign for
                better organization.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metadata Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Campaign Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Campaign</CardTitle>
            <CardDescription className="text-xs">
              Associate with marketing campaigns{" "}
              {isEdit
                ? "(all campaigns available for reassignment)"
                : "(only active campaigns are available for selection)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingCampaigns ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Combobox
                options={campaignOptions}
                value={selectedCampaignId}
                onValueChange={handleCampaignChange}
                placeholder="Select a campaign"
                searchPlaceholder="Search campaigns..."
                allowClear={false}
              />
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
              <Combobox
                options={groupOptions}
                value={selectedGroupId}
                onValueChange={handleGroupChange}
                placeholder="Select a group"
                searchPlaceholder="Search groups..."
                allowClear={false}
              />
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

      {/* Advanced Rules Section */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-between"
          >
            <span className="text-sm font-medium">Advanced Rules</span>
            {isAdvancedOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">IP Address Validation</CardTitle>
              <CardDescription className="text-xs">
                Restrict access based on visitor IP addresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="ip-addresses">Allowed IP Addresses</Label>
                <Textarea
                  id="ip-addresses"
                  value={ipAddresses}
                  onChange={(e) => onIpAddressesChange(e.target.value)}
                  placeholder="Enter IP addresses separated by commas&#10;Example: 192.168.1.1, 10.0.0.1, 203.0.113.1"
                  className="mt-1"
                  rows={2}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports IPv4 and IPv6. Leave empty to allow all IPs.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Referer Validation</CardTitle>
              <CardDescription className="text-xs">
                Restrict access based on referer URL patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="referers">Allowed Referer Patterns</Label>
                <Textarea
                  id="referers"
                  value={referers}
                  onChange={(e) => onReferersChange(e.target.value)}
                  placeholder="Enter referer patterns separated by commas&#10;Example: *.google.com, *.facebook.com, https://example.com/*"
                  className="mt-1"
                  rows={2}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports wildcards (*.example.com). Leave empty to allow all
                  referers.
                </p>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
