"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Edit,
  Trash2,
  Pin,
  Globe,
  MoreHorizontal,
  Hash,
  MousePointer,
  Target,
  Zap,
  CheckCircleIcon,
} from "lucide-react";
import { authFetch } from "@/lib/api";
import { cn, toTitleCase, truncateText } from "@/lib/utils";
import { UtmTemplateModal } from "@/app/components/UtmTemplateModal";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import localFont from "next/font/local";
import {
  Pill,
  PillIcon,
  PillIndicator,
  PillStatus,
} from "@/components/kibo-ui/pill";

interface Campaign {
  id: number;
  name: string;
}

interface UTMTemplate {
  id: number;
  name: string;
  description: string;
  utm_params: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
  is_global: boolean;
  pinned: boolean;
  campaigns: Campaign[];
  created_at: string;
}

export default function UTMTemplatesPage() {
  const [templates, setTemplates] = useState<UTMTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UTMTemplate | null>(null);
  const [modalInitial, setModalInitial] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Check authentication on mount
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login?redirectedFrom=/utm-templates");
        return;
      }
      setAuthLoading(false);
    };
    checkUser();
  }, [router, supabase]);
  // Fetch campaigns for dropdown
  const loadCampaigns = async () => {
    const res = await authFetch("/api/campaigns/");
    if (res.ok) setCampaigns(await res.json());
  };
  const loadTemplates = async () => {
    try {
      const response = await authFetch("/api/utm-templates/");
      if (response.ok) {
        const data = await response.json();
        // Sort templates: pinned first, then by name
        const sortedData = data.sort((a: UTMTemplate, b: UTMTemplate) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return a.name.localeCompare(b.name);
        });
        setTemplates(sortedData);
      }
    } catch (error) {
      console.error("Failed to load UTM templates:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadTemplates();
    loadCampaigns();

    // Listen for campaign changes from other pages
    const handleCampaignChange = () => {
      loadTemplates();
      loadCampaigns();
    };

    window.addEventListener("campaignChanged", handleCampaignChange);
    return () =>
      window.removeEventListener("campaignChanged", handleCampaignChange);
  }, []);
  // Launch create
  const openCreate = () => {
    setModalInitial(undefined);
    setEditing(null);
    setModalOpen(true);
  };
  // Launch edit
  // Launch edit
  const handleEdit = (template: UTMTemplate) => {
    setModalInitial({
      name: template.name,
      description: template.description,
      utm_params: template.utm_params,
      is_global: template.is_global,
      pinned: template.pinned,
      campaign_ids: template.campaigns?.map((c) => c.id) || [],
    });
    setEditing(template);
    setModalOpen(true);
    console.log("template", template);
  };
  // Save logic (create or edit)
  const handleSave = async (values: any) => {
    let url = "/api/utm-templates/";
    let method: "POST" | "PATCH" = "POST";
    if (editing) {
      url = `/api/utm-templates/${editing.id}`;
      method = "PATCH";
    }
    const res = await authFetch(url, { method, body: JSON.stringify(values) });
    if (!res.ok) throw new Error(await res.text());
    await loadTemplates();
    await loadCampaigns(); // Reload campaigns after save
    setEditing(null);
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this UTM template?")) return;
    const response = await authFetch(`/api/utm-templates/${id}`, {
      method: "DELETE",
    });
    if (response.ok) await loadTemplates();
  };
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner className="size-6 mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="">
          {/*<h1 className="croll-m-20 text-4xl font-extrabold tracking-tight text-balance">
            UTM Templates
          </h1>

          <p className="text-muted-foreground">
            Create reusable UTM parameter sets for consistent tracking.
          </p>*/}
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>
      <UtmTemplateModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialValues={modalInitial}
        onSave={handleSave}
        campaigns={campaigns}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              No UTM templates created yet.
            </p>
            <Button onClick={openCreate} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </div>
        ) : (
          templates.map((template) => {
            let utmParams = template.utm_params;
            if (utmParams && typeof utmParams === "string") {
              try {
                utmParams = JSON.parse(utmParams);
              } catch {
                utmParams = {};
              }
            }
            utmParams = utmParams || {};

            return (
              <Card
                key={template.id}
                className="relative rounded-3xl flex flex-col h-80"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {template.pinned && (
                        <Pill className={"px-1.5"}>
                          <PillIcon className="size-3.5" icon={Pin} />
                          {/*Pinned*/}
                        </Pill>
                      )}
                      <Pill>
                        <PillIndicator pulse variant="success" />
                        Active
                      </Pill>

                      {template.is_global && (
                        /*<Badge
                                                                          variant="secondary"
                                                                          className="bg-blue-100 text-blue-700 hover:bg-blue-100"
                                                                        >
                                                                          <Globe className="w-3 h-3 mr-1" />
                                                                          Global
                                                                        </Badge>*/
                        <Pill>
                          <PillStatus>
                            <CheckCircleIcon
                              className="text-emerald-500"
                              size={12}
                            />
                          </PillStatus>
                          Global
                        </Pill>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(template)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(template.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-lg pt-2">
                    {template.name}
                  </CardTitle>
                  {template.description && (
                    <CardDescription>
                      {truncateText(template.description, 80)}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1 flex flex-col space-y-4 min-h-0 overflow-hidden">
                  {/* User Avatar and Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="" alt="User" />
                        <AvatarFallback className="text-xs">
                          {template.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">Youness</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Created{" "}
                      <span className="font-mono">
                        {new Date(template.created_at).toLocaleDateString()}
                      </span>
                    </span>
                  </div>

                  {/* UTM Parameters with Horizontal Scroll */}
                  <div className="flex-1">
                    <h4 className="text-xs text-muted-foreground font-medium mb-2">
                      UTM Parameters
                    </h4>
                    <ScrollArea className="flex-1 w-full whitespace-nowrap min-h-0 relative">
                      <div className="flex w-max space-x-2 p-0">
                        {Object.entries(utmParams)
                          .filter(([_, v]) => v && typeof v === "string")
                          .map(([key, value]) => {
                            const Icon = Hash;
                            return (
                              <Badge
                                key={key}
                                variant="secondary"
                                className="flex font-mono font-light items-center gap-1 shrink-0"
                              >
                                <Icon className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs">
                                  <span className="text-muted-foreground">
                                    {toTitleCase(key.replace("utm_", ""))}:{" "}
                                  </span>
                                  {toTitleCase(value)}
                                </span>
                              </Badge>
                            );
                          })}
                      </div>
                      {/* Right fade gradient */}
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
                      <ScrollBar
                        orientation="horizontal"
                        className="invisible"
                      />
                    </ScrollArea>
                  </div>
                </CardContent>
                <Separator />
                {/* Card Footer */}
                <CardFooter className="flex items-center justify-between pt-3">
                  {/* Campaigns Count with Hover Card */}

                  <span className="text-xs">Assigned Campaigns</span>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Badge
                          className={
                            "h-5 min-w-6 font-light font-mono rounded-full px-1 tabular-nums cursor-pointer hover:bg-accent"
                          }
                          variant="secondary"
                        >
                          {template.campaigns?.length || 0}+
                        </Badge>
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">
                          Assigned Campaigns
                        </h4>
                        {template.campaigns && template.campaigns.length > 0 ? (
                          <div className="space-y-1">
                            {template.campaigns.map((campaign) => (
                              <div key={campaign.id} className="text-sm">
                                {campaign.name}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No campaigns assigned
                          </p>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
