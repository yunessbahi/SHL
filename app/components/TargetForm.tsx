"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
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

interface UTMTemplate {
  id: number;
  name: string;
  description: string;
  utm_params: Record<string, string>;
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

  // Optional target-specific dates
  startDate?: string;
  endDate?: string;
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
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
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
  startDate,
  endDate,
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
  onStartDateChange,
  onEndDateChange,
  onRemove,
  onCreateUtmTemplate,
}: TargetFormProps) {
  const [showPreview, setShowPreview] = useState(false);

  // Find current template
  const selectedTemplate = utmTemplates.find((t) => t.id === utmTemplateId);
  const campaignTemplate = campaignUtmTemplates?.find(
    (t) => t.id === utmTemplateId,
  );
  const currentTemplate = selectedTemplate || campaignTemplate;

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
                {campaignUtmTemplates && campaignUtmTemplates.length > 0 && (
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

        {/* Target-specific date overrides (optional) */}
        {(startDate !== undefined || endDate !== undefined) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {startDate !== undefined && (
              <div>
                <Label htmlFor="target-start-date">Start Date (Override)</Label>
                <Input
                  id="target-start-date"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => onStartDateChange?.(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
            {endDate !== undefined && (
              <div>
                <Label htmlFor="target-end-date">End Date (Override)</Label>
                <Input
                  id="target-end-date"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => onEndDateChange?.(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </div>
        )}

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
