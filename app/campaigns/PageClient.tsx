"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Plus,
  Link,
  X,
  Edit,
  Trash2,
  Info,
  Clock,
  Infinity,
  MoreHorizontal,
  Target,
  Timer,
  Tag as TagIcon,
  TimerReset,
  Clock3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import { UtmTemplateModal } from "@/app/components/UtmTemplateModal";
import CampaignModal from "@/app/components/CampaignModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/multi-select";
import { EmptyState } from "@/components/ui/empty-state";
import { Status } from "@/app/components/ui/badges-var1";

function getUtmParams(obj: any) {
  let utm = obj?.utm_params;
  if (utm && typeof utm === "string") {
    try {
      utm = JSON.parse(utm);
    } catch {
      utm = {};
    }
  }
  return utm || {};
}

interface Campaign {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  templates?: UTMTemplate[];
  template_count?: number;
  status: string;
  lifecycle_attr: number;
  default_link_ttl_days?: number;
  campaign_start_date?: string;
  campaign_end_date?: string;
  tags?: { id: number; tag_name: string; color: string }[];
}

// TagBadge component with proper opacity styling like badges-var1.tsx
function TagBadge({
  tag,
}: {
  tag: { id: number; tag_name: string; color: string };
}) {
  type TagClasses =
    | { bg: string; text: string }
    | { bg: string; text: string; legacy: true; legacyColor: string };

  // Convert color value to appropriate Tailwind classes with opacity
  const getTagClasses = (colorValue: string): TagClasses => {
    // Check if it's a theme-based color (JSON string)
    try {
      const themeColors = JSON.parse(colorValue);
      if (themeColors.light && themeColors.dark) {
        // Check if we're in dark mode
        const isDark = document.documentElement.classList.contains("dark");
        const currentColor = isDark ? themeColors.dark : themeColors.light;

        // Convert color values to opacity classes like badges-var1.tsx
        const colorMap: Record<string, { bg: string; text: string }> = {
          "blue-600": { bg: "bg-blue-600/10", text: "text-blue-600" },
          "blue-400": { bg: "bg-blue-400/10", text: "text-blue-400" },
          "green-600": { bg: "bg-green-600/10", text: "text-green-600" },
          "green-400": { bg: "bg-green-400/10", text: "text-green-400" },
          "purple-600": { bg: "bg-purple-600/10", text: "text-purple-600" },
          "purple-400": { bg: "bg-purple-400/10", text: "text-purple-400" },
          "pink-600": { bg: "bg-pink-600/10", text: "text-pink-600" },
          "pink-400": { bg: "bg-pink-400/10", text: "text-pink-400" },
          "orange-600": { bg: "bg-orange-600/10", text: "text-orange-600" },
          "orange-400": { bg: "bg-orange-400/10", text: "text-orange-400" },
          "red-600": { bg: "bg-red-600/10", text: "text-red-600" },
          "red-400": { bg: "bg-red-400/10", text: "text-red-400" },
          "indigo-600": { bg: "bg-indigo-600/10", text: "text-indigo-600" },
          "indigo-400": { bg: "bg-indigo-400/10", text: "text-indigo-400" },
          "teal-600": { bg: "bg-teal-600/10", text: "text-teal-600" },
          "teal-400": { bg: "bg-teal-400/10", text: "text-teal-400" },
          "cyan-600": { bg: "bg-cyan-600/10", text: "text-cyan-600" },
          "cyan-400": { bg: "bg-cyan-400/10", text: "text-cyan-400" },
          "gray-600": { bg: "bg-gray-600/10", text: "text-gray-600" },
          "gray-400": { bg: "bg-gray-400/10", text: "text-gray-400" },
        };

        return (
          colorMap[currentColor] || {
            bg: "bg-gray-600/10",
            text: "text-gray-600",
          }
        );
      }
    } catch {
      // Not JSON, treat as legacy single color - fallback to old behavior
    }

    // Legacy fallback
    return {
      bg: "",
      text: "",
      legacy: true,
      legacyColor: colorValue,
    };
  };

  const classes = getTagClasses(tag.color);

  if ("legacy" in classes && classes.legacy) {
    // Legacy styling for backward compatibility
    return (
      <Badge
        variant="secondary"
        className="text-xs"
        style={{
          backgroundColor: classes.legacyColor + "20",
          color: classes.legacyColor,
        }}
      >
        {tag.tag_name}
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={`text-xs border-none focus-visible:outline-none ${classes.bg} ${classes.text} [a&]:hover:bg-opacity-20 dark:[a&]:hover:bg-opacity-20`}
    >
      {tag.tag_name}
    </Badge>
  );
}

// DynamicTagsDisplay component that prevents wrapping and adjusts count dynamically
function DynamicTagsDisplay({
  tags,
}: {
  tags: { id: number; tag_name: string; color: string }[];
}) {
  const [visibleCount, setVisibleCount] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateVisibleCount = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      const tagElements = container.querySelectorAll("[data-tag]");
      const plusElement = container.querySelector("[data-plus]");

      let totalWidth = 0;
      let count = 0;

      // Account for +N badge if it exists
      const plusWidth = plusElement
        ? (plusElement as HTMLElement).offsetWidth + 4
        : 0; // 4px gap

      for (let i = 0; i < tagElements.length; i++) {
        const tagWidth = (tagElements[i] as HTMLElement).offsetWidth + 4; // 4px gap
        if (totalWidth + tagWidth + plusWidth > containerWidth && count > 0) {
          break;
        }
        totalWidth += tagWidth;
        count++;
      }

      // Ensure at least 1 tag is shown if we have tags
      setVisibleCount(Math.max(1, Math.min(count, tags.length)));
    };

    // Initial calculation
    const timer = setTimeout(updateVisibleCount, 0);

    // Recalculate on resize
    const resizeObserver = new ResizeObserver(updateVisibleCount);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [tags]);

  const remainingCount = tags.length - visibleCount;

  return (
    <div ref={containerRef} className="flex items-center gap-1 flex-1 min-w-0">
      <div className="flex items-center gap-1 flex-nowrap overflow-hidden">
        {tags.slice(0, visibleCount).map((tag) => (
          <div key={tag.id} data-tag>
            <TagBadge tag={tag} />
          </div>
        ))}
      </div>
      {remainingCount > 0 && (
        <Badge
          variant="secondary"
          className="text-xs px-1.5 py-0.5 flex-shrink-0"
          data-plus
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}

interface UTMTemplate {
  id: number;
  name: string;
  description: string;
  is_global: boolean;
  pinned?: boolean;
  utm_params: any;
  campaigns?: Campaign[];
  created_at?: string;
}

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  default_utm: z.object({
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_term: z.string().optional(),
    utm_content: z.string().optional(),
  }),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

import { SafeUser } from "@/lib/getSafeSession";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CampaignsPageProps {
  user: SafeUser;
}

export default function CampaignsPage({ user }: CampaignsPageProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allTemplates, setAllTemplates] = useState<UTMTemplate[]>([]);
  const [campaignCards, setCampaignCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Helper function to check if a campaign has analytics data
  const hasAnalyticsData = (campaignId: number) => {
    return campaignCards.some((card) => card.id === campaignId);
  };

  // Modal State
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSelected, setAssignSelected] = useState<number[]>([]);
  const [templateDetail, setTemplateDetail] = useState<UTMTemplate | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<UTMTemplate | null>(null);
  const [campaignModalState, setCampaignModalState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    campaign?: Campaign;
  }>({ open: false, mode: "create" });

  // Fetch all campaigns and templates
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const cRes = await authFetch("/api/campaigns/");
      const tRes = await authFetch("/api/utm-templates/");
      const cardsRes = await authFetch("/api/analytics/campaigns/cards");
      if (cRes.ok) setCampaigns(await cRes.json());
      if (tRes.ok) setAllTemplates(await tRes.json());
      if (cardsRes.ok) setCampaignCards(await cardsRes.json());
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Force re-render when theme changes to update tag colors
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => {
      forceUpdate((prev) => prev + 1);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const refreshCampaigns = async () => {
    const cRes = await authFetch("/api/campaigns/");
    if (cRes.ok) setCampaigns(await cRes.json());
    window.dispatchEvent(new CustomEvent("campaignChanged"));
  };

  const openTemplatesModal = async (campaign: Campaign) => {
    setActiveCampaign(campaign);
    setShowTemplatesModal(true);
    const res = await authFetch(`/api/campaigns/${campaign.id}/templates`);
    if (res.ok) {
      const data = await res.json();
      setActiveCampaign((c) => (c ? { ...c, templates: data } : c));
    }
  };

  const handleAssign = async () => {
    if (!activeCampaign || assignSelected.length === 0) return;
    await authFetch(`/api/campaigns/${activeCampaign.id}/templates`, {
      method: "POST",
      body: JSON.stringify({ template_ids: assignSelected }),
    });
    await openTemplatesModal(activeCampaign);
    setShowAssignModal(false);
    setAssignSelected([]);
    window.dispatchEvent(new CustomEvent("campaignChanged"));
  };

  const handleUnlink = async (templateId: number) => {
    if (!activeCampaign) return;
    await authFetch(
      `/api/campaigns/${activeCampaign.id}/templates/${templateId}`,
      { method: "DELETE" },
    );
    await openTemplatesModal(activeCampaign);
    window.dispatchEvent(new CustomEvent("campaignChanged"));
  };

  const handleDeleteCampaign = async (campaignId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this campaign? This will also remove all template assignments.",
      )
    )
      return;
    const response = await authFetch(`/api/campaigns/${campaignId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      await refreshCampaigns();
    }
  };

  const handlePauseCampaign = async (campaignId: number) => {
    const response = await authFetch(`/api/campaigns/${campaignId}/pause`, {
      method: "POST",
    });
    if (response.ok) {
      await refreshCampaigns();
    }
  };

  const handleArchiveCampaign = async (campaignId: number) => {
    const response = await authFetch(`/api/campaigns/${campaignId}/archive`, {
      method: "POST",
    });
    if (response.ok) {
      await refreshCampaigns();
    }
  };

  const handleDuplicateCampaign = async (campaign: Campaign) => {
    const duplicateData = {
      name: `${campaign.name} (Copy)`,
      description: campaign.description,
      default_utm: {
        utm_source: "",
        utm_medium: "",
        utm_campaign: "",
        utm_term: "",
        utm_content: "",
      },
    };
    const response = await authFetch("/api/campaigns/", {
      method: "POST",
      body: JSON.stringify(duplicateData),
    });
    if (response.ok) {
      await refreshCampaigns();
    }
  };

  const availableToAssign =
    (activeCampaign &&
      allTemplates.filter((t) => {
        if (!activeCampaign.templates) return false;
        const already = activeCampaign.templates.some((at) => at.id === t.id);
        //console.log(activeCampaign.templates)
        return !already;
      })) ||
    [];

  // Authentication is now handled by the server component

  if (loading)
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Spinner className="size-6 mx-auto" />
          <p className="text-xs mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );

  const getLifecycleDisplay = (
    lifecycle_attr: number,
    ttl?: number,
    status?: string,
    endDate?: string,
  ) => {
    if (lifecycle_attr === 1) {
      return {
        text: `Always-on TTL: ${ttl || 30}d`,
        icon: <Timer className="h-3 w-3" />,
      };
    } else if (lifecycle_attr === 2) {
      // One-off campaign
      if (endDate && new Date(endDate) < new Date()) {
        return "Expired";
      }
      return "One-off";
    } else if (lifecycle_attr === 3) {
      return {
        text: "Infinite",
        icon: <Infinity className="h-3 w-3" />,
      };
    }
    return "";
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "active";
      case "paused":
        return "warn";
      case "inactive": // archived
        return "default";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {/*<h1 className="text-2xl font-bold">Campaigns</h1>*/}
        <div className={""}></div>
        <Button
          onClick={() => setCampaignModalState({ open: true, mode: "create" })}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Target}
              title="No Campaigns Yet"
              description="Create campaigns to organize your marketing efforts. Campaigns help you track performance, set goals, and manage your links more effectively."
              actionLabel="Add Campaign"
              onAction={() =>
                setCampaignModalState({ open: true, mode: "create" })
              }
            />
          </div>
        ) : (
          campaigns.map((c) => (
            <Card
              key={c.id}
              className={cn(
                "relative hover:scale-105 hover:shadow-lg transition-all duration-200 rounded-lg flex flex-col min-h-[200px]",
              )}
            >
              <div className="absolute inset-0 pointer-events-none [background-size:20px_20px] [background-image:linear-gradient(to_right,#e5e6e4_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"></div>
              <div className="absolute inset-0 pointer-events-none bg-card [mask-image:radial-gradient(ellipse_at_center,transparent_0%,transparent_5%,black_70%)]"></div>
              <div className="relative z-20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {c.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Status
                          variant={
                            getStatusVariant(c.status) as
                              | "active"
                              | "warn"
                              | "default"
                          }
                          label={
                            c.status.charAt(0).toUpperCase() + c.status.slice(1)
                          }
                          className="text-xs rounded-md"
                        />
                        {(() => {
                          const lifecycleInfo = getLifecycleDisplay(
                            c.lifecycle_attr,
                            c.default_link_ttl_days,
                            c.status,
                            c.campaign_end_date,
                          );
                          if (!lifecycleInfo) return null;

                          if (typeof lifecycleInfo === "string") {
                            // Handle "One-off" with custom ClockFading icon
                            if (lifecycleInfo === "One-off") {
                              return (
                                <Badge
                                  variant="outline"
                                  className="text-xs rounded-md border-none focus-visible:outline-none bg-neutral-200/30 text-neutral-500/80 focus-visible:ring-neutral-600/20 dark:bg-neutral-400/10 dark:text-neutral-400/70 dark:focus-visible:ring-neutral-400/40 [a&]:hover:bg-neutral-600/5 dark:[a&]:hover:bg-neutral-400/5"
                                >
                                  <Clock3 className="h-3 w-3" />
                                  <span className="">{lifecycleInfo}</span>
                                </Badge>
                              );
                            }
                            return (
                              <Status
                                variant={
                                  lifecycleInfo === "Expired"
                                    ? "danger"
                                    : "default"
                                }
                                label={lifecycleInfo}
                                className="text-xs rounded-md"
                              />
                            );
                          }
                          console.log("c ", c);

                          // Custom badge with specific icons for lifecycle types
                          const getLifecycleIcon = () => {
                            if (lifecycleInfo.text.includes("Always-on")) {
                              return <TimerReset className="h-3 w-3" />;
                            } else if (
                              lifecycleInfo.text.includes("Infinite")
                            ) {
                              return <Infinity className="h-3 w-3" />;
                            } else if (lifecycleInfo.text === "One-off") {
                              return <Clock3 className="h-3 w-3" />;
                            }
                            return null;
                          };

                          const icon = getLifecycleIcon();

                          return (
                            <Badge
                              variant="outline"
                              className="text-xs rounded-md border-none focus-visible:outline-none bg-neutral-200/30 text-neutral-500/80 focus-visible:ring-neutral-600/20 dark:bg-neutral-400/10 dark:text-neutral-400/70 dark:focus-visible:ring-neutral-400/40 [a&]:hover:bg-neutral-600/5 dark:[a&]:hover:bg-neutral-400/5"
                            >
                              {icon}
                              <span className="">{lifecycleInfo.text}</span>
                            </Badge>
                          );
                        })()}
                      </div>
                      {c.tags && c.tags.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <TagIcon className="h-3 w-3" />
                            <span className="text-xs font-medium">Tags</span>
                          </div>
                          <DynamicTagsDisplay tags={c.tags} />
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="rounded-full"
                          variant={"ghost"}
                          size="icon"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            setCampaignModalState({
                              open: true,
                              mode: "edit",
                              campaign: c,
                            })
                          }
                          disabled={c.status === "inactive"}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Campaign
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicateCampaign(c)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Duplicate Campaign
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handlePauseCampaign(c.id)}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Pause Campaign
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleArchiveCampaign(c.id)}
                        >
                          <Info className="h-4 w-4 mr-2" />
                          Archive Campaign
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteCampaign(c.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Campaign
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {hasAnalyticsData(c.id) ? (
                    // Campaigns with analytics data
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left Column: Metrics */}
                      <div className="space-y-3">
                        {/* Total Clicks */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Total Clicks
                          </span>
                          <span className="text-xs font-mono font-semibold">
                            {(() => {
                              const card = campaignCards.find(
                                (card) => card.id === c.id,
                              );
                              return card ? card.total_clicks : 0;
                            })()}
                          </span>
                        </div>

                        {/* Unique Visitors */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Unique Visitors
                          </span>
                          <span className="text-xs font-mono font-semibold">
                            {(() => {
                              const card = campaignCards.find(
                                (card) => card.id === c.id,
                              );
                              return card ? card.unique_visitors : 0;
                            })()}
                          </span>
                        </div>

                        {/* Start Date */}
                        {c.campaign_start_date && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Start</span>
                            <span className="text-xs font-mono">
                              {new Date(
                                c.campaign_start_date,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {/* End Date */}
                        {c.campaign_end_date && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">End</span>
                            <span
                              className={
                                new Date(c.campaign_end_date) < new Date()
                                  ? "text-red-600 text-xs font-mono"
                                  : "text-xs font-mono"
                              }
                            >
                              {new Date(
                                c.campaign_end_date,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {/* Created At */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Created At
                          </span>
                          <span className="text-xs font-mono">
                            {c.created_at
                              ? new Date(c.created_at).toLocaleDateString()
                              : ""}
                          </span>
                        </div>

                        {/* UTM Template Count */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            UTM Templates:
                          </span>
                          <span className="text-xs font-mono">
                            {c.template_count || 0}
                          </span>
                        </div>

                        {/* Warning for ended campaigns with active links */}
                        {c.campaign_end_date &&
                          new Date(c.campaign_end_date) < new Date() &&
                          c.status === "active" && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800 col-span-2">
                              ⚠️ Campaign has ended but is still active. Links
                              may still be working.
                            </div>
                          )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2 col-span-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openTemplatesModal(c)}
                            className="flex-1"
                          >
                            Manage Templates
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            disabled={c.status === "paused"}
                            title={
                              c.status === "paused"
                                ? "Cannot create links for paused campaigns"
                                : ""
                            }
                            onClick={() =>
                              router.push(`/links?campaign=${c.id}`)
                            }
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Link
                          </Button>
                        </div>
                      </div>

                      {/* Right Column: Mini Bar Chart */}
                      <div className="flex items-center justify-center">
                        {(() => {
                          const card = campaignCards.find(
                            (card) => card.id === c.id,
                          );
                          const timeserie = card?.timeserie || [];
                          if (timeserie.length === 0) {
                            return (
                              <div className="text-center text-muted-foreground text-xs">
                                No data available
                              </div>
                            );
                          }

                          // Prepare data for recharts
                          const chartData = timeserie.map((point: any) => ({
                            date: new Date(
                              point.bucket_start,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            }),
                            clicks: point.clicks,
                            fullDate: new Date(
                              point.bucket_start,
                            ).toLocaleDateString(),
                          }));

                          return (
                            <ResponsiveContainer width="100%" height={120}>
                              <BarChart
                                data={chartData}
                                margin={{
                                  top: 5,
                                  right: 5,
                                  left: 5,
                                  bottom: 5,
                                }}
                              >
                                <XAxis
                                  dataKey="date"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{
                                    fontSize: 10,
                                    fill: "hsl(var(--muted-foreground))",
                                  }}
                                  interval="preserveStartEnd"
                                />
                                <YAxis hide />
                                <Tooltip
                                  content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-background border border-border rounded p-2 shadow-md">
                                          <p className="text-sm font-medium">
                                            {data.fullDate}
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            Clicks:{" "}
                                            <span className="font-mono font-semibold">
                                              {data.clicks}
                                            </span>
                                          </p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Bar
                                  dataKey="clicks"
                                  fill="hsl(var(--primary))"
                                  radius={[2, 2, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    // Other campaigns - existing layout
                    <div className="space-y-3">
                      {/* Campaign Lifecycle and Dates */}
                      <div className="space-y-2">
                        {c.lifecycle_attr === 1 && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground text-xs">
                                Start:
                              </span>
                              <span className="text-muted-foreground/50">
                                --
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground text-xs">
                                End:
                              </span>
                              <span className="text-muted-foreground/50">
                                --
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div>
                          <span className="font-mono mr-1">
                            {c.template_count || 0}
                          </span>
                          {c.template_count && c.template_count > 1
                            ? "UTM Templates"
                            : "UTM Template"}
                        </div>
                        <span className="text-xs font-mono">
                          {c.created_at
                            ? new Date(c.created_at).toLocaleDateString()
                            : ""}
                        </span>
                      </div>

                      {/* Action Buttons - Inline Layout */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTemplatesModal(c)}
                          className="flex-1"
                        >
                          Manage Templates
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          disabled={c.status === "paused"}
                          title={
                            c.status === "paused"
                              ? "Cannot create links for paused campaigns"
                              : ""
                          }
                          onClick={() => router.push(`/links?campaign=${c.id}`)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Link
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Templates Modal */}
      {showTemplatesModal && activeCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="p-8 rounded shadow-lg w-full max-w-2xl relative max-h-[90vh] overflow-y-auto bg-background">
            <button
              className="absolute right-4 top-4"
              onClick={() => {
                setShowTemplatesModal(false);
                setActiveCampaign(null);
                setTemplateDetail(null);
              }}
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold mb-4">
              UTM Templates for {activeCampaign.name}
            </h2>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-semibold text-sm mb-2">
                Available Templates
              </h3>
              <p className="text-sm text-muted-foreground">
                These UTM templates are available for links created in this
                campaign. Global templates are available to all campaigns, while
                campaign-specific templates are only available here.
              </p>
            </div>
            <div className="mb-4 flex gap-2">
              <Button
                variant={showAssignModal ? "default" : "secondary"}
                onClick={() => setShowAssignModal((v) => !v)}
              >
                <Plus className="h-4 w-4 mr-1" />
                {showAssignModal
                  ? "Hide Template Assignment"
                  : "Add Existing Templates"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create New Template
              </Button>
            </div>

            <table className="w-full text-sm mb-4">
              <thead>
                <tr className=" text-left">
                  <th className="p-2">Name</th>
                  <th className="p-2">Global</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(activeCampaign.templates || []).map((t) => (
                  <tr key={t.id} className="border-t">
                    <td
                      className="p-2 font-semibold cursor-pointer hover:text-teal-700"
                      onClick={() => setTemplateDetail(t)}
                    >
                      {t.name}
                    </td>
                    <td className="p-2">
                      {t.is_global ? (
                        <span className="text-teal-800 px-2 py-1 rounded text-xs">
                          Global
                        </span>
                      ) : null}
                    </td>
                    <td className="p-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTemplateDetail(t)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditTemplate(t)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlink(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {activeCampaign.templates &&
                  activeCampaign.templates.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-4 text-center">
                        <span className="text-sm">No templates assigned.</span>
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>

            {showAssignModal && (
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-base">
                    Assign Existing Templates
                  </h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAssignModal(false)}
                  >
                    <X className="h-4 w-4 mr-1" /> Close
                  </Button>
                </div>

                <MultiSelect
                  options={availableToAssign.map((t) => ({
                    label: `${t.name}${t.is_global ? " (Global)" : ""}`,
                    value: String(t.id),
                  }))}
                  defaultValue={assignSelected.map(String)}
                  onValueChange={(vals) => setAssignSelected(vals.map(Number))}
                  placeholder="Choose one or more templates"
                  emptyIndicator="No templates available"
                  maxCount={3}
                />

                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleAssign}
                    disabled={assignSelected.length === 0}
                  >
                    Assign Templates
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Template Detail Modal */}
      {templateDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className=" p-8 rounded shadow-lg w-full max-w-lg relative bg-background">
            <button
              className="absolute right-4 top-4"
              onClick={() => setTemplateDetail(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold mb-2">{templateDetail.name}</h3>
            <div className="mb-2 text-muted-foreground">
              {templateDetail.description}
            </div>
            <div className="flex gap-2 flex-wrap mb-2">
              {templateDetail.is_global && (
                <span className="bg-teal-900 px-2 py-1 rounded text-xs">
                  Global
                </span>
              )}
              {templateDetail.campaigns && templateDetail.campaigns.length
                ? templateDetail.campaigns.map((c) => (
                    <span key={c.id} className="px-2 py-1 rounded text-xs">
                      {c.name}
                    </span>
                  ))
                : null}
            </div>
            <div className="mt-2 mb-2">
              <strong>UTM Params:</strong>
              <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                {Object.entries(getUtmParams(templateDetail))
                  .filter(([key, value]) => value)
                  .map(([key, value]) => (
                    <div key={key} className="bg-muted p-2 rounded">
                      <span className="font-medium">
                        {key.replace("utm_", "")}:
                      </span>
                      <span className="ml-1">{String(value)}</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="mt-4 text-xs text-zinc-500">
              Created{" "}
              {templateDetail.created_at
                ? new Date(templateDetail.created_at).toLocaleString()
                : ""}
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      <UtmTemplateModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        initialValues={{
          campaign_ids: activeCampaign ? [activeCampaign.id] : [],
          is_global: false,
        }}
        onSave={async (values) => {
          await authFetch("/api/utm-templates/", {
            method: "POST",
            body: JSON.stringify(values),
          });
          if (activeCampaign) {
            await openTemplatesModal(activeCampaign);
          }
          setShowCreateModal(false);
        }}
        campaigns={campaigns}
      />

      {/* Edit Template Modal */}

      <UtmTemplateModal
        open={!!editTemplate}
        onOpenChange={(o) => {
          if (!o) setEditTemplate(null);
        }}
        initialValues={
          editTemplate
            ? {
                name: editTemplate.name,
                description: editTemplate.description,
                utm_params: getUtmParams(editTemplate), // Use the getUtmParams helper
                is_global: editTemplate.is_global,
                campaign_ids: editTemplate.campaigns?.map((c) => c.id) || [],
              }
            : undefined
        }
        onSave={async (values) => {
          await authFetch(`/api/utm-templates/${editTemplate!.id}`, {
            method: "PATCH",
            body: JSON.stringify(values),
          });
          await openTemplatesModal(activeCampaign!);
          setEditTemplate(null);
        }}
        campaigns={campaigns}
      />

      {/* Campaign Modal */}
      <CampaignModal
        open={campaignModalState.open}
        onOpenChange={(open) => {
          if (!open) {
            setCampaignModalState({ open: false, mode: "create" });
          }
        }}
        initialData={
          campaignModalState.mode === "edit"
            ? campaignModalState.campaign
            : undefined
        }
        onSave={async (values) => {
          if (
            campaignModalState.mode === "edit" &&
            campaignModalState.campaign
          ) {
            await authFetch(
              `/api/campaigns/${campaignModalState.campaign.id}`,
              {
                method: "PATCH",
                body: JSON.stringify(values),
              },
            );
          } else {
            await authFetch("/api/campaigns/", {
              method: "POST",
              body: JSON.stringify(values),
            });
          }
          await refreshCampaigns();
          setCampaignModalState({ open: false, mode: "create" });
        }}
      />
    </div>
  );
}

// Campaign Form Component with shadcn
function CampaignForm({
  onSave,
  onCancel,
  initialValues,
}: {
  onSave: (values: CampaignFormValues) => void;
  onCancel: () => void;
  initialValues?: Campaign;
}) {
  const defaultValues: CampaignFormValues = {
    name: initialValues?.name || "",
    description: initialValues?.description || "",
    default_utm: {
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_term: "",
      utm_content: "",
    },
  };

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues,
  });

  const { control, handleSubmit, formState } = form;
  const { isSubmitting } = formState;

  const onSubmit = async (values: CampaignFormValues) => {
    await onSave(values);
  };

  const utmKeys = [
    { key: "utm_source" as const, label: "Source" },
    { key: "utm_medium" as const, label: "Medium" },
    { key: "utm_campaign" as const, label: "Campaign" },
    { key: "utm_term" as const, label: "Term" },
    { key: "utm_content" as const, label: "Content" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter campaign name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Enter campaign description"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <label className="text-sm font-medium mb-2 block">
            Default UTM Parameters
          </label>
          <div className="grid grid-cols-2 gap-4">
            {utmKeys.map(({ key, label }) => (
              <FormField
                key={key}
                control={control}
                name={`default_utm.${key}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">{label}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={`Enter ${label.toLowerCase()}`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : initialValues
                ? "Update Campaign"
                : "Create Campaign"}
          </Button>
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
