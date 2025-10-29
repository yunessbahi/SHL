"use client";

import React, { useState, useEffect, useCallback } from "react";
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

interface SingleLinkFormProps {
  userId: string;
  linkId?: number;
  initialData?: any;
  isEdit?: boolean;
}

export default function SingleLinkForm({
  userId,
  linkId,
  initialData,
  isEdit = false,
}: SingleLinkFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Link metadata
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [campaignId, setCampaignId] = useState<number | null>(
    initialData?.campaign_id || null,
  );
  const [groupId, setGroupId] = useState<number | null>(
    initialData?.group_id || null,
  );

  // Behavior settings
  const [startDate, setStartDate] = useState(initialData?.start_datetime || "");
  const [endDate, setEndDate] = useState(initialData?.end_datetime || "");
  const [expiresAt, setExpiresAt] = useState(initialData?.expires_at || "");

  // Target configuration
  const [targetUrl, setTargetUrl] = useState(
    initialData?.targets?.[0]?.target_url || "",
  );
  const [weight, setWeight] = useState(
    initialData?.targets?.[0]?.weight || 100,
  );
  const [rules, setRules] = useState(initialData?.targets?.[0]?.rules || {});
  const [utmTemplateId, setUtmTemplateId] = useState<number | null>(
    initialData?.targets?.[0]?.utm_template_id || null,
  );
  const [targetStartDate, setTargetStartDate] = useState(
    initialData?.targets?.[0]?.start_datetime || "",
  );
  const [targetEndDate, setTargetEndDate] = useState(
    initialData?.targets?.[0]?.end_datetime || "",
  );

  // Time window for behavior settings
  const [timeWindow, setTimeWindow] = useState<{
    start?: string;
    end?: string;
  }>(initialData?.time_window || {});

  // Modal states
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showUtmTemplateModal, setShowUtmTemplateModal] = useState(false);

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");

  // Campaign data for inheritance
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  // Load campaigns
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const res = await authFetch("/api/campaigns/");
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data);
        }
      } catch (error) {
        console.error("Failed to load campaigns:", error);
      }
    };
    loadCampaigns();
  }, []);

  // Update selected campaign when campaignId changes
  useEffect(() => {
    if (campaignId) {
      const campaign = campaigns.find((c) => c.id === campaignId);
      setSelectedCampaign(campaign);
    } else {
      setSelectedCampaign(null);
    }
  }, [campaignId, campaigns]);

  // Validation functions
  const validateUrl = useCallback((url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const validateDates = useCallback((): boolean => {
    if (!startDate || !endDate) return true; // Optional dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start < end;
  }, [startDate, endDate]);

  const getValidationErrors = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Link name is required";
    }

    // Target URL validation
    if (!targetUrl.trim()) {
      newErrors.targetUrl = "Target URL is required";
    } else if (!validateUrl(targetUrl)) {
      newErrors.targetUrl = "Invalid URL format";
    }

    // Date validation
    if (startDate && endDate && !validateDates()) {
      newErrors.dates = "Start date must be before end date";
    }

    return newErrors;
  }, [name, targetUrl, startDate, endDate, validateUrl, validateDates]);

  const isFormValid = React.useMemo(() => {
    const errors = getValidationErrors();
    return Object.keys(errors).length === 0;
  }, [getValidationErrors]);

  const validateForm = useCallback((): boolean => {
    const newErrors = getValidationErrors();
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [getValidationErrors]);

  // Memoized validation check for render-time usage
  const isValidForRender = React.useMemo(() => {
    const errors = getValidationErrors();
    return Object.keys(errors).length === 0;
  }, [getValidationErrors]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isFormValid) {
        return;
      }

      setLoading(true);
      setSubmitError("");

      try {
        if (isEdit && linkId) {
          // Update existing link
          const updateData: any = {
            name,
            description,
            start_datetime: startDate || null,
            end_datetime: endDate || null,
            expires_at: expiresAt || null,
            campaign_id: campaignId,
            targets_to_update: [
              {
                id: initialData?.targets?.[0]?.id,
                target_url: targetUrl,
                weight: weight,
                rules: rules,
                utm_template_id: utmTemplateId,
                group_id: groupId,
                campaign_id: campaignId,
                start_datetime: targetStartDate || null,
                end_datetime: targetEndDate || null,
              },
            ],
          };

          const res = await authFetch(`/api/workspace/links/${linkId}`, {
            method: "PATCH",
            body: JSON.stringify(updateData),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to update link");
          }

          const updatedLink = await res.json();

          // Update local state with server response to reflect changes immediately
          if (updatedLink.expires_at) {
            setExpiresAt(updatedLink.expires_at);
          }

          toast.success("Link updated successfully!");
          router.push("/links");
        } else {
          // Create new link
          const linkData = {
            name,
            description,
            link_type: "redirect",
            targets: [
              {
                target_url: targetUrl,
                weight: weight,
                rules: rules,
                utm_template_id: utmTemplateId,
                group_id: groupId,
                start_datetime: targetStartDate || null,
                end_datetime: targetEndDate || null,
              },
            ],
            campaign_id: campaignId,
            start_datetime: startDate || null,
            end_datetime: endDate || null,
            expires_at: expiresAt || null,
            status: "active",
          };

          const res = await authFetch("/api/workspace/links", {
            method: "POST",
            body: JSON.stringify(linkData),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(
              errorData.message || "Failed to create single link",
            );
          }

          toast.success("Link created successfully!");
          router.push("/links");
        }
      } catch (error) {
        console.error("Failed to save single link:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setSubmitError(errorMessage);
        toast.error("Failed to save link. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [
      isFormValid,
      isEdit,
      linkId,
      name,
      description,
      startDate,
      endDate,
      initialData,
      targetUrl,
      weight,
      rules,
      utmTemplateId,
      groupId,
      targetStartDate,
      targetEndDate,
      campaignId,
      router,
    ],
  );

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

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Link Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Link Information</CardTitle>
          </CardHeader>
          <CardContent>
            <LinkMetadataForm
              name={name}
              description={description}
              campaignId={campaignId}
              groupId={groupId}
              onNameChange={useCallback(
                (value: string) => {
                  setName(value);
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: "" }));
                  }
                },
                [errors.name],
              )}
              onDescriptionChange={setDescription}
              onCampaignChange={setCampaignId}
              onGroupChange={setGroupId}
              onCreateCampaign={() => setShowCampaignModal(true)}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-2">{errors.name}</p>
            )}
          </CardContent>
        </Card>

        {/* Behavior Settings */}
        <BehaviorForm
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={useCallback(
            (value: string) => {
              setStartDate(value);
              if (errors.dates) {
                setErrors((prev) => ({ ...prev, dates: "" }));
              }
            },
            [errors.dates],
          )}
          onEndDateChange={useCallback(
            (value: string) => {
              setEndDate(value);
              if (errors.dates) {
                setErrors((prev) => ({ ...prev, dates: "" }));
              }
            },
            [errors.dates],
          )}
          expiresAt={expiresAt}
          onExpiresAtChange={setExpiresAt}
          campaignStartDate={selectedCampaign?.campaign_start_date}
          campaignEndDate={selectedCampaign?.campaign_end_date}
          campaignTtlDays={selectedCampaign?.default_link_ttl_days}
          campaignLifecycle={selectedCampaign?.lifecycle_attr}
          hasCampaign={!!selectedCampaign}
          timeWindow={timeWindow}
          onTimeWindowChange={setTimeWindow}
        />
        {errors.dates && (
          <p className="text-sm text-red-600 mt-2">{errors.dates}</p>
        )}

        {/* Target Configuration */}
        <TargetForm
          targetUrl={targetUrl}
          weight={weight}
          rules={rules}
          utmTemplateId={utmTemplateId}
          startDate={targetStartDate}
          endDate={targetEndDate}
          inheritedStartDate={startDate}
          inheritedEndDate={endDate}
          onTargetUrlChange={useCallback(
            (value: string) => {
              setTargetUrl(value);
              if (errors.targetUrl) {
                setErrors((prev) => ({ ...prev, targetUrl: "" }));
              }
            },
            [errors.targetUrl],
          )}
          onWeightChange={setWeight}
          onRulesChange={setRules}
          onUtmTemplateChange={setUtmTemplateId}
          onStartDateChange={setTargetStartDate}
          onEndDateChange={setTargetEndDate}
          campaignUtmTemplates={selectedCampaign?.utm_templates || []}
          onCreateUtmTemplate={() => setShowUtmTemplateModal(true)}
          isAlwaysOn={selectedCampaign?.lifecycle_attr === 1}
          showTimeWindow={false}
          inheritedTimeWindow={timeWindow}
          linkStartDate={startDate}
          linkEndDate={endDate}
          campaignStartDate={selectedCampaign?.campaign_start_date}
          campaignEndDate={selectedCampaign?.campaign_end_date}
          onRestoreInheritedDates={() => {
            setTargetStartDate(selectedCampaign?.campaign_start_date || "");
            setTargetEndDate(selectedCampaign?.campaign_end_date || "");
          }}
        />
        {errors.targetUrl && (
          <p className="text-sm text-red-600 mt-2 ml-4">{errors.targetUrl}</p>
        )}

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
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !isValidForRender}
            className="w-full sm:w-auto"
          >
            {loading && <Spinner className="mr-2 h-4 w-4" />}
            {loading
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
        open={showCampaignModal}
        onOpenChange={setShowCampaignModal}
        onSave={(campaignData) => {
          // Handle campaign creation and selection
          console.log("Campaign created:", campaignData);
          setShowCampaignModal(false);
        }}
      />

      {/* UTM Template Modal */}
      <UtmTemplateModal
        open={showUtmTemplateModal}
        onOpenChange={setShowUtmTemplateModal}
        onSave={async (templateData) => {
          console.log("UTM Template created:", templateData);
          setShowUtmTemplateModal(false);
        }}
        campaigns={campaigns}
      />
    </div>
  );
}
