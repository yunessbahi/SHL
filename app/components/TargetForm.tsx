"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Trash2, Eye, EyeOff } from "lucide-react";
import DateTimePicker from "./DateTimePicker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import WeightSlider from "./WeightSlider";
import RuleTabs from "./RuleTabs";
import { authFetch } from "@/lib/api";

interface UTMTemplate {
  id: number;
  name: string;
  description: string;
  utm_params: Record<string, string>;
}

interface TargetFormProps {
  targetUrl: string;
  weight: number;
  rules: any;
  utmTemplateId: number | null;
  startDate?: string;
  endDate?: string;
  inheritedStartDate?: string;
  inheritedEndDate?: string;
  onTargetUrlChange: (url: string) => void;
  onWeightChange: (weight: number) => void;
  onRulesChange: (rules: any) => void;
  onUtmTemplateChange: (id: number | null) => void;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  onRemove?: () => void;
  showRemove?: boolean;
  campaignUtmTemplates?: Array<{
    id: number;
    name: string;
    utm_params: Record<string, string>;
  }>;
  onCreateUtmTemplate?: () => void;
}

export default function TargetForm({
  targetUrl,
  weight,
  rules,
  utmTemplateId,
  startDate,
  endDate,
  inheritedStartDate,
  inheritedEndDate,
  onTargetUrlChange,
  onWeightChange,
  onRulesChange,
  onUtmTemplateChange,
  onStartDateChange,
  onEndDateChange,
  onRemove,
  showRemove = false,
  campaignUtmTemplates = [],
  onCreateUtmTemplate,
}: TargetFormProps) {
  const [utmTemplates, setUtmTemplates] = useState<UTMTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    pinned: false,
    utm_params: {
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_term: "",
      utm_content: "",
    },
  });

  // Load UTM templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await authFetch("/api/utm-templates/");
        if (res.ok) setUtmTemplates(await res.json());
      } catch (error) {
        console.error("Failed to load UTM templates:", error);
      } finally {
        setLoadingTemplates(false);
      }
    };
    loadTemplates();
  }, []);

  const createTemplate = async () => {
    try {
      const res = await authFetch("/api/utm-templates/", {
        method: "POST",
        body: JSON.stringify(newTemplate),
      });
      if (res.ok) {
        const template = await res.json();
        setUtmTemplates([template, ...utmTemplates]);
        onUtmTemplateChange(template.id);
        setShowTemplateForm(false);
        setNewTemplate({
          name: "",
          description: "",
          pinned: false,
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

  const selectedTemplate = utmTemplates.find((t) => t.id === utmTemplateId);
  const campaignTemplate = campaignUtmTemplates.find(
    (t) => t.id === utmTemplateId,
  );
  const currentTemplate = selectedTemplate || campaignTemplate;

  // Determine if dates are inherited
  const isInheritedStartDate =
    startDate === inheritedStartDate && inheritedStartDate;
  const isInheritedEndDate = endDate === inheritedEndDate && inheritedEndDate;

  const getUtmPreview = () => {
    if (!currentTemplate) return null;

    const url = new URL(targetUrl || "https://example.com");
    Object.entries(currentTemplate.utm_params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  };

  return (
    <Card className="relative">
      {showRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="absolute top-2 right-2 z-10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      <CardHeader>
        <CardTitle className="text-lg">Target Configuration</CardTitle>
        <CardDescription>
          Configure the destination URL, weight, and targeting rules
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Target URL */}
        <div>
          <Label htmlFor="target-url">Target URL *</Label>
          <Input
            id="target-url"
            type="url"
            value={targetUrl}
            onChange={(e) => onTargetUrlChange(e.target.value)}
            placeholder="https://example.com/destination"
            className="mt-1"
          />
        </div>

        {/* Weight Slider */}
        <div>
          <Label>Weight Distribution</Label>
          <WeightSlider value={weight} onChange={onWeightChange} />
          <p className="text-xs text-muted-foreground mt-1">
            Controls traffic distribution when multiple targets exist
          </p>
        </div>

        {/* UTM Template Selector */}
        <div>
          <div className="flex items-center justify-between">
            <Label>UTM Template</Label>
            <div className="flex gap-2">
              {currentTemplate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onCreateUtmTemplate
                    ? onCreateUtmTemplate()
                    : setShowTemplateForm(true)
                }
              >
                <Plus className="h-3 w-3 mr-1" />
                New Template
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            {loadingTemplates ? (
              <Skeleton className="flex-1 h-10" />
            ) : (
              <select
                value={utmTemplateId || ""}
                onChange={(e) =>
                  onUtmTemplateChange(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              >
                <option value="">No template</option>
                {campaignUtmTemplates.length > 0 && (
                  <optgroup label="Campaign Templates">
                    {campaignUtmTemplates.map((template) => (
                      <option
                        key={`campaign-${template.id}`}
                        value={template.id}
                      >
                        {template.name} (Campaign)
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Global Templates">
                  {utmTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            )}
          </div>

          {/* UTM Preview Section */}
          {showPreview && currentTemplate && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md border">
              <h4 className="text-sm font-medium mb-2">
                UTM Parameters Preview
              </h4>
              <div className="space-y-1">
                {Object.entries(currentTemplate.utm_params).map(
                  ([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="font-mono text-gray-600">{key}:</span>
                      <span
                        className={`font-mono ${value ? "text-green-600" : "text-gray-400"}`}
                      >
                        {value || "Not set"}
                      </span>
                    </div>
                  ),
                )}
              </div>
              {targetUrl && (
                <div className="mt-2 pt-2 border-t">
                  <p className="text-xs text-gray-600 mb-1">Final URL:</p>
                  <p className="text-xs font-mono break-all text-blue-600">
                    {getUtmPreview()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Inheritance Indicator */}
          {campaignTemplate && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Inherited from campaign
              </Badge>
            </div>
          )}
        </div>

        {/* Audience Rules */}
        <div>
          <Label>Audience Rules</Label>
          <div className="mt-2">
            <RuleTabs
              rules={rules}
              setRules={onRulesChange}
              inheritedStartDate={inheritedStartDate}
              inheritedEndDate={inheritedEndDate}
            />
          </div>
        </div>
      </CardContent>

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
    </Card>
  );
}
