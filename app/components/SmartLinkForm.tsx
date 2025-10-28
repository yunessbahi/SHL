"use client";

import React, { useState, useEffect } from "react";
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

interface Target {
  id: string;
  targetUrl: string;
  weight: number;
  rules: any;
  utmTemplateId: number | null;
  startDate?: string;
  endDate?: string;
}

interface SmartLinkFormProps {
  userId: string;
  linkId?: number;
  initialData?: any;
  isEdit?: boolean;
}

export default function SmartLinkForm({
  userId,
  linkId,
  initialData,
  isEdit = false,
}: SmartLinkFormProps) {
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

  // Targets
  const [targets, setTargets] = useState<Target[]>(
    initialData?.targets?.length > 0
      ? initialData.targets.map((t: any, index: number) => ({
          id: t.id?.toString() || `target-${index}`,
          targetUrl: t.target_url || "",
          weight: t.weight || 50,
          rules: t.rules || {},
          utmTemplateId: t.utm_template_id || null,
          startDate: t.start_datetime || "",
          endDate: t.end_datetime || "",
        }))
      : [
          {
            id: "1",
            targetUrl: "",
            weight: 50,
            rules: {},
            utmTemplateId: null,
            startDate: "",
            endDate: "",
          },
          {
            id: "2",
            targetUrl: "",
            weight: 50,
            rules: {},
            utmTemplateId: null,
            startDate: "",
            endDate: "",
          },
        ],
  );

  // Modal states
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showUtmTemplateModal, setShowUtmTemplateModal] = useState(false);

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [weightWarning, setWeightWarning] = useState<string>("");
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

  const addTarget = () => {
    const newTarget: Target = {
      id: Date.now().toString(),
      targetUrl: "",
      weight: Math.max(10, Math.floor(100 / (targets.length + 1))),
      rules: {},
      utmTemplateId: null,
      startDate: "",
      endDate: "",
    };
    setTargets([...targets, newTarget]);

    // Redistribute weights
    const totalWeight = 100;
    const newWeight = Math.floor(totalWeight / (targets.length + 1));
    const remainder = totalWeight - newWeight * (targets.length + 1);
    const updatedTargets = [...targets, newTarget].map((target, index) => ({
      ...target,
      weight: index === targets.length ? newWeight + remainder : newWeight,
    }));
    setTargets(updatedTargets);
  };

  const removeTarget = async (id: string) => {
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
  };

  const updateTarget = (id: string, updates: Partial<Target>) => {
    setTargets(targets.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    // Clear errors for this target
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`target-${id}`];
      return newErrors;
    });
  };

  // Validation functions
  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateDates = (): boolean => {
    if (!startDate || !endDate) return true; // Optional dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start < end;
  };

  const validateWeights = (): string => {
    const totalWeight = targets.reduce((sum, t) => sum + t.weight, 0);
    if (totalWeight !== 100) {
      return `Total weight is ${totalWeight}%, should be 100%`;
    }
    return "";
  };

  const validateForm = (): {
    isValid: boolean;
    errors: Record<string, string>;
    weightWarning: string;
  } => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Link name is required";
    }

    // Target validation
    targets.forEach((target, index) => {
      if (!target.targetUrl.trim()) {
        newErrors[`target-${target.id}`] = "Target URL is required";
      } else if (!validateUrl(target.targetUrl)) {
        newErrors[`target-${target.id}`] = "Invalid URL format";
      }
    });

    // Date validation
    if (startDate && endDate && !validateDates()) {
      newErrors.dates = "Start date must be before end date";
    }

    const weightWarn = validateWeights();
    const isValid = Object.keys(newErrors).length === 0;

    return { isValid, errors: newErrors, weightWarning: weightWarn };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateForm();
    if (!validation.isValid) {
      setErrors(validation.errors);
      setWeightWarning(validation.weightWarning);
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
        };

        // Separate targets into to_add and to_update
        const targetsToAdd = [];
        const targetsToUpdate = [];

        for (const target of targets) {
          if (isNaN(parseInt(target.id))) {
            // New target (string ID)
            targetsToAdd.push({
              target_url: target.targetUrl,
              weight: target.weight,
              rules: target.rules,
              utm_template_id: target.utmTemplateId,
              start_datetime: target.startDate || null,
              end_datetime: target.endDate || null,
            });
          } else {
            // Existing target (numeric ID)
            targetsToUpdate.push({
              id: parseInt(target.id),
              target_url: target.targetUrl,
              weight: target.weight,
              rules: target.rules,
              utm_template_id: target.utmTemplateId,
              start_datetime: target.startDate || null,
              end_datetime: target.endDate || null,
            });
          }
        }

        if (targetsToAdd.length > 0) {
          updateData.targets_to_add = targetsToAdd;
        }
        if (targetsToUpdate.length > 0) {
          updateData.targets_to_update = targetsToUpdate;
        }

        const res = await authFetch(`/api/workspace/links/${linkId}`, {
          method: "PATCH",
          body: JSON.stringify(updateData),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update link");
        }

        toast.success("Smart link updated successfully!");
        router.push("/links");
      } else {
        // Create new link
        const linkData = {
          name,
          description,
          link_type: "smart",
          targets: targets.map((target) => ({
            target_url: target.targetUrl,
            weight: target.weight,
            rules: target.rules,
            utm_template_id: target.utmTemplateId,
            start_datetime: target.startDate || null,
            end_datetime: target.endDate || null,
          })),
          campaign_id: campaignId,
          start_datetime: startDate || null,
          end_datetime: endDate || null,
          status: "active",
        };

        const res = await authFetch("/api/workspace/links", {
          method: "POST",
          body: JSON.stringify(linkData),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to create smart link");
        }

        toast.success("Smart link created successfully!");
        router.push("/links");
      }
    } catch (error) {
      console.error("Failed to save smart link:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setSubmitError(errorMessage);
      toast.error("Failed to save smart link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
              onNameChange={(value) => {
                setName(value);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: "" }));
                }
              }}
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
          onStartDateChange={(value) => {
            setStartDate(value);
            if (errors.dates) {
              setErrors((prev) => ({ ...prev, dates: "" }));
            }
          }}
          onEndDateChange={(value) => {
            setEndDate(value);
            if (errors.dates) {
              setErrors((prev) => ({ ...prev, dates: "" }));
            }
          }}
          campaignStartDate={selectedCampaign?.campaign_start_date}
          campaignEndDate={selectedCampaign?.campaign_end_date}
          campaignTtlDays={selectedCampaign?.default_link_ttl_days}
          campaignLifecycle={selectedCampaign?.lifecycle_attr}
        />
        {errors.dates && (
          <p className="text-sm text-red-600 mt-2">{errors.dates}</p>
        )}

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
                  startDate={target.startDate}
                  endDate={target.endDate}
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
                  onStartDateChange={(date) =>
                    updateTarget(target.id, { startDate: date })
                  }
                  onEndDateChange={(date) =>
                    updateTarget(target.id, { endDate: date })
                  }
                  onRemove={() => removeTarget(target.id)}
                  showRemove={targets.length > 2}
                  campaignUtmTemplates={selectedCampaign?.utm_templates || []}
                  onCreateUtmTemplate={() => setShowUtmTemplateModal(true)}
                />
                {errors[`target-${target.id}`] && (
                  <p className="text-sm text-red-600 mt-2 ml-4">
                    {errors[`target-${target.id}`]}
                  </p>
                )}
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
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full sm:w-auto"
          >
            {loading && <Spinner className="mr-2 h-4 w-4" />}
            {loading
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
        open={showCampaignModal}
        onOpenChange={setShowCampaignModal}
        onSave={(campaignData) => {
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
