"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import MultipleSelector, { type Option } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ReactFlowProvider } from "@xyflow/react";
import { Filter, Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import _AnalyticsFiltersFlow from "./AnalyticsFiltersFlow";
import DiagramButton from "./DiagramButton";
import { VerticalFilterButton } from "./FilterTriggerButton";

/* Helper: map flow section ids to your Accordion item values */
const mapFlowSectionToAccordion = (sectionId: string) => {
  // sectionId is what AnalyticsFiltersFlow will pass to onNodeClick
  switch (sectionId) {
    case "period":
      return "time-period";
    case "metrics":
      return "metrics";
    case "dimensions":
      return "dimensions";
    case "context":
    case "context_dimension":
      return "context-filters";
    case "drilldown":
    case "drilldown_dimension":
      return "drilldown-filters";
    default:
      // if it's a dimension key like "campaign" or "device_type"
      // open context or drilldown depending on whether that dim is context-tagged:
      if (
        ["campaign", "link", "group", "tag"].includes(sectionId) ||
        sectionId.startsWith("utm_")
      ) {
        return "context-filters";
      }
      return "drilldown-filters";
  }
};

interface AnalyticsFiltersSheetProps {
  filters: any;
  setFilters: (filters: any) => void;
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  selectedMetrics: Option[];
  setSelectedMetrics: (metrics: Option[]) => void;
  selectedDimensions: Option[];
  setSelectedDimensions: (dimensions: Option[]) => void;
  availableDimensions: Option[];
  filterOptions: Record<string, string[]>;
  exploreData: any;
  TIME_PERIODS: { value: string; label: string }[];
  METRICS: Option[];
  DIMENSIONS: Option[];
}

const TIME_PERIODS = [
  { value: "1d", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "365d", label: "Last Year" },
];

export function AnalyticsFiltersSheet({
  filters,
  setFilters,
  selectedPeriod,
  setSelectedPeriod,
  selectedMetrics,
  setSelectedMetrics,
  selectedDimensions,
  setSelectedDimensions,
  availableDimensions,
  filterOptions,
  exploreData,
}: AnalyticsFiltersSheetProps) {
  const [activeSection, setActiveSection] = useState<string | undefined>(
    undefined,
  );

  return (
    <div className="flex flex-col h-full">
      {/* Diagram Button with Full Screen Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <DiagramButton />
        </DialogTrigger>
        <DialogContent className="h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-none p-0">
          <div className="flex flex-col h-full w-full">
            <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
              <DialogTitle>Analytics Filters Flow - Fullscreen</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Visualize your analytics filters and configuration in fullscreen
              </p>
            </DialogHeader>
            <div className="flex-1 overflow-hidden w-full">
              <div className="w-full h-full p-2">
                <ReactFlowProvider>
                  <_AnalyticsFiltersFlow
                    selectedPeriod={selectedPeriod}
                    selectedMetrics={selectedMetrics}
                    selectedDimensions={selectedDimensions}
                    filters={filters}
                    filterOptions={filterOptions}
                    exploreData={exploreData}
                    /* onNodeClick={(flowSection: string) => {
                    const accordionItem = mapFlowSectionToAccordion(flowSection);
                    setActiveSection((prev: string | undefined) => (prev === accordionItem ? undefined : accordionItem));
                  }} */
                  />
                </ReactFlowProvider>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Original Sheet for Filters */}
      <Sheet>
        <SheetTrigger asChild>
          <VerticalFilterButton />
        </SheetTrigger>
        <SheetContent className="flex flex-col justify-between w-[400px] sm:w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-popover-foreground">
              <Filter className="w-5 h-5" />
              Analytics Configuration
            </SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <Accordion
              type="single"
              collapsible
              className="w-full text-popover-foreground"
            >
              {/* Time Period */}
              <AccordionItem value="time-period">
                <AccordionTrigger className="tracking-tight [&>svg]:hidden text-sm font-medium group data-[state=closed]:hover:opacity-100 data-[state=closed]:opacity-50 uppercase data-[state=closed]:hover:bg-muted data-[state=open]:opacity-100 data-[state=open]:bg-muted px-2">
                  <div className="flex gap-2 items-center">
                    <div className="relative w-4 h-4">
                      <Plus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-100 group-data-[state=open]:opacity-0" />
                      <Minus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-0 group-data-[state=open]:opacity-100" />
                    </div>
                    Time Period
                    <Badge variant="secondary">
                      {selectedPeriod.toUpperCase()}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pt-2">
                  <Select
                    value={selectedPeriod}
                    onValueChange={setSelectedPeriod}
                  >
                    <SelectTrigger className="w-48 text-xs">
                      <div className="flex gap-2 items-center animate-fadeIn text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                        <Label className="w-15 text-left text-xs text-muted-foreground">
                          Period
                        </Label>
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_PERIODS.map((period) => (
                        <SelectItem
                          key={period.value}
                          value={period.value}
                          className="text-xs"
                        >
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </AccordionContent>
              </AccordionItem>

              {/* Metrics Selection */}
              <AccordionItem value="metrics">
                <AccordionTrigger className="tracking-tight [&>svg]:hidden text-sm font-medium group data-[state=closed]:hover:opacity-100 data-[state=closed]:opacity-50 uppercase data-[state=closed]:hover:bg-muted data-[state=open]:opacity-100 data-[state=open]:bg-muted px-2">
                  <div className="flex gap-2 items-center">
                    <div className="relative w-4 h-4">
                      <Plus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-100 group-data-[state=open]:opacity-0" />
                      <Minus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-0 group-data-[state=open]:opacity-100" />
                    </div>
                    Metrics
                    <Badge variant="secondary">{selectedMetrics.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <MultipleSelector
                    value={selectedMetrics}
                    onChange={setSelectedMetrics}
                    defaultOptions={[
                      { value: "clicks", label: "Clicks" },
                      { value: "unique_visitors", label: "Unique Visitors" },
                    ]}
                    placeholder="Select metrics"
                    emptyIndicator={
                      <p className="text-center text-xs text-muted-foreground">
                        No metrics found
                      </p>
                    }
                    className="w-full text-sm focus:border-ring"
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Dimensions Selection */}
              <AccordionItem value="dimensions">
                <AccordionTrigger className="tracking-tight [&>svg]:hidden text-sm font-medium group data-[state=closed]:hover:opacity-100 data-[state=closed]:opacity-50 uppercase data-[state=closed]:hover:bg-muted data-[state=open]:opacity-100 data-[state=open]:bg-muted px-2">
                  <div className="flex gap-2 items-center">
                    <div className="relative w-4 h-4">
                      <Plus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-100 group-data-[state=open]:opacity-0" />
                      <Minus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-0 group-data-[state=open]:opacity-100" />
                    </div>
                    Dimensions
                    <Badge variant="secondary">
                      {selectedDimensions.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <MultipleSelector
                    badgeClassName="text-xs"
                    value={selectedDimensions}
                    onChange={setSelectedDimensions}
                    defaultOptions={availableDimensions}
                    options={availableDimensions}
                    placeholder="Select dimensions"
                    emptyIndicator={
                      <p className="text-center text-xs">No dimensions found</p>
                    }
                    className="w-full text-xs"
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Context Filters */}
              {selectedDimensions.some(
                (d) =>
                  ["campaign", "link", "group", "tag"].includes(d.value) ||
                  d.value.startsWith("utm_") ||
                  ![
                    { value: "device_type", label: "Device" },
                    { value: "browser_name", label: "Browser" },
                    { value: "country", label: "Country" },
                    { value: "region", label: "Region" },
                    { value: "city", label: "City" },
                    { value: "ref_source", label: "Referral Source" },
                    { value: "ref_type", label: "Referral Type" },
                    { value: "campaign", label: "Campaign (CONTEXT)" },
                    { value: "link", label: "Link (CONTEXT)" },
                    { value: "group", label: "Group (CONTEXT)" },
                    { value: "tag", label: "Tag (CONTEXT)" },
                  ].some((baseDim) => baseDim.value === d.value),
              ) && (
                <AccordionItem value="context-filters">
                  <AccordionTrigger className="tracking-tight [&>svg]:hidden text-sm font-medium group data-[state=closed]:hover:opacity-100 data-[state=closed]:opacity-50 uppercase data-[state=closed]:hover:bg-muted data-[state=open]:opacity-100 data-[state=open]:bg-muted px-2">
                    <div className="flex gap-2 items-center">
                      <div className="relative w-4 h-4">
                        <Plus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-100 group-data-[state=open]:opacity-0" />
                        <Minus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-0 group-data-[state=open]:opacity-100" />
                      </div>
                      Context Filters
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 gap-4">
                      {(() => {
                        const orderedFilters = selectedDimensions
                          .filter(
                            (d) =>
                              ["campaign", "link", "group", "tag"].includes(
                                d.value,
                              ) ||
                              d.value.startsWith("utm_") ||
                              ![
                                { value: "device_type", label: "Device" },
                                { value: "browser_name", label: "Browser" },
                                { value: "country", label: "Country" },
                                { value: "region", label: "Region" },
                                { value: "city", label: "City" },
                                {
                                  value: "ref_source",
                                  label: "Referral Source",
                                },
                                { value: "ref_type", label: "Referral Type" },
                                {
                                  value: "campaign",
                                  label: "Campaign (CONTEXT)",
                                },
                                { value: "link", label: "Link (CONTEXT)" },
                                { value: "group", label: "Group (CONTEXT)" },
                                { value: "tag", label: "Tag (CONTEXT)" },
                              ].some((baseDim) => baseDim.value === d.value),
                          )
                          .map((d) => d.value);

                        return orderedFilters.map((dimension) => {
                          if (dimension === "group") {
                            return (
                              <div key="group" className="space-y-2">
                                <Select
                                  value={filters.group || "all"}
                                  onValueChange={(value) =>
                                    setFilters({
                                      ...filters,
                                      group:
                                        value === "all" ? undefined : value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <div className="flex gap-2 items-center animate-fadeIn text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                                      <Label className="w-15 text-left text-xs text-muted-foreground">
                                        Groups
                                      </Label>
                                      <SelectValue
                                        className="text-right "
                                        placeholder="All groups"
                                      />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <Label className="text-xs text-muted-foreground">
                                      Groups
                                    </Label>
                                    <Separator className="mt-2" />
                                    <SelectItem
                                      className="text-left text-xs"
                                      value="all"
                                    >
                                      All groups
                                    </SelectItem>
                                    {filterOptions.group?.map(
                                      (value: string) => (
                                        <SelectItem
                                          key={value}
                                          value={value}
                                          className="text-xs"
                                        >
                                          {value}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          } else if (dimension === "tag") {
                            return (
                              <div key="tag" className="space-y-2">
                                <Select
                                  value={filters.tag || "all"}
                                  onValueChange={(value) =>
                                    setFilters({
                                      ...filters,
                                      tag: value === "all" ? undefined : value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <div className="flex gap-2 items-center animate-fadeIn text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                                      <Label className="w-15 text-left text-xs text-muted-foreground">
                                        Tags
                                      </Label>
                                      <SelectValue
                                        className="text-right "
                                        placeholder="All tags"
                                      />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <Label className="text-xs text-muted-foreground">
                                      Tags
                                    </Label>
                                    <Separator className="mt-2" />
                                    <SelectItem
                                      className="text-left text-xs"
                                      value="all"
                                    >
                                      All tags
                                    </SelectItem>
                                    {filterOptions.tag?.map((value: string) => (
                                      <SelectItem
                                        key={value}
                                        value={value}
                                        className="text-xs"
                                      >
                                        {value}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          } else if (dimension === "campaign") {
                            return (
                              <div key="campaign" className="space-y-2">
                                <Select
                                  value={filters.campaign || "all"}
                                  onValueChange={(value) =>
                                    setFilters({
                                      ...filters,
                                      campaign:
                                        value === "all" ? undefined : value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <div className="flex gap-2 items-center animate-fadeIn text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                                      <Label className="w-15 text-left text-xs text-muted-foreground">
                                        Campaigns
                                      </Label>
                                      <SelectValue
                                        className="text-right "
                                        placeholder="All campaigns"
                                      />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <Label className="text-xs text-muted-foreground">
                                      Campaigns
                                    </Label>
                                    <Separator className="mt-2" />
                                    <SelectItem
                                      className="text-left text-xs"
                                      value="all"
                                    >
                                      All campaigns
                                    </SelectItem>
                                    {filterOptions.campaign?.map(
                                      (value: string) => (
                                        <SelectItem
                                          key={value}
                                          value={value}
                                          className="text-xs"
                                        >
                                          {value}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          } else if (dimension === "link") {
                            return (
                              <div key="link" className="space-y-2">
                                <Select
                                  value={filters.link || "all"}
                                  onValueChange={(value) =>
                                    setFilters({
                                      ...filters,
                                      link: value === "all" ? undefined : value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <div className="flex gap-2 items-center animate-fadeIn text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                                      <Label className="w-15 text-left text-xs text-muted-foreground">
                                        Links
                                      </Label>
                                      <SelectValue
                                        className="text-xs text-foreground"
                                        placeholder="All links"
                                      />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent className="">
                                    <Label className="text-xs text-muted-foreground">
                                      Links
                                    </Label>
                                    <Separator className="mt-2" />
                                    <SelectItem
                                      className="text-muted-foreground text-xs"
                                      value="all"
                                    >
                                      All links
                                    </SelectItem>
                                    {filterOptions.link?.map(
                                      (value: string) => (
                                        <SelectItem
                                          className="font-normal text-xs"
                                          key={value}
                                          value={value}
                                        >
                                          {value}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          } else if (
                            dimension.startsWith("utm_") ||
                            ![
                              { value: "device_type", label: "Device" },
                              { value: "browser_name", label: "Browser" },
                              { value: "country", label: "Country" },
                              { value: "region", label: "Region" },
                              { value: "city", label: "City" },
                              { value: "ref_source", label: "Referral Source" },
                              { value: "ref_type", label: "Referral Type" },
                              {
                                value: "campaign",
                                label: "Campaign (CONTEXT)",
                              },
                              { value: "link", label: "Link (CONTEXT)" },
                              { value: "group", label: "Group (CONTEXT)" },
                              { value: "tag", label: "Tag (CONTEXT)" },
                            ].some((baseDim) => baseDim.value === dimension)
                          ) {
                            const displayName = dimension
                              .replace(/^utm_/, "")
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase());
                            const filterKey = dimension;

                            return (
                              <div key={dimension} className="space-y-2">
                                <Select
                                  value={(filters as any)[filterKey] || "all"}
                                  onValueChange={(value) =>
                                    setFilters({
                                      ...filters,
                                      [filterKey]:
                                        value === "all" ? undefined : value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <div className="flex gap-2 items-center animate-fadeIn text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                                      <Label className="w-15 text-left text-xs text-muted-foreground">
                                        {displayName} (UTM)
                                      </Label>
                                      <SelectValue
                                        className="text-xs text-foreground"
                                        placeholder={`All ${displayName.toLowerCase()}`}
                                      />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <Label className="text-xs text-muted-foreground">
                                      {displayName} (UTM)
                                    </Label>
                                    <Separator className="mt-2" />
                                    <SelectItem className="text-xs" value="all">
                                      All {displayName.toLowerCase()}
                                    </SelectItem>
                                    {filterOptions[dimension]?.map(
                                      (value: string) => (
                                        <SelectItem
                                          key={value}
                                          value={value}
                                          className="text-xs"
                                        >
                                          {value}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          }
                          return null;
                        });
                      })()}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              {/* Advanced Filters */}
              <AccordionItem value="drilldown-filters">
                <AccordionTrigger className="tracking-tight [&>svg]:hidden text-sm font-medium group data-[state=closed]:hover:opacity-100 data-[state=closed]:opacity-50 uppercase data-[state=closed]:hover:bg-muted data-[state=open]:opacity-100 data-[state=open]:bg-muted px-2">
                  <div className="flex gap-2 items-center">
                    <div className="relative w-4 h-4">
                      <Plus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-100 group-data-[state=open]:opacity-0" />
                      <Minus className="absolute inset-0 h-4 w-4 transition-opacity group-data-[state=closed]:opacity-0 group-data-[state=open]:opacity-100" />
                    </div>
                    Drilldown Filters
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 gap-4">
                    {/* Device Type Filter */}
                    {selectedDimensions.some(
                      (d) => d.value === "device_type",
                    ) && (
                      <div className="space-y-2">
                        <Select
                          value={filters.device_type || "all"}
                          onValueChange={(value) =>
                            setFilters({
                              ...filters,
                              device_type: value === "all" ? undefined : value,
                            })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <div className="flex gap-2 items-center animate-fadeIn text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                              <Label className="w-15 text-left text-xs text-muted-foreground">
                                Device Type
                              </Label>
                              <SelectValue
                                className="text-xs text-foreground"
                                placeholder="All devices"
                              />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <Label className="text-xs text-muted-foreground">
                              Device Type
                            </Label>
                            <Separator className="mt-2" />
                            <SelectItem className="text-xs" value="all">
                              All devices
                            </SelectItem>
                            {filterOptions.device_type?.map((device) => (
                              <SelectItem
                                key={device}
                                value={device}
                                className="text-xs"
                              >
                                {device}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {/* Dynamic filters based on selected dimensions */}
                    {selectedDimensions.some(
                      (d) => d.value === "browser_name",
                    ) && (
                      <div className="space-y-2">
                        <Select
                          value={filters.browser_name || "all"}
                          onValueChange={(value) =>
                            setFilters({
                              ...filters,
                              browser_name: value === "all" ? undefined : value,
                            })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <div className="flex gap-2 items-center animate-fadeIn text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                              <Label className="w-15 text-left text-xs text-muted-foreground">
                                Browser
                              </Label>
                              <SelectValue
                                className="text-xs text-foreground"
                                placeholder="All browsers"
                              />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <Label className="text-xs text-muted-foreground">
                              Browser
                            </Label>
                            <Separator className="mt-2" />
                            <SelectItem className="text-xs" value="all">
                              All browsers
                            </SelectItem>
                            {filterOptions.browser_name?.map((browser) => (
                              <SelectItem
                                key={browser}
                                value={browser}
                                className="text-xs"
                              >
                                {browser}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {selectedDimensions.some((d) => d.value === "country") && (
                      <div className="space-y-2">
                        <Select
                          value={filters.country || "all"}
                          onValueChange={(value) =>
                            setFilters({
                              ...filters,
                              country: value === "all" ? undefined : value,
                            })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <div className="flex gap-2 items-center animate-fadeIn text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                              <Label className="w-15 text-left text-xs text-muted-foreground">
                                Country
                              </Label>
                              <SelectValue
                                className="text-xs text-foreground"
                                placeholder="All countries"
                              />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <Label className="text-xs text-muted-foreground">
                              Country
                            </Label>
                            <Separator className="mt-2" />
                            <SelectItem className="text-xs" value="all">
                              All countries
                            </SelectItem>
                            {filterOptions.country?.map((country) => (
                              <SelectItem
                                key={country}
                                value={country}
                                className="text-xs"
                              >
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {selectedDimensions.some((d) => d.value === "region") && (
                      <div className="space-y-2">
                        <Select
                          value={filters.region || "all"}
                          onValueChange={(value) =>
                            setFilters({
                              ...filters,
                              region: value === "all" ? undefined : value,
                            })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <div className="flex gap-2 items-center animate-fadeIn text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                              <Label className="w-15 text-left text-xs text-muted-foreground">
                                Region
                              </Label>
                              <SelectValue
                                className="text-xs text-foreground"
                                placeholder="All regions"
                              />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <Label className="text-xs text-muted-foreground">
                              Region
                            </Label>
                            <Separator className="mt-2" />
                            <SelectItem className="text-xs" value="all">
                              All regions
                            </SelectItem>
                            {filterOptions.region?.map((region) => (
                              <SelectItem
                                key={region}
                                value={region}
                                className="text-xs"
                              >
                                {region}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {selectedDimensions.some((d) => d.value === "city") && (
                      <div className="space-y-2">
                        <Select
                          value={filters.city || "all"}
                          onValueChange={(value) =>
                            setFilters({
                              ...filters,
                              city: value === "all" ? undefined : value,
                            })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <div className="flex gap-2 items-center animate-fadeIn text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                              <Label className="w-15 text-left text-xs text-muted-foreground">
                                City
                              </Label>
                              <SelectValue
                                className="text-xs text-foreground"
                                placeholder="All cities"
                              />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <Label className="text-xs text-muted-foreground">
                              City
                            </Label>
                            <Separator className="mt-2" />
                            <SelectItem className="text-xs" value="all">
                              All cities
                            </SelectItem>
                            {filterOptions.city?.map((city) => (
                              <SelectItem
                                key={city}
                                value={city}
                                className="text-xs"
                              >
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {selectedDimensions.some(
                      (d) => d.value === "ref_source",
                    ) && (
                      <div className="space-y-2">
                        <Select
                          value={filters.ref_source || "all"}
                          onValueChange={(value) =>
                            setFilters({
                              ...filters,
                              ref_source: value === "all" ? undefined : value,
                            })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <div className="flex gap-2 items-center animate-fadeIn text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                              <Label className="w-15 text-left text-xs text-muted-foreground">
                                Referral Source
                              </Label>
                              <SelectValue
                                className="text-xs text-foreground"
                                placeholder="All sources"
                              />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <Label className="text-xs text-muted-foreground">
                              Referral Source
                            </Label>
                            <Separator className="mt-2" />
                            <SelectItem className="text-xs" value="all">
                              All sources
                            </SelectItem>
                            {filterOptions.ref_source?.map((source) => (
                              <SelectItem
                                key={source}
                                value={source}
                                className="text-xs"
                              >
                                {source}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {selectedDimensions.some((d) => d.value === "ref_type") && (
                      <div className="space-y-2">
                        <Select
                          value={filters.ref_type || "all"}
                          onValueChange={(value) =>
                            setFilters({
                              ...filters,
                              ref_type: value === "all" ? undefined : value,
                            })
                          }
                        >
                          <SelectTrigger className="h-8">
                            <div className="flex gap-2 items-center animate-fadeIn text-secondary-foreground hover:bg-background relative inline-flex cursor-default items-center text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-fixed:pr-2">
                              <Label className="w-15 text-left text-xs text-muted-foreground">
                                Referral Type
                              </Label>
                              <SelectValue
                                className="xs text-foreground"
                                placeholder="All types"
                              />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <Label className="text-xs text-muted-foreground">
                              Referral Type
                            </Label>
                            <Separator className="mt-2" />
                            <SelectItem className="text-xs" value="all">
                              All types
                            </SelectItem>
                            {filterOptions.ref_type?.map((type) => (
                              <SelectItem
                                key={type}
                                value={type}
                                className="text-xs"
                              >
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            {/* Clear Filters Button */}
            {(filters.device_type ||
              filters.browser_name ||
              filters.country ||
              filters.region ||
              filters.city ||
              filters.campaign ||
              filters.link ||
              filters.group ||
              filters.tag ||
              filters.ref_source ||
              filters.ref_type) && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({})}
                  className="flex items-center gap-2 w-full"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
