"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, AlertTriangle } from "lucide-react";
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

interface Target {
  id: string;
  targetUrl: string;
  weight: number;
  rules: Record<string, any>;
  utmTemplateId: number | null;
}

interface SmartLinkFormProps {
  userId: string;
  linkId?: number;
  initialData?: any;
  isEdit?: boolean;
}

/**
 * Simplified SmartLinkForm component
 * Removed circular dependencies and auto-sync effects
 * Updated to use Select components for campaign and group dropdowns and new calendar component
 */
export default function SmartLinkForm({
  userId,
  linkId,
  initialData,
  isEdit = false,
}: SmartLinkFormProps) {
  const router = useRouter();

  // Modal states
  const campaignModal = useModalState(false);
  const utmTemplateModal = useModalState(false);

  // Form submission state
  const [submitError, setSubmitError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weightWarning, setWeightWarning] = useState<string>("");

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
    fallbackUrl: initialData?.fallback_url || initialData?.target_url || "", // Use fallback_url or fallback to target_url for backward compatibility
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
      console.log(
        "Loaded templates count:",
        allTemplates.length,
        "Global templates:",
        allTemplates.filter((t) => t.is_global).length,
      );
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
    if (utmTemplates.length > 0) {
      if (selectedCampaign) {
        // Extract campaign-specific templates from utmTemplates
        const campaignTemplates = utmTemplates.filter(
          (t) =>
            t.campaigns &&
            t.campaigns.some((c: any) => c.id === selectedCampaign.id),
        );
        setCampaignUtmTemplates(campaignTemplates);
      } else {
        // No campaign selected - show only global templates
        setCampaignUtmTemplates([]);
      }
    }
  }, [selectedCampaign, utmTemplates]);

  // Behavior form state (dates) - Proper initialization for edit mode
  const [startDate, setStartDate] = useState(initialData?.start_datetime || "");
  const [endDate, setEndDate] = useState(initialData?.end_datetime || "");
  const [expiresAt, setExpiresAt] = useState(initialData?.expires_at || "");

  // Synchronous update function to prevent lag
  const handleEndDateChange = useCallback((newEndDate: string) => {
    setEndDate(newEndDate);
    // Sync expiresAt immediately to prevent lag
    setExpiresAt(newEndDate);
  }, []);

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
  }, [endDate]);

  // Time window override state - manually controlled
  const [timeWindowOverride, setTimeWindowOverride] = useState(() => {
    return initialData?.time_window || {};
  });

  // Target management state
  const [targets, setTargets] = useState<Target[]>(
    initialData?.targets?.length > 0
      ? initialData.targets.map((t: any, index: number) => {
          // Ensure rules is properly parsed as JSON object
          let rules = t.rules;
          if (typeof rules === "string") {
            try {
              rules = JSON.parse(rules);
            } catch {
              rules = {};
            }
          } else if (!rules || typeof rules !== "object") {
            rules = {};
          }

          // Remove time_window_override from rules as it's now stored at link level
          const { time_window_override, ...otherRules } = rules;
          return {
            id: t.id?.toString() || `target-${index}`,
            targetUrl: t.target_url || "",
            weight: t.weight || 50,
            rules: otherRules,
            utmTemplateId: t.utm_template_id || null,
          };
        })
      : [
          {
            id: "1",
            targetUrl: "",
            weight: 50,
            rules: {},
            utmTemplateId: null,
          },
          {
            id: "2",
            targetUrl: "",
            weight: 50,
            rules: {},
            utmTemplateId: null,
          },
        ],
  );

  // Note: Removed nextTargetId - new targets don't need frontend IDs
  // Database will auto-generate primary keys

  // Extract IP addresses and referers from first target rules for form display
  const [ipAddresses, setIpAddresses] = useState(() => {
    if (initialData?.targets?.[0]?.rules) {
      let rules = initialData.targets[0].rules;
      if (typeof rules === "string") {
        try {
          rules = JSON.parse(rules);
        } catch {
          rules = {};
        }
      }
      const ipAllow = rules?.ip_address_allow || [];
      return ipAllow.join(", ");
    }
    return "";
  });

  const [referers, setReferers] = useState(() => {
    if (initialData?.targets?.[0]?.rules) {
      let rules = initialData.targets[0].rules;
      if (typeof rules === "string") {
        try {
          rules = JSON.parse(rules);
        } catch {
          rules = {};
        }
      }
      const refererAllow = rules?.referer_allow || [];
      return refererAllow.join(", ");
    }
    return "";
  });

  // Handle IP addresses changes
  const handleIpAddressesChange = useCallback(
    (newIpAddresses: string) => {
      setIpAddresses(newIpAddresses);
      // Update the first target rules with new IP addresses
      const ipArray = newIpAddresses
        .split(",")
        .map((ip) => ip.trim())
        .filter((ip) => ip.length > 0);
      const updatedTargets = targets.map((target, index) => {
        if (index === 0) {
          // Update only the first target for consistency
          const newRules = {
            ...target.rules,
            ip_address_allow: ipArray,
          };
          return { ...target, rules: newRules };
        }
        return target;
      });
      setTargets(updatedTargets);
    },
    [targets],
  );

  // Handle referers changes
  const handleReferersChange = useCallback(
    (newReferers: string) => {
      setReferers(newReferers);
      // Update the first target rules with new referers
      const refererArray = newReferers
        .split(",")
        .map((ref) => ref.trim())
        .filter((ref) => ref.length > 0);
      const updatedTargets = targets.map((target, index) => {
        if (index === 0) {
          // Update only the first target for consistency
          const newRules = {
            ...target.rules,
            referer_allow: refererArray,
          };
          return { ...target, rules: newRules };
        }
        return target;
      });
      setTargets(updatedTargets);
    },
    [targets],
  );

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

  // Handle always-on campaign changes - simplified (only in create mode)
  useEffect(() => {
    if (!isEdit && selectedCampaign?.lifecycle_attr === 1) {
      // Always-on campaign: set endDate to null and lock it
      setEndDate("");
    }
  }, [selectedCampaign?.lifecycle_attr, isEdit]);

  // Simple sync: expires_at mirrors end_datetime for consistency
  useEffect(() => {
    if (endDate && endDate !== expiresAt) {
      setExpiresAt(endDate);
    }
  }, [endDate]);

  // Initialize time window override from campaign dates when campaign is selected (only for new links)
  const initializeTimeWindowFromCampaign = useCallback(() => {
    if (
      selectedCampaign &&
      selectedCampaign.campaign_start_date &&
      selectedCampaign.campaign_end_date &&
      !initialData
    ) {
      // For one-off campaigns, prefill the start and end date fields
      if (selectedCampaign.lifecycle_attr === 2) {
        setStartDate(selectedCampaign.campaign_start_date);
        setEndDate(selectedCampaign.campaign_end_date);
      }

      setTimeWindowOverride({
        start: selectedCampaign.campaign_start_date,
        // For always-on campaigns, maintain campaign end date in time_window_override
        // TTL expiry calculation is separate and doesn't affect time_window_override
        end: selectedCampaign.campaign_end_date,
      });
    }
  }, [selectedCampaign, initialData]);

  // Call initialization when campaign changes
  useEffect(() => {
    initializeTimeWindowFromCampaign();
  }, [initializeTimeWindowFromCampaign]);

  // Track campaign lifecycle changes for reset behavior (only when not in edit mode)
  const [previousCampaignLifecycle, setPreviousCampaignLifecycle] = useState<
    number | undefined
  >(isEdit ? undefined : undefined); // Don't track in edit mode at all

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

  // Target management functions
  const addTarget = useCallback(() => {
    // New targets don't need any ID - database will auto-generate primary key
    const newTarget: Target = {
      id: "", // Empty ID means new target (database will auto-generate)
      targetUrl: "",
      weight: Math.max(10, Math.floor(100 / (targets.length + 1))),
      rules: {},
      utmTemplateId: null,
    };

    // Redistribute weights
    const totalWeight = 100;
    const newWeight = Math.floor(totalWeight / (targets.length + 1));
    const remainder = totalWeight - newWeight * (targets.length + 1);
    const updatedTargets = [...targets, newTarget].map((target, index) => ({
      ...target,
      weight: index === targets.length ? newWeight + remainder : newWeight,
    }));

    setTargets(updatedTargets);
  }, [targets]);

  const removeTarget = useCallback(
    async (id: string) => {
      if (targets.length <= 2) return; // Minimum 2 targets for smart links

      // If editing and target has numeric ID, delete from backend
      if (isEdit && linkId && !isNaN(parseInt(id))) {
        try {
          const res = await authFetch(`/api/workspace/targets/${id}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to delete target");
          }
        } catch (error) {
          console.error("Failed to delete target:", error);
          toast.error("Failed to delete target. Please try again.");
          return;
        }
      }

      const updatedTargets = targets.filter((t) => t.id !== id);

      // Redistribute weights
      const totalWeight = 100;
      const newWeight = Math.floor(totalWeight / updatedTargets.length);
      const remainder = totalWeight - newWeight * updatedTargets.length;
      const redistributedTargets = updatedTargets.map((target, index) => ({
        ...target,
        weight: index < remainder ? newWeight + 1 : newWeight,
      }));

      setTargets(redistributedTargets);
    },
    [targets, isEdit, linkId],
  );

  const updateTarget = useCallback(
    (id: string, updates: Partial<Target>) => {
      setTargets(targets.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    },
    [targets],
  );

  // Validation functions
  const validateUrl = useCallback((url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const validateWeights = useCallback((): string => {
    const totalWeight = targets.reduce((sum, t) => sum + t.weight, 0);
    if (totalWeight !== 100) {
      return `Total weight is ${totalWeight}%, should be 100%`;
    }
    return "";
  }, [targets]);

  const validateForm = useCallback((): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    // Name validation
    if (!metadataState.fields.name.value.trim()) {
      errors.push("Link name is required");
    }

    // Target validation
    targets.forEach((target, index) => {
      if (!target.targetUrl.trim()) {
        errors.push(`Target ${index + 1}: Target URL is required`);
      } else if (!validateUrl(target.targetUrl)) {
        errors.push(`Target ${index + 1}: Invalid URL format`);
      }
    });

    // Date validation
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        errors.push("Start date must be before end date");
      }
    }

    return { isValid: errors.length === 0, errors };
  }, [
    metadataState.fields.name.value,
    targets,
    startDate,
    endDate,
    validateUrl,
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
      fallback_url: metadataState.fields.fallbackUrl.value, // Add fallback_url to base data
      campaign_id:
        metadataState.fields.campaignIds.value.length > 0
          ? metadataState.fields.campaignIds.value[0]
          : null,
      group_id:
        metadataState.fields.groupIds.value.length > 0
          ? metadataState.fields.groupIds.value[0]
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
      const targetsToAdd = [];
      const targetsToUpdate = [];

      for (const target of targets) {
        const rulesWithOverride =
          Object.keys(timeWindowOverride).length > 0
            ? { ...target.rules, time_window_override: timeWindowOverride }
            : target.rules;

        // Check if this is a new target (empty ID) or existing target (numeric ID)
        if (!target.id || target.id.trim() === "") {
          // New target (no ID - database will auto-generate)
          targetsToAdd.push({
            target_url: target.targetUrl,
            weight: target.weight,
            rules: JSON.stringify(rulesWithOverride),
            utm_template_id: target.utmTemplateId,
            group_id:
              metadataState.fields.groupIds.value.length > 0
                ? metadataState.fields.groupIds.value[0]
                : null,
          });
        } else {
          // Existing target (has numeric ID)
          targetsToUpdate.push({
            id: parseInt(target.id),
            target_url: target.targetUrl,
            weight: target.weight,
            rules: JSON.stringify(rulesWithOverride),
            utm_template_id: target.utmTemplateId,
            group_id:
              metadataState.fields.groupIds.value.length > 0
                ? metadataState.fields.groupIds.value[0]
                : null,
          });
        }
      }

      return {
        ...baseData,
        ...(targetsToAdd.length > 0 && { targets_to_add: targetsToAdd }),
        ...(targetsToUpdate.length > 0 && {
          targets_to_update: targetsToUpdate,
        }),
      };
    } else {
      // Create new link
      return {
        ...baseData,
        link_type: "smart",
        targets: targets.map((target) => {
          const rulesWithOverride =
            Object.keys(timeWindowOverride).length > 0
              ? {
                  ...target.rules,
                  time_window_override: timeWindowOverride,
                }
              : target.rules;
          return {
            target_url: target.targetUrl,
            weight: target.weight,
            rules: JSON.stringify(rulesWithOverride),
            utm_template_id: target.utmTemplateId,
            group_id:
              metadataState.fields.groupIds.value.length > 0
                ? metadataState.fields.groupIds.value[0]
                : null,
          };
        }),
      };
    }
  }, [
    metadataState,
    targets,
    startDate,
    endDate,
    expiresAt,
    calculateTtlExpiry,
    timeWindowOverride,
    isEdit,
    linkId,
  ]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    const validation = validateForm();
    if (!validation.isValid) {
      setSubmitError(validation.errors.join(", "));
      return;
    }

    const weightWarn = validateWeights();
    setWeightWarning(weightWarn);

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
        const errorText = await res.text();

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new Error(
          errorData.message || `Failed to ${isEdit ? "update" : "create"} link`,
        );
      }

      toast.success(
        `Smart link ${isEdit ? "updated" : "created"} successfully!`,
      );
      //router.push("/links");
    } catch (error) {
      console.error("Failed to save smart link:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setSubmitError(errorMessage);
      toast.error("Failed to save smart link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, validateWeights, prepareApiData, isEdit, linkId, router]);

  const validation = validateForm();
  const isFormValid = validation.isValid;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Edit Smart Link" : "Create Smart Link"}
        </h1>
        <p className="text-gray-600">
          {isEdit
            ? "Update your smart link configuration and targets."
            : "Create an advanced link with multiple targets, A/B testing, and audience targeting."}
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
              fallbackUrl={metadataState.fields.fallbackUrl.value}
              campaignIds={metadataState.fields.campaignIds.value}
              groupIds={metadataState.fields.groupIds.value}
              ipAddresses={ipAddresses}
              referers={referers}
              campaigns={campaignState.data || []}
              groups={groups}
              loadingCampaigns={campaignState.isLoading}
              loadingGroups={loadingGroups}
              isEdit={isEdit}
              onNameChange={(value) => metadataActions.setField("name", value)}
              onDescriptionChange={(value) =>
                metadataActions.setField("description", value)
              }
              onFallbackUrlChange={(value) =>
                metadataActions.setField("fallbackUrl", value)
              }
              onCampaignChange={(value) =>
                metadataActions.setField("campaignIds", value)
              }
              onGroupChange={(value) =>
                metadataActions.setField("groupIds", value)
              }
              onIpAddressesChange={handleIpAddressesChange}
              onReferersChange={handleReferersChange}
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
          onEndDateChange={handleEndDateChange}
          onExpiresAtChange={setExpiresAt}
          campaignStartDate={selectedCampaign?.campaign_start_date}
          campaignEndDate={selectedCampaign?.campaign_end_date}
          campaignTtlDays={selectedCampaign?.default_link_ttl_days}
          campaignLifecycle={selectedCampaign?.lifecycle_attr}
          hasCampaign={!!selectedCampaign}
          onResetBehavior={resetBehavior}
        />

        {/* Targets */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              Targets ({targets.length})
            </h2>
            <Button
              type="button"
              variant="outline"
              onClick={addTarget}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Target
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {targets.map((target, index) => (
              <div key={target.id}>
                <TargetForm
                  targetUrl={target.targetUrl}
                  weight={target.weight}
                  rules={target.rules}
                  utmTemplateId={target.utmTemplateId}
                  inheritedStartDate={startDate}
                  inheritedEndDate={endDate}
                  onTargetUrlChange={(url) =>
                    updateTarget(target.id, { targetUrl: url })
                  }
                  onWeightChange={(weight) =>
                    updateTarget(target.id, { weight })
                  }
                  onRulesChange={(rules) => updateTarget(target.id, { rules })}
                  onUtmTemplateChange={(id) =>
                    updateTarget(target.id, { utmTemplateId: id })
                  }
                  onRemove={() => removeTarget(target.id)}
                  showRemove={targets.length > 2}
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
              </div>
            ))}
          </div>
        </div>

        {/* Weight Warning */}
        {weightWarning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900">Weight Warning</p>
                <p className="text-yellow-700">{weightWarning}</p>
              </div>
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
                ? "Update Smart Link"
                : "Create Smart Link"}
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
