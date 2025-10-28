"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  campaignStartDate?: string;
  campaignEndDate?: string;
  campaignTtlDays?: number;
  campaignLifecycle?: number;
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
  campaignStartDate,
  campaignEndDate,
  campaignTtlDays,
  campaignLifecycle,
}: BehaviorFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Pre-fill dates based on campaign settings
  useEffect(() => {
    if (campaignStartDate && !startDate) {
      onStartDateChange(campaignStartDate);
    }
    if (campaignEndDate && !endDate) {
      onEndDateChange(campaignEndDate);
    }
  }, [
    campaignStartDate,
    campaignEndDate,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
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
            {(campaignTtlDays || campaignStartDate || campaignEndDate) && (
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
                {campaignStartDate && campaignEndDate && (
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
                <CalendarWithTimeInput
                  value={convertStringToDate(startDate)}
                  onChange={(date) =>
                    onStartDateChange(convertDateToString(date))
                  }
                />
                {campaignStartDate && (
                  <p
                    className={`text-xs mt-1 ${isInheritedStartDate ? "text-blue-600" : "text-muted-foreground"}`}
                  >
                    {isInheritedStartDate
                      ? "Inherited from campaign"
                      : `Campaign starts: ${new Date(campaignStartDate).toLocaleString()}`}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="end-date">End Date & Time</Label>
                <CalendarWithTimeInput
                  value={convertStringToDate(endDate)}
                  onChange={(date) =>
                    onEndDateChange(convertDateToString(date))
                  }
                />
                {campaignEndDate && (
                  <p
                    className={`text-xs mt-1 ${isInheritedEndDate ? "text-blue-600" : "text-muted-foreground"}`}
                  >
                    {isInheritedEndDate
                      ? "Inherited from campaign"
                      : `Campaign ends: ${new Date(campaignEndDate).toLocaleString()}`}
                  </p>
                )}
              </div>
            </div>

            {(campaignStartDate || campaignEndDate) && (
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
