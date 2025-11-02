"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import LinkMetadataForm from "./LinkMetadataForm";
import BehaviorForm from "./BehaviorForm";
import TargetForm from "./TargetForm";
import CampaignModal from "./CampaignModal";
import { UtmTemplateModal } from "./UtmTemplateModal";
import { authFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  useFormState,
  useModalState,
  useAsyncState,
} from "@/lib/hooks/useFormState";
import { useGroups } from "@/lib/hooks/useGroups";

interface SingleLinkFormProps {
  userId: string;
  linkId?: number;
  initialData?: any;
  isEdit?: boolean;
}

/**
 * Redesigned SingleLinkForm with new campaign lifecycle logic:
 * - Always-on: Show "TTL Expiry (Auto-calculated)" from expires_at
 * - One-off/Infinite/No campaign: Show only end date (becomes expiry), no separate expires field
 * - Campaign change: Reset to initial values
 */
export default function SingleLinkForm({
  userId,
  linkId,
  initialData,
  isEdit = false,
}: SingleLinkFormProps) {
  const router = useRouter();

  // Campaign modal state
  const campaignModal = useModalState(false);
  const utmTemplateModal = useModalState(false);

  // Form submission state
  const [submitError, setSubmitError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Campaign data state
  const campaignState = useAsyncState<any[]>();
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  // Groups data state
  const { groups, loading: loadingGroups } = useGroups();

  // UTM templates state
  const [utmTemplates, setUtmTemplates] = useState<any[]>([]);
  const [campaignUtmTemplates, setCampaignUtmTemplates] = useState<any[]>([]);
  const [loadingUtmTemplates, setLoadingUtmTemplates] = useState(false);

  // Load campaigns on mount
  useEffect(() => {
    campaignState.execute(
      async () => {
        const res = await authFetch("/api/campaigns/");
        if (!res.ok) {
          throw new Error("Failed to load campaigns");
        }
        return await res.json();
      },
      {
        onError: (error) => {
          console.error("Failed to load campaigns:", error);
          toast.error("Failed to load campaigns");
        },
      },
    );
  }, []);

  // Link metadata form state
  const [metadataState, metadataActions] = useFormState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    campaignIds: initialData?.campaign_id ? [initialData.campaign_id] : [],
    groupIds: initialData?.group_id ? [initialData.group_id] : [],
  });

  // Load UTM templates with campaign relationships populated
  const loadUtmTemplates = useCallback(async () => {
    setLoadingUtmTemplates(true);
    try {
      // Backend now always returns templates with campaign relationships
      const res = await authFetch("/api/utm-templates/");
      if (!res.ok) return;

      const allTemplates: any[] = await res.json();
      setUtmTemplates(allTemplates);
    } catch (error) {
      console.error("Failed to load UTM templates:", error);
    } finally {
      setLoadingUtmTemplates(false);
    }
  }, [metadataState.fields.campaignIds.value]);

  // Load when campaign changes
  useEffect(() => {
    loadUtmTemplates();
  }, [loadUtmTemplates, selectedCampaign]);

  // Load templates if draft already has campaign (e.g. editing)
  useEffect(() => {
    if (initialData?.campaign_id) {
      loadUtmTemplates();
    }
  }, []);

  // Set campaign-specific UTM templates when campaign changes
  useEffect(() => {
    if (selectedCampaign) {
      // Extract campaign-specific templates from utmTemplates
      const campaignTemplates = utmTemplates.filter(
        (t) =>
          t.campaigns &&
          t.campaigns.some((c: any) => c.id === selectedCampaign.id),
      );
      setCampaignUtmTemplates(campaignTemplates);
    } else {
      setCampaignUtmTemplates([]);
    }
  }, [selectedCampaign, utmTemplates]);

  // Behavior form state (dates) - Proper initialization for edit mode
  const [startDate, setStartDate] = useState(initialData?.start_datetime || "");
  const [endDate, setEndDate] = useState(initialData?.end_datetime || "");
  const [expiresAt, setExpiresAt] = useState(initialData?.expires_at || "");

  // Target form state
  const [targetState, targetActions] = useFormState({
    targetUrl: initialData?.targets?.[0]?.target_url || "",
    weight: initialData?.targets?.[0]?.weight || 100,
    rules: (() => {
      let rules = initialData?.targets?.[0]?.rules;
      if (typeof rules === "string") {
        try {
          rules = JSON.parse(rules);
        } catch {
          rules = {};
        }
      } else if (!rules || typeof rules !== "object") {
        rules = {};
      }
      return rules;
    })(),
    utmTemplateId: initialData?.targets?.[0]?.utm_template_id || null,
  });

  // Time window override state - manually controlled
  const [timeWindowOverride, setTimeWindowOverride] = useState(() => {
    return initialData?.time_window || {};
  });

  // Calculate TTL expiry for always-on campaigns
  const calculateTtlExpiry = useCallback(() => {
    if (
      selectedCampaign?.lifecycle_attr === 1 &&
      startDate &&
      selectedCampaign?.default_link_ttl_days
    ) {
      const start = new Date(startDate);
      const ttlDays = selectedCampaign.default_link_ttl_days;
      const expiry = new Date(start);
      expiry.setDate(expiry.getDate() + ttlDays);
      return expiry.toISOString();
    }
    return null;
  }, [
    startDate,
    selectedCampaign?.lifecycle_attr,
    selectedCampaign?.default_link_ttl_days,
  ]);

  // Handle campaign selection
  useEffect(() => {
    if (metadataState.fields.campaignIds.value.length > 0) {
      const campaign = campaignState.data?.find(
        (c) => c.id === metadataState.fields.campaignIds.value[0],
      );
      setSelectedCampaign(campaign);
    } else {
      setSelectedCampaign(null);
    }
  }, [metadataState.fields.campaignIds.value, campaignState.data]);

  // Track campaign lifecycle changes for reset behavior (only when not in edit mode)
  const [previousCampaignLifecycle, setPreviousCampaignLifecycle] = useState<
    number | undefined
  >(isEdit ? undefined : undefined); // Don't track in edit mode at all

  // Initialize expiresAt properly from initialData
  useEffect(() => {
    if (initialData?.expires_at) {
      setExpiresAt(initialData.expires_at);
    }
  }, [initialData]);

  // Synchronize expires_at with end_date (unidirectional to avoid infinite loop)
  useEffect(() => {
    if (endDate && endDate !== expiresAt) {
      setExpiresAt(endDate);
    }
  }, [endDate, expiresAt]);

  // Automatic sync: whenever start/end dates change, update time window override
  // For always-on campaigns, sync with calculated TTL expiry
  // For other campaigns, sync with end date
  useEffect(() => {
    const calculatedTtl = calculateTtlExpiry();

    const newTimeWindow = {
      start: startDate || undefined,
      // For always-on campaigns, use calculated TTL expiry as end date
      // For other campaigns, use the manual end date
      end:
        selectedCampaign?.lifecycle_attr === 1
          ? calculatedTtl || undefined
          : endDate || undefined,
    };
    setTimeWindowOverride(newTimeWindow);
  }, [
    startDate,
    endDate,
    selectedCampaign?.lifecycle_attr,
    calculateTtlExpiry,
  ]);

  // Initialize time window override from campaign dates when campaign is selected (only for new links)
  const initializeTimeWindowFromCampaign = useCallback(() => {
    if (
      selectedCampaign &&
      selectedCampaign.campaign_start_date &&
      selectedCampaign.campaign_end_date &&
      !isEdit
    ) {
      setTimeWindowOverride({
        start: selectedCampaign.campaign_start_date,
        // For always-on campaigns, maintain campaign end date in time_window_override
        // TTL expiry calculation is separate and doesn't affect time_window_override
        end: selectedCampaign.campaign_end_date,
      });
    }
  }, [selectedCampaign, isEdit]);

  // Call initialization when campaign changes
  useEffect(() => {
    initializeTimeWindowFromCampaign();
  }, [initializeTimeWindowFromCampaign]);

  // Handle campaign change with lifecycle info
  const handleCampaignChangeWithLifecycle = useCallback(
    (campaignId: number | null, lifecycleAttr?: number) => {
      // Only reset behavior in create mode, never in edit mode
      if (
        !isEdit &&
        previousCampaignLifecycle !== undefined &&
        previousCampaignLifecycle !== lifecycleAttr
      ) {
        // Reset dates based on new campaign type
        if (lifecycleAttr === 1) {
          // Always-on: Clear end date and keep expires_at calculation for TTL
          setEndDate("");
        } else {
          // One-off/Infinite/No campaign: Clear expires_at, use end_date as expiry
          setExpiresAt("");
        }

        // Reset time window override
        setTimeWindowOverride({});

        setPreviousCampaignLifecycle(lifecycleAttr);
      }
    },
    [previousCampaignLifecycle, isEdit],
  );

  // Reset behavior handler for BehaviorForm
  const resetBehavior = useCallback(() => {
    // Only reset in create mode, preserve dates in edit mode
    if (!isEdit) {
      setStartDate("");
      setEndDate("");
      setExpiresAt("");

      // For always-on campaigns, preserve time_window_override with campaign dates
      if (
        selectedCampaign?.lifecycle_attr === 1 &&
        selectedCampaign?.campaign_end_date
      ) {
        setTimeWindowOverride({
          start: selectedCampaign.campaign_start_date,
          end: selectedCampaign.campaign_end_date,
        });
      } else {
        setTimeWindowOverride({});
      }
    }
  }, [isEdit, selectedCampaign]);

  // Validation function
  const validateForm = useCallback((): string[] => {
    const errors: string[] = [];

    // Name validation
    if (!metadataState.fields.name.value.trim()) {
      errors.push("Link name is required");
    }

    // Target URL validation
    if (!targetState.fields.targetUrl.value.trim()) {
      errors.push("Target URL is required");
    } else {
      try {
        new URL(targetState.fields.targetUrl.value);
      } catch {
        errors.push("Invalid URL format");
      }
    }

    // Date validation
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        errors.push("Start date must be before end date");
      }
    }

    return errors;
  }, [
    metadataState.fields.name.value,
    targetState.fields.targetUrl.value,
    startDate,
    endDate,
  ]);

  // Handle campaign creation
  const handleCampaignCreated = useCallback(
    async (campaignData: any) => {
      try {
        // Refresh campaigns list
        await campaignState.execute(async () => {
          const res = await authFetch("/api/campaigns/");
          if (!res.ok) {
            throw new Error("Failed to load campaigns");
          }
          return await res.json();
        });

        // Auto-select the new campaign
        metadataActions.setField("campaignIds", [campaignData.id]);
        campaignModal.close();
        toast.success("Campaign created and selected successfully!");
      } catch (error) {
        console.error("Failed to handle campaign creation:", error);
        toast.error("Failed to refresh campaigns");
      }
    },
    [campaignModal, metadataActions, campaignState],
  );

  // Handle UTM template creation
  const handleUtmTemplateCreated = useCallback(
    async (templateData: any) => {
      try {
        utmTemplateModal.close();
        toast.success("UTM template created successfully!");
      } catch (error) {
        console.error("Failed to handle UTM template creation:", error);
        toast.error("Failed to create UTM template");
      }
    },
    [utmTemplateModal],
  );

  // Prepare API data
  const prepareApiData = useCallback(() => {
    // Calculate expires_at for always-on campaigns
    const calculatedExpiresAt = calculateTtlExpiry() || expiresAt;

    const baseData = {
      name: metadataState.fields.name.value,
      description: metadataState.fields.description.value,
      campaign_id:
        metadataState.fields.campaignIds.value.length > 0
          ? metadataState.fields.campaignIds.value[0]
          : null,
      start_datetime: startDate || null,
      end_datetime: endDate || null,
      expires_at: calculatedExpiresAt || null,
      time_window:
        Object.keys(timeWindowOverride).length > 0 ? timeWindowOverride : null,
      status: "active",
    };

    if (isEdit && linkId) {
      // Update existing link
      return {
        ...baseData,
        targets_to_update: [
          {
            id: initialData?.targets?.[0]?.id,
            target_url: targetState.fields.targetUrl.value,
            weight: targetState.fields.weight.value,
            rules: (() => {
              const rulesWithOverride =
                Object.keys(timeWindowOverride).length > 0
                  ? {
                      ...targetState.fields.rules.value,
                      time_window_override: timeWindowOverride,
                    }
                  : targetState.fields.rules.value;
              return JSON.stringify(rulesWithOverride);
            })(),
            utm_template_id: targetState.fields.utmTemplateId.value,
            group_id:
              metadataState.fields.groupIds.value.length > 0
                ? metadataState.fields.groupIds.value[0]
                : null,
            campaign_id:
              metadataState.fields.campaignIds.value.length > 0
                ? metadataState.fields.campaignIds.value[0]
                : null,
          },
        ],
      };
    } else {
      // Create new link
      return {
        ...baseData,
        link_type: "redirect",
        targets: [
          {
            target_url: targetState.fields.targetUrl.value,
            weight: targetState.fields.weight.value,
            rules: (() => {
              const rulesWithOverride =
                Object.keys(timeWindowOverride).length > 0
                  ? {
                      ...targetState.fields.rules.value,
                      time_window_override: timeWindowOverride,
                    }
                  : targetState.fields.rules.value;
              return JSON.stringify(rulesWithOverride);
            })(),
            utm_template_id: targetState.fields.utmTemplateId.value,
            group_id:
              metadataState.fields.groupIds.value.length > 0
                ? metadataState.fields.groupIds.value[0]
                : null,
          },
        ],
      };
    }
  }, [
    metadataState,
    targetState,
    startDate,
    endDate,
    expiresAt,
    calculateTtlExpiry,
    timeWindowOverride,
    isEdit,
    linkId,
    initialData,
  ]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setSubmitError(validationErrors.join(", "));
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const apiData = prepareApiData();
      const url =
        isEdit && linkId
          ? `/api/workspace/links/${linkId}`
          : "/api/workspace/links";

      const method = isEdit ? "PATCH" : "POST";

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(apiData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to ${isEdit ? "update" : "create"} link`,
        );
      }

      toast.success(`Link ${isEdit ? "updated" : "created"} successfully!`);
      router.push("/links");
    } catch (error) {
      console.error("Failed to save single link:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setSubmitError(errorMessage);
      toast.error("Failed to save link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, prepareApiData, isEdit, linkId, router]);

  // Form validation status
  const isFormValid = validateForm().length === 0;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Edit Single Link" : "Create Single Link"}
        </h1>
        <p className="text-gray-600">
          {isEdit
            ? "Update your single link configuration."
            : "Create a straightforward link that redirects to a single destination."}
        </p>
      </div>

      <form className="space-y-4 sm:space-y-6">
        {/* Link Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Link Information</CardTitle>
          </CardHeader>
          <CardContent>
            <LinkMetadataForm
              name={metadataState.fields.name.value}
              description={metadataState.fields.description.value}
              campaignIds={metadataState.fields.campaignIds.value}
              groupIds={metadataState.fields.groupIds.value}
              campaigns={campaignState.data || []}
              groups={groups}
              loadingCampaigns={campaignState.isLoading}
              loadingGroups={loadingGroups}
              onNameChange={(value) => metadataActions.setField("name", value)}
              onDescriptionChange={(value) =>
                metadataActions.setField("description", value)
              }
              onCampaignChange={(value) =>
                metadataActions.setField("campaignIds", value)
              }
              onGroupChange={(value) =>
                metadataActions.setField("groupIds", value)
              }
              onCreateCampaign={campaignModal.open}
              onCreateGroup={() => {}}
              onCampaignChangeWithLifecycle={handleCampaignChangeWithLifecycle}
            />
            {metadataState.fields.name.touched &&
              metadataState.fields.name.error && (
                <p className="text-sm text-red-600 mt-2">
                  {metadataState.fields.name.error}
                </p>
              )}
          </CardContent>
        </Card>

        {/* Behavior Settings */}
        <BehaviorForm
          startDate={startDate}
          endDate={endDate}
          expiresAt={calculateTtlExpiry() || expiresAt}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onExpiresAtChange={setExpiresAt}
          campaignStartDate={selectedCampaign?.campaign_start_date}
          campaignEndDate={selectedCampaign?.campaign_end_date}
          campaignTtlDays={selectedCampaign?.default_link_ttl_days}
          campaignLifecycle={selectedCampaign?.lifecycle_attr}
          hasCampaign={!!selectedCampaign}
          onResetBehavior={resetBehavior}
        />

        {/* Target Configuration */}
        <TargetForm
          targetUrl={targetState.fields.targetUrl.value}
          weight={targetState.fields.weight.value}
          rules={targetState.fields.rules.value}
          utmTemplateId={targetState.fields.utmTemplateId.value}
          inheritedStartDate={startDate}
          inheritedEndDate={endDate}
          onTargetUrlChange={(value) =>
            targetActions.setField("targetUrl", value)
          }
          onWeightChange={(value) => targetActions.setField("weight", value)}
          onRulesChange={(value) => targetActions.setField("rules", value)}
          onUtmTemplateChange={(value) =>
            targetActions.setField("utmTemplateId", value)
          }
          utmTemplates={utmTemplates}
          campaignUtmTemplates={campaignUtmTemplates}
          loadingUtmTemplates={loadingUtmTemplates}
          onCreateUtmTemplate={utmTemplateModal.open}
          isAlwaysOn={selectedCampaign?.lifecycle_attr === 1}
          showTimeWindow={false}
          inheritedTimeWindow={timeWindowOverride}
          linkStartDate={startDate}
          linkEndDate={endDate}
        />

        {/* Upgrade to Smart Link */}
        {isEdit && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-900">
                  Upgrade to Smart Link
                </h3>
                <p className="text-sm text-blue-700">
                  Convert this single link to a smart link with multiple
                  targets, A/B testing, and advanced targeting.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // TODO: Implement upgrade functionality
                  alert("Upgrade functionality will be implemented");
                }}
              >
                Upgrade
              </Button>
            </div>
          </div>
        )}

        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-900">Error</p>
                <p className="text-red-700">{submitError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSubmitError("")}
                  className="mt-2"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
            className="w-full sm:w-auto"
          >
            {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
            {isSubmitting
              ? isEdit
                ? "Updating..."
                : "Creating..."
              : isEdit
                ? "Update Single Link"
                : "Create Single Link"}
          </Button>
        </div>
      </form>

      {/* Campaign Modal */}
      <CampaignModal
        open={campaignModal.isOpen}
        onOpenChange={(open) =>
          open ? campaignModal.open() : campaignModal.close()
        }
        onSave={handleCampaignCreated}
      />

      {/* UTM Template Modal */}
      <UtmTemplateModal
        open={utmTemplateModal.isOpen}
        onOpenChange={(open) =>
          open ? utmTemplateModal.open() : utmTemplateModal.close()
        }
        onSave={handleUtmTemplateCreated}
        campaigns={campaignState.data || []}
      />
    </div>
  );
}
