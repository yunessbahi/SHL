"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarWithTimeInput } from "@/components/ui/calendar-with-time-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Calendar, Clock, Info, ChevronDown, ChevronUp } from "lucide-react";

interface BehaviorFormProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  expiresAt: string;
  onExpiresAtChange: (date: string) => void;
  campaignStartDate?: string;
  campaignEndDate?: string;
  campaignTtlDays?: number;
  campaignLifecycle?: number;
  hasCampaign?: boolean;
  timeWindow?: { start?: string; end?: string };
  onTimeWindowChange?: (timeWindow: { start?: string; end?: string }) => void;
}

const convertStringToDate = (dateString: string): Date | undefined => {
  return dateString ? new Date(dateString) : undefined;
};

const convertDateToString = (date: Date | undefined): string => {
  return date ? date.toISOString() : "";
};

export default function BehaviorForm({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  expiresAt,
  onExpiresAtChange,
  campaignStartDate,
  campaignEndDate,
  campaignTtlDays,
  campaignLifecycle,
  hasCampaign = false,
  timeWindow,
  onTimeWindowChange,
}: BehaviorFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFixedStartDate, setIsFixedStartDate] = useState(false);
  const [liveStartDate, setLiveStartDate] = useState(new Date());

  // Track previous campaign dates to detect changes
  const prevCampaignStartDate = useRef<string | undefined>();
  const prevCampaignEndDate = useRef<string | undefined>();

  // Handle time_window changes
  const handleTimeWindowChange = (key: "start" | "end", value: string) => {
    if (onTimeWindowChange) {
      const newTimeWindow = { ...timeWindow, [key]: value };
      onTimeWindowChange(newTimeWindow);
    }
  };

  // Live clock effect for always-on campaigns
  useEffect(() => {
    if (campaignLifecycle === 1 && !isFixedStartDate) {
      const interval = setInterval(() => {
        setLiveStartDate(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [campaignLifecycle, isFixedStartDate]);

  // Pre-fill dates based on campaign settings
  useEffect(() => {
    // Check if campaign dates have changed (campaign switched)
    const campaignStartChanged =
      prevCampaignStartDate.current !== campaignStartDate;
    const campaignEndChanged = prevCampaignEndDate.current !== campaignEndDate;

    // For always-on campaigns, calculate dates based on TTL instead of inheriting campaign dates
    if (campaignLifecycle === 1 && campaignTtlDays) {
      const now = new Date();
      const ttlEndDate = new Date(
        now.getTime() + campaignTtlDays * 24 * 60 * 60 * 1000,
      );
      if (!isFixedStartDate) {
        onStartDateChange(convertDateToString(now));
      }
      onEndDateChange(convertDateToString(ttlEndDate));
    } else {
      // For one-off campaigns, inherit campaign dates
      if (
        campaignStartDate &&
        (campaignStartChanged ||
          !startDate ||
          startDate === prevCampaignStartDate.current)
      ) {
        onStartDateChange(campaignStartDate);
      }
      if (
        campaignEndDate &&
        (campaignEndChanged ||
          !endDate ||
          endDate === prevCampaignEndDate.current)
      ) {
        onEndDateChange(campaignEndDate);
      }
    }

    // Update refs for next comparison
    prevCampaignStartDate.current = campaignStartDate;
    prevCampaignEndDate.current = campaignEndDate;
  }, [
    campaignStartDate,
    campaignEndDate,
    campaignLifecycle,
    campaignTtlDays,
    isFixedStartDate,
  ]);

  const isInheritedStartDate =
    startDate === campaignStartDate && campaignStartDate;
  const isInheritedEndDate = endDate === campaignEndDate && campaignEndDate;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Behavior Settings
                <Badge variant="outline" className="text-xs">
                  Advanced
                </Badge>
              </CardTitle>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Campaign Inheritance Badges */}
            {(campaignTtlDays ||
              (campaignStartDate &&
                campaignEndDate &&
                campaignLifecycle !== 1)) && (
              <div className="flex flex-wrap gap-2">
                {campaignTtlDays && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Info className="h-3 w-3" />
                    {campaignTtlDays}-day link TTL
                  </Badge>
                )}
                {campaignStartDate &&
                  campaignEndDate &&
                  campaignLifecycle !== 1 && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Calendar className="h-3 w-3" />
                      Campaign runs{" "}
                      {new Date(campaignStartDate).toLocaleDateString()} -{" "}
                      {new Date(campaignEndDate).toLocaleDateString()}
                    </Badge>
                  )}
                {campaignLifecycle === 1 && campaignTtlDays && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    Always-on campaign
                  </Badge>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date & Time</Label>
                {campaignLifecycle === 1 ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fixed-start-date"
                        checked={isFixedStartDate}
                        onCheckedChange={(checked) =>
                          setIsFixedStartDate(checked as boolean)
                        }
                      />
                      <Label htmlFor="fixed-start-date" className="text-sm">
                        Fix start date/time
                      </Label>
                    </div>
                    {isFixedStartDate ? (
                      <CalendarWithTimeInput
                        value={convertStringToDate(startDate)}
                        onChange={(date) =>
                          onStartDateChange(convertDateToString(date))
                        }
                      />
                    ) : (
                      <div className="px-3 py-2 border rounded-md bg-gray-50 text-sm font-mono">
                        {liveStartDate.toLocaleString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <CalendarWithTimeInput
                    value={convertStringToDate(startDate)}
                    onChange={(date) =>
                      onStartDateChange(convertDateToString(date))
                    }
                  />
                )}
                {campaignStartDate && campaignLifecycle !== 1 && (
                  <p
                    className={`text-xs mt-1 ${isInheritedStartDate ? "text-blue-600" : "text-muted-foreground"}`}
                  >
                    {isInheritedStartDate
                      ? "Inherited from campaign"
                      : `Campaign starts: ${new Date(campaignStartDate).toLocaleString()}`}
                  </p>
                )}
              </div>

              {campaignLifecycle !== 1 && (
                <div>
                  <Label htmlFor="end-date">End Date & Time</Label>
                  <CalendarWithTimeInput
                    value={convertStringToDate(endDate)}
                    onChange={(date) =>
                      onEndDateChange(convertDateToString(date))
                    }
                  />
                  {campaignEndDate && campaignLifecycle !== 1 && (
                    <p
                      className={`text-xs mt-1 ${isInheritedEndDate ? "text-blue-600" : "text-muted-foreground"}`}
                    >
                      {isInheritedEndDate
                        ? "Inherited from campaign"
                        : `Campaign ends: ${new Date(campaignEndDate).toLocaleString()}`}
                    </p>
                  )}
                </div>
              )}

              {!hasCampaign && (
                <div>
                  <Label htmlFor="expires-at">Expires At</Label>
                  <CalendarWithTimeInput
                    value={convertStringToDate(expiresAt)}
                    onChange={(date) =>
                      onExpiresAtChange(convertDateToString(date))
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Set when this link should expire (optional)
                  </p>
                </div>
              )}
            </div>

            {(campaignStartDate || campaignEndDate) &&
              campaignLifecycle !== 1 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">
                        Campaign Inheritance
                      </p>
                      <p className="text-blue-700">
                        This link will inherit behavior settings from its
                        associated campaign. The campaign's start/end dates will
                        override these settings when active. You can override
                        these values manually if needed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
