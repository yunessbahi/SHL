"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Eye, EyeOff, BadgeCheckIcon } from "lucide-react";
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
import {
  Combobox,
  formatUtmTemplateOptions,
} from "@/components/ui/combobox-default";

interface UTMTemplate {
  id: number;
  name: string;
  description: string;
  utm_params: Record<string, string>;
  is_global?: boolean;
  campaigns?: any[];
}

interface TargetFormProps {
  // Core form values
  targetUrl: string;
  weight: number;
  rules: Record<string, any>;
  utmTemplateId: number | null;
  // Available UTM templates
  utmTemplates?: UTMTemplate[];
  campaignUtmTemplates?: UTMTemplate[];
  loadingUtmTemplates?: boolean;

  // Inherited dates from link behavior
  inheritedStartDate?: string;
  inheritedEndDate?: string;

  // Configuration options
  isAlwaysOn?: boolean;
  showTimeWindow?: boolean;
  inheritedTimeWindow?: { start?: string; end?: string };
  linkStartDate?: string;
  linkEndDate?: string;
  campaignStartDate?: string;
  campaignEndDate?: string;
  showRemove?: boolean;

  // Change handlers
  onTargetUrlChange: (url: string) => void;
  onWeightChange: (weight: number) => void;
  onRulesChange: (rules: Record<string, any>) => void;
  onUtmTemplateChange: (id: number | null) => void;

  onRemove?: () => void;
  onCreateUtmTemplate?: () => void;
}

/**
 * Clean, focused TargetForm component
 * Handles only UI rendering and user interactions
 * All data fetching and template management handled by parent components
 */
export default function TargetForm({
  targetUrl,
  weight,
  rules,
  utmTemplateId,
  utmTemplates = [],
  campaignUtmTemplates = [],
  loadingUtmTemplates = false,

  inheritedStartDate,
  inheritedEndDate,
  isAlwaysOn = false,
  showTimeWindow = true,
  inheritedTimeWindow,
  linkStartDate,
  linkEndDate,
  campaignStartDate,
  campaignEndDate,
  showRemove = false,
  onTargetUrlChange,
  onWeightChange,
  onRulesChange,
  onUtmTemplateChange,

  onRemove,
  onCreateUtmTemplate,
}: TargetFormProps) {
  const [showPreview, setShowPreview] = useState(false);

  // Find current template from either utmTemplates or campaignUtmTemplates
  const selectedTemplate = utmTemplates.find((t) => t.id === utmTemplateId);
  const campaignTemplate = Array.isArray(campaignUtmTemplates)
    ? campaignUtmTemplates.find((t) => t.id === utmTemplateId)
    : null;
  const currentTemplate = selectedTemplate || campaignTemplate;

  // Auto-populate utm_overrides when template changes (overwrite instead of append)
  React.useEffect(() => {
    if (currentTemplate && currentTemplate.utm_params) {
      // Overwrite with template parameters (don't preserve old values)
      onRulesChange({
        ...rules,
        utm_overrides: { ...currentTemplate.utm_params },
      });
    }
  }, [utmTemplateId, currentTemplate?.id]); // Only trigger when template changes, not on every render

  // Wrapper function to handle string/number conversion for UTM template change
  const handleUtmTemplateChange = (value: string | number | null) => {
    onUtmTemplateChange(value ? Number(value) : null);
  };

  // Generate UTM preview
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
            required
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
                onClick={onCreateUtmTemplate}
                disabled={!onCreateUtmTemplate}
              >
                <Plus className="h-3 w-3 mr-1" />
                New Template
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mt-1">
            {loadingUtmTemplates ? (
              <Skeleton className="flex-1 h-10" />
            ) : (
              <Combobox
                options={formatUtmTemplateOptions(
                  utmTemplates,
                  Array.isArray(campaignUtmTemplates)
                    ? campaignUtmTemplates.map((t: UTMTemplate) => t.id)
                    : [],
                  true,
                )}
                value={utmTemplateId?.toString() || ""}
                onValueChange={(value) =>
                  handleUtmTemplateChange(value ? Number(value) : null)
                }
                placeholder="Select UTM template"
                searchPlaceholder="Search templates..."
                allowClear={false}
              />
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
          {currentTemplate && currentTemplate.is_global && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Global template
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
              isAlwaysOn={isAlwaysOn}
              showTimeWindow={showTimeWindow}
              inheritedTimeWindow={inheritedTimeWindow}
              linkStartDate={linkStartDate}
              linkEndDate={linkEndDate}
              campaignStartDate={campaignStartDate}
              campaignEndDate={campaignEndDate}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
