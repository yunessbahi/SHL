"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
//import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker24h } from "@/components/ui/date-time-picker-24h";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, RotateCcw, Calendar } from "lucide-react";

interface CampaignInfo {
  campaignStartDate?: string;
  campaignEndDate?: string;
  campaignTtlDays?: number;
  campaignLifecycle?: number;
  hasCampaign: boolean;
  isAlwaysOn: boolean;
  isOneOff: boolean;
}

interface BehaviorFormProps {
  // Form values
  startDate: string;
  endDate: string;
  expiresAt: string;

  // Change handlers
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onExpiresAtChange: (date: string) => void;

  // Campaign inheritance info
  campaignStartDate?: string;
  campaignEndDate?: string;
  campaignTtlDays?: number;
  campaignLifecycle?: number;
  hasCampaign?: boolean;

  // Configuration
  isEdit?: boolean;

  // Reset handler for campaign changes
  onResetBehavior?: () => void;
}

const convertStringToDate = (dateString: string): Date | undefined => {
  return dateString ? new Date(dateString) : undefined;
};

const convertDateToString = (date: Date | undefined): string => {
  return date ? date.toISOString() : "";
};

/**
 * Redesigned BehaviorForm with new lifecycle logic:
 * - Always-on: Show "TTL Expiry (Auto-calculated)" from expires_at
 * - One-off/Infinite/No campaign: Show only end date (becomes expiry), no separate expires field
 * - Campaign change: Reset to initial values
 */
export default function BehaviorForm({
  startDate,
  endDate,
  expiresAt,
  onStartDateChange,
  onEndDateChange,
  onExpiresAtChange,
  campaignStartDate,
  campaignEndDate,
  campaignTtlDays,
  campaignLifecycle,
  hasCampaign = false,
  isEdit = false,
  onResetBehavior,
}: BehaviorFormProps) {
  // Reset behavior when campaign changes
  const [previousCampaignLifecycle, setPreviousCampaignLifecycle] =
    useState(campaignLifecycle);

  // Campaign info object
  const campaignInfo: CampaignInfo = {
    campaignStartDate,
    campaignEndDate,
    campaignTtlDays,
    campaignLifecycle,
    hasCampaign,
    isAlwaysOn: campaignLifecycle === 1,
    isOneOff: campaignLifecycle === 2,
  };

  // Handle campaign lifecycle changes
  useEffect(() => {
    if (previousCampaignLifecycle !== campaignLifecycle && onResetBehavior) {
      onResetBehavior();
      setPreviousCampaignLifecycle(campaignLifecycle);
    }
  }, [campaignLifecycle, previousCampaignLifecycle, onResetBehavior]);

  // Direct change handlers that sync with parent components
  const handleStartDateChange = (dateStr: string) => {
    onStartDateChange(dateStr);
  };

  const handleEndDateChange = (dateStr: string) => {
    onEndDateChange(dateStr);
  };

  // Restore handlers for campaign dates
  const restoreStartDate = () => {
    if (campaignStartDate) {
      onStartDateChange(campaignStartDate);
    }
  };

  const restoreEndDate = () => {
    if (campaignEndDate) {
      onEndDateChange(campaignEndDate);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Behavior Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-6">
          {/* Start Date Field - always visible */}
          <div>
            <Label htmlFor="start-date">Start Date & Time</Label>
            <DateTimePicker24h
              value={startDate}
              onChange={handleStartDateChange}
            />

            {/* Guide Label for Start Date */}
            {hasCampaign && campaignStartDate && (
              <div className="flex items-center justify-between mt-2 p-2 bg-blue-50 rounded-md">
                <div className="text-xs text-blue-700">
                  Campaign default:{" "}
                  {new Date(campaignStartDate).toLocaleString()}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={restoreStartDate}
                  className="h-6 px-2 text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Restore
                </Button>
              </div>
            )}
          </div>

          {/* End Date Field - visible for all non-always-on campaigns */}
          {campaignLifecycle !== 1 && (
            <div>
              <Label htmlFor="end-date">
                End Date & Time{" "}
                {campaignLifecycle !== 1 && "(This becomes the expiry)"}
              </Label>
              <DateTimePicker24h
                value={endDate}
                onChange={handleEndDateChange}
              />

              {/* Guide Label for End Date */}
              {hasCampaign && campaignEndDate && (
                <div className="flex items-center justify-between mt-2 p-2 bg-blue-50 rounded-md">
                  <div className="text-xs text-blue-700">
                    Campaign default:{" "}
                    {new Date(campaignEndDate).toLocaleString()}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={restoreEndDate}
                    className="h-6 px-2 text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restore
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TTL Expiry - only for always-on campaigns */}
          {campaignInfo.isAlwaysOn && (
            <div>
              <Label htmlFor="expires-at">TTL Expiry (Auto-calculated)</Label>
              <div className="px-3 py-2 border rounded-md bg-blue-50 text-sm font-mono">
                {expiresAt
                  ? new Date(expiresAt).toLocaleString()
                  : "Calculating..."}
                <Badge variant="outline" className="ml-2 text-xs">
                  Auto
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Automatically calculated from start date + campaign TTL (
                {campaignTtlDays || 30} days)
              </p>
            </div>
          )}

          {/* Information note for one-off and infinite campaigns */}
          {hasCampaign &&
            (campaignLifecycle === 2 || campaignLifecycle === 3) && (
              <div className="text-xs dark:bg-amber-200/5 dark:text-amber-300 bg-amber-400/5 text-amber-700 p-3 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">One-off/Infinite Campaign</span>
                </div>
                <p>
                  For these campaign types, the end date becomes the expiry date
                  automatically.
                </p>
                <p className="mt-1">No separate expiry field is needed.</p>
              </div>
            )}

          {/* Information note for no campaign */}
          {!hasCampaign && (
            <div className="text-xs dark:bg-amber-200/5 dark:text-amber-300 bg-amber-400/5 text-amber-700 p-3 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">No Campaign</span>
              </div>
              <p>
                When no campaign is selected, the end date becomes the expiry
                date automatically.
              </p>
              <p className="mt-1">No separate expiry field is needed.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
