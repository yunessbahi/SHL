"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AlertIcon, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, BadgeDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataGrid, DataGridContainer } from "@/components/ui/data-grid";
import { DataGridColumnHeader } from "@/components/ui/data-grid-column-header";
import { DataGridPagination } from "@/components/ui/data-grid-pagination";
import { DataGridTable } from "@/components/ui/data-grid-table";
import {
  createFilter,
  Filters,
  type Filter,
  type FilterFieldConfig,
} from "@/components/ui/filters";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useGroups } from "@/lib/hooks/useGroups";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
// Removed old custom Progress component - now using ProgressTTL from '@/components/ui/progress-ttl'

// Device icons mapping
const DeviceIcon = ({ device }: { device: string }) => {
  switch (device.toLowerCase()) {
    case "mobile":
      return <div className="text-blue-500 text-sm">📱</div>;
    case "desktop":
      return <div className="text-gray-600 text-sm">🖥️</div>;
    default:
      return <div className="text-gray-400 text-sm">📱</div>;
  }
};

// Country flag mapping
const CountryFlag = ({ country }: { country: string }) => {
  const flagMap: { [key: string]: string } = {
    US: "🇺🇸",
    GB: "🇬🇧",
    CA: "🇨🇦",
    FR: "🇫🇷",
    DE: "🇩🇪",
    JP: "🇯🇵",
    AU: "🇦🇺",
    BR: "🇧🇷",
    IN: "🇮🇳",
    CN: "🇨🇳",
    ES: "🇪🇸",
    IT: "🇮🇹",
    NL: "🇳🇱",
    SE: "🇸🇪",
    NO: "🇳🇴",
  };
  return <span className="text-sm">{flagMap[country] || "🌍"}</span>;
};

// Copy to clipboard function
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard!");
};

import {
  BarChart3,
  Calendar,
  CircleAlert,
  Clock,
  Edit,
  ExternalLink,
  X,
  Globe,
  Hash,
  List,
  Pause,
  Play,
  Archive,
  Type,
  CalendarDays,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  PauseCircle,
  Archive as ArchiveIcon,
  User,
  AlertTriangle,
  XCircle as FunnelX,
  ChevronUp,
  ChevronDown,
  Copy,
  Timer,
  Target,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Helper function to fetch detailed link data with targets
const fetchDetailedLinkData = async (linkId: string): Promise<any> => {
  try {
    const res = await authFetch(`/api/workspace/links/${linkId}`);
    if (res.ok) {
      return await res.json();
    }
    console.error(`Failed to fetch link details for ID ${linkId}:`, res.status);
    return null;
  } catch (error) {
    console.error(`Error fetching link details for ID ${linkId}:`, error);
    return null;
  }
};

// Lookup functions for ID to name conversion - FIXED: No prefix fallbacks
const getGroupName = (groups: any[], id: number | null | undefined): string => {
  // Handle null/undefined/0 ID cases
  if (!id || id === 0) {
    return "No Group";
  }

  const group = groups?.find((g) => g.id === id);
  return group?.name || "No Group";
};

const getUtmTemplateName = (
  utmTemplates: any[],
  id: number | null | undefined,
): string => {
  // Handle null/undefined/0 ID cases
  if (!id || id === 0) {
    return "No Template";
  }

  const template = utmTemplates?.find((t) => t.id === id);
  return template?.name || "No Template";
};

// Transform workspace API data to match Target interface
const transformTargets = (
  workspaceTargets: any[],
  utmTemplates: any[] = [],
): Target[] => {
  console.log("🔍 UTM Templates loaded:", utmTemplates.length);
  console.log("🔍 Workspace targets:", workspaceTargets);

  return workspaceTargets.map((target) => {
    // Use template_name from backend API if available, otherwise lookup by ID
    let utmTemplateName = "No Template";

    // First try to use template_name from backend (if available from database joins)
    if (target.template_name) {
      utmTemplateName = target.template_name;
    }
    // Fallback: look up template name by ID using loaded utmTemplates
    else if (target.utm_template_id) {
      console.log("🔍 Looking up template ID:", target.utm_template_id);
      console.log("🔍 Available templates:", utmTemplates);

      // Handle different data types (string vs number) and ensure proper comparison
      const templateId =
        typeof target.utm_template_id === "string"
          ? parseInt(target.utm_template_id, 10)
          : target.utm_template_id;

      if (!isNaN(templateId) && utmTemplates && utmTemplates.length > 0) {
        const template = utmTemplates.find((t) => {
          const utmTemplateId =
            typeof t.id === "string" ? parseInt(t.id, 10) : t.id;
          return utmTemplateId === templateId;
        });

        if (template && template.name) {
          utmTemplateName = template.name;
          console.log("✅ Found template:", template.name);
        } else {
          console.log("❌ Template not found for ID:", templateId);
        }
      }
    }

    console.log("🎯 Final template name:", utmTemplateName);

    const transformed = {
      id: target.id.toString(),
      url: target.target_url,
      weight: target.weight || 1,
      allowed_countries: target.rules?.country_allow || [],
      allowed_devices: target.rules?.device_allow || ["mobile", "desktop"],
      utm_template: utmTemplateName,
      status: target.status || "active",
      // CRITICAL: Preserve UTM overrides data
      utm_overrides: target.rules?.utm_overrides || {},
    };

    return transformed;
  });
};

// Transform workspace API data to match LinkRules interface
const transformRules = (workspaceLinkData: any): LinkRules | undefined => {
  if (!workspaceLinkData.targets || workspaceLinkData.targets.length === 0) {
    return undefined;
  }

  // Get rules from the first target (shared across targets)
  const firstTarget = workspaceLinkData.targets[0];
  const rules = firstTarget.rules || {};

  return {
    ip_addresses: rules.ip_address_allow,
    referer_domains: rules.referer_allow,
    device_types: rules.device_allow,
    countries: rules.country_allow,
  };
};

import Link from "next/link";
import { authFetch } from "@/lib/api";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { BadgeDefault, Status } from "@/app/components/ui/badges-var1";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ProgressTTL from "@/components/ui/progress-ttl";

import GlimpsePreview from "@/components/glimpse";

// Enhanced link data interface with all metadata for expanded row
interface Target {
  id: string;
  url: string;
  weight: number;
  allowed_countries: string[];
  allowed_devices: string[];
  utm_template?: string;
  status: "active" | "inactive";
  // CRITICAL: UTM overrides data for display
  utm_overrides?: {
    utm_term?: string;
    utm_medium?: string;
    utm_source?: string;
    utm_content?: string;
    utm_campaign?: string;
  };
}

interface LinkRules {
  ip_addresses?: string[];
  referer_domains?: string[];
  device_types?: ("mobile" | "desktop")[];
  countries?: string[];
}

interface IData {
  id: string; // link.id
  name: string; // link.name
  link_type: "single" | "smart"; // mapped from link.link_type
  status: "active" | "expired" | "paused" | "archived"; // link.status
  targets_count: number; // count of targets
  click_count: number; // link.click_count
  campaign?: string; // link.campaign
  short_url: string; // link.short_url
  description?: string; // link.description
  created_at: string; // link.created_at
  expires_at?: string; // link.expires_at
  start_at?: string; // link.start_at
  group?: string; // link.group
  fallback_url?: string; // link.fallback_url
  avatar: string; // generate from link.name
  rules?: LinkRules; // link rules
  targets?: Target[]; // detailed target information
}

interface LinksDataTableProps {
  className?: string;
  onRefresh?: () => void;
}

export default function LinksDataTable({
  className,
  onRefresh,
}: LinksDataTableProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  // Fixed: Remove initial filter to show all data on load
  const [filters, setFilters] = useState<Filter[]>([]);

  // Link management state
  const [linksData, setLinksData] = useState<IData[]>([]);
  const [loading, setLoading] = useState(true);

  // Expanded row data cache
  const [expandedDataCache, setExpandedDataCache] = useState<Map<string, any>>(
    new Map(),
  );
  const [loadingExpanded, setLoadingExpanded] = useState<Set<string>>(
    new Set(),
  );

  // Groups data state - use existing hook
  const { groups, loading: loadingGroups } = useGroups();

  // UTM templates data state
  const [utmTemplates, setUtmTemplates] = useState<any[]>([]);
  const [loadingUtmTemplates, setLoadingUtmTemplates] = useState(false);

  // Async filtering state - exact demo pattern
  const [isLoading, setIsLoading] = useState(false);
  const [filteredData, setFilteredData] = useState<IData[]>([]);
  const isInitialLoad = useRef(true);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: string;
    linkId: string | null;
    linkName: string;
    reason?: string;
  }>({
    isOpen: false,
    action: "",
    linkId: null,
    linkName: "",
    reason: "",
  });

  // Load links data - replace demoData with actual API call
  const loadLinks = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/links/");

      if (res.ok) {
        const links = await res.json();

        // Map the link data to match IData interface
        const processedData: IData[] = links.map((link: any) => {
          const linkType =
            link.link_type === "redirect" ? "single" : link.link_type;
          // For basic display, we'll use real targets count from database if available
          // Smart links have multiple targets, single/redirect links have one
          const targetsCount = linkType === "smart" ? 1 : 1; // Default to 1, will be updated when expanded

          // Use group name lookup if groups data is available, otherwise use the group value directly
          const groupName = link.group;
          if (groups && groups.length > 0) {
            // If link.group is a number, look it up; otherwise use the string value directly
            /*const groupId = typeof link.group === 'number' ? link.group : parseInt(link.group);
                                        if (!isNaN(groupId)) {
                                            groupName = getGroupName(groups, groupId);
                                        }*/
          }
          return {
            id: link.id.toString(),
            name: link.name || link.short_code,
            link_type: linkType,
            status: link.status,
            targets_count: targetsCount,
            click_count: link.click_count || 0,
            campaign: link.campaign,
            short_url: link.short_url,
            description: link.description,
            created_at: link.created_at,
            expires_at: link.expires_at,
            start_at: link.start_datetime,
            group: link.group_name || "--",
            fallback_url: link.fallback_url,
            avatar: `${Math.floor(Math.random() * 12) + 1}.png`, // Generate avatar for demo
            rules: undefined, // Will be loaded when expanded
            targets: undefined, // Will be loaded when expanded
          };
        });

        setLinksData(processedData);
      } else {
        const errorText = await res.text();
        throw new Error(`Failed to load links: ${res.status} ${errorText}`);
      }
    } catch (error) {
      toast.error("Failed to load links");
    } finally {
      setLoading(false);
    }
  };

  // Load links on mount - depends on groups data for proper name resolution
  useEffect(() => {
    loadLinks();
  }, [groups]);

  // Load UTM templates
  const loadUtmTemplates = async () => {
    setLoadingUtmTemplates(true);
    console.log("🔄 Loading UTM templates...");
    try {
      const res = await authFetch("/api/utm-templates/");
      console.log("📡 UTM Templates API response:", {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
      });

      if (!res.ok) {
        console.error(
          "❌ UTM Templates API failed:",
          res.status,
          res.statusText,
        );
        return;
      }

      const allTemplates = await res.json();
      console.log(
        "✅ UTM Templates loaded:",
        allTemplates.length,
        allTemplates,
      );
      setUtmTemplates(allTemplates);
    } catch (error) {
      console.error("❌ Failed to load UTM templates:", error);
    } finally {
      setLoadingUtmTemplates(false);
    }
  };

  // Load UTM templates on mount
  useEffect(() => {
    loadUtmTemplates();
  }, []);

  // Fetch detailed data for expanded row
  const fetchExpandedData = useCallback(
    async (linkId: string) => {
      if (expandedDataCache.has(linkId) || loadingExpanded.has(linkId)) {
        return; // Already loading or cached
      }

      setLoadingExpanded((prev) => {
        const newSet = new Set(Array.from(prev));
        newSet.add(linkId);
        return newSet;
      });

      try {
        const detailedData = await fetchDetailedLinkData(linkId);

        if (detailedData) {
          setExpandedDataCache((prev) => {
            const newMap = new Map(Array.from(prev));
            newMap.set(linkId, detailedData);
            return newMap;
          });

          // Update the main links data with real counts and details
          setLinksData((prevLinks) =>
            prevLinks.map((link) => {
              if (link.id === linkId) {
                const targets = transformTargets(
                  detailedData.targets || [],
                  utmTemplates,
                );
                const rules = transformRules(detailedData);

                return {
                  ...link,
                  targets_count: targets.length,
                  targets,
                  rules,
                  group: link.group,
                  fallback_url: detailedData.fallback_url,
                  start_at: detailedData.start_datetime,
                };
              }
              return link;
            }),
          );
        }
      } catch (error) {
        // Error handling without console logging
      } finally {
        setLoadingExpanded((prev) => {
          const newSet = new Set(Array.from(prev));
          newSet.delete(linkId);
          return newSet;
        });
      }
    },
    [expandedDataCache, loadingExpanded, utmTemplates],
  );

  // Debug logging for UTM templates loading
  useEffect(() => {
    console.log("🔍 UTM Templates state updated:", {
      count: utmTemplates.length,
      loading: loadingUtmTemplates,
      templates: utmTemplates.slice(0, 3), // Log first 3 for debugging
    });
  }, [utmTemplates, loadingUtmTemplates]);
  // Debug logging for UTM templates loading
  useEffect(() => {
    console.log("🔍 UTM Templates state updated:", {
      count: utmTemplates.length,
      loading: loadingUtmTemplates,
      templates: utmTemplates.slice(0, 3), // Log first 3 for debugging
    });
  }, [utmTemplates, loadingUtmTemplates]);

  // Re-process expanded targets when UTM templates become available
  useEffect(() => {
    if (utmTemplates.length > 0 && expandedDataCache.size > 0) {
      console.log(
        "🔄 Re-processing expanded targets with loaded UTM templates...",
      );

      // Re-process each expanded row that has targets
      setLinksData((prevLinks) => {
        return prevLinks.map((link) => {
          if (link.targets && link.targets.length > 0) {
            const expandedData = expandedDataCache.get(link.id);
            if (expandedData) {
              console.log(
                `🔄 Reprocessing link ${link.id} targets with ${utmTemplates.length} templates`,
              );
              const updatedTargets = transformTargets(
                expandedData.targets || [],
                utmTemplates,
              );

              return {
                ...link,
                targets: updatedTargets,
              };
            }
          }
          return link;
        });
      });
    }
  }, [utmTemplates, expandedDataCache]);

  // Filter field configurations - exact demo structure
  const fields: FilterFieldConfig[] = [
    {
      key: "name",
      label: "Name",
      icon: <User className="size-3.5" />,
      type: "text",
      className: "w-40",
      placeholder: "Search names...",
    },
    {
      key: "short_url",
      label: "Short URL",
      icon: <Globe className="size-3.5" />,
      type: "text",
      className: "w-48",
      placeholder: "Search URLs...",
    },
    {
      key: "link_type",
      label: "Link Type",
      icon: <List className="size-3.5" />,
      type: "select",
      searchable: true,
      className: "w-[140px]",
      options: [
        { value: "single", label: "Single Link" },
        { value: "smart", label: "Smart Link" },
      ],
    },
    {
      key: "status",
      label: "Status",
      icon: <CheckCircle className="size-3.5" />,
      type: "select",
      searchable: false,
      className: "w-[140px]",
      options: [
        {
          value: "active",
          label: "Active",
          icon: <div className="size-2 bg-green-500 rounded-full"></div>,
        },
        {
          value: "expired",
          label: "Expired",
          icon: <div className="size-2 bg-red-500 rounded-full"></div>,
        },
        {
          value: "paused",
          label: "Paused",
          icon: <div className="size-2 bg-yellow-500 rounded-full"></div>,
        },
        {
          value: "archived",
          label: "Archived",
          icon: <div className="size-2 bg-zinc-400 rounded-full"></div>,
        },
      ],
    },
    {
      key: "campaign",
      label: "Campaign",
      icon: <BarChart3 className="size-3.5" />,
      type: "select",
      searchable: true,
      className: "w-[160px]",
      options: useMemo(() => {
        const campaigns = Array.from(
          new Set(linksData.map((link) => link.campaign).filter(Boolean)),
        ) as string[];
        return campaigns.map((campaign) => ({
          value: campaign,
          label: campaign,
        }));
      }, [linksData]),
    },
    {
      key: "created_at",
      label: "Created Date",
      icon: <CalendarDays className="size-3.5" />,
      type: "date",
      className: "w-36",
    },
    {
      key: "click_count",
      label: "Click Count",
      icon: <Hash className="size-3.5" />,
      type: "number",
      min: 0,
      max: 100000,
      step: 1,
      className: "w-32",
    },
  ];

  // Apply filters to data - exact demo function
  const applyFiltersToData = useCallback(
    (newFilters: Filter[]) => {
      let filtered = [...linksData];

      // Filter out empty filters before applying
      const activeFilters = newFilters.filter((filter) => {
        const { values } = filter;

        // Check if filter has meaningful values
        if (!values || values.length === 0) return false;

        // For text/string values, check if they're not empty strings
        if (
          values.every(
            (value) => typeof value === "string" && value.trim() === "",
          )
        )
          return false;

        // For number values, check if they're not null/undefined
        if (values.every((value) => value === null || value === undefined))
          return false;

        // For arrays, check if they're not empty
        if (values.every((value) => Array.isArray(value) && value.length === 0))
          return false;

        return true;
      });

      activeFilters.forEach((filter) => {
        const { field, operator, values } = filter;

        filtered = filtered.filter((item) => {
          const fieldValue = item[field as keyof IData];

          switch (operator) {
            case "is":
              return values.includes(fieldValue);
            case "is_not":
              return !values.includes(fieldValue);
            case "contains":
              return values.some((value) =>
                String(fieldValue)
                  .toLowerCase()
                  .includes(String(value).toLowerCase()),
              );
            case "not_contains":
              return !values.some((value) =>
                String(fieldValue)
                  .toLowerCase()
                  .includes(String(value).toLowerCase()),
              );
            case "equals":
              return fieldValue === values[0];
            case "not_equals":
              return fieldValue !== values[0];
            case "greater_than":
              return Number(fieldValue) > Number(values[0]);
            case "less_than":
              return Number(fieldValue) < Number(values[0]);
            case "greater_than_or_equal":
              return Number(fieldValue) >= Number(values[0]);
            case "less_than_or_equal":
              return Number(fieldValue) <= Number(values[0]);
            case "between":
              if (values.length >= 2) {
                const min = Number(values[0]);
                const max = Number(values[1]);
                return Number(fieldValue) >= min && Number(fieldValue) <= max;
              }
              return true;
            case "not_between":
              if (values.length >= 2) {
                const min = Number(values[0]);
                const max = Number(values[1]);
                return Number(fieldValue) < min || Number(fieldValue) > max;
              }
              return true;
            case "before":
              return new Date(String(fieldValue)) < new Date(String(values[0]));
            case "after":
              return new Date(String(fieldValue)) > new Date(String(values[0]));
            default:
              return true;
          }
        });
      });

      return filtered;
    },
    [linksData],
  );

  // Async filtering simulation
  const simulateAsyncFiltering = useCallback(
    async (newFilters: Filter[]) => {
      setIsLoading(true); // Show loading on current data

      // Simulate API call delay
      await new Promise((resolve) =>
        setTimeout(resolve, 800 + Math.random() * 1200),
      );

      // Apply filters and update data after timeout
      const filtered = applyFiltersToData(newFilters);
      setFilteredData(filtered);
      setIsLoading(false);
    },
    [applyFiltersToData],
  );

  const handleFiltersChange = useCallback(
    (newFilters: Filter[]) => {
      setFilters(newFilters);
      // Reset pagination when filters change
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      // Trigger async filtering
      simulateAsyncFiltering(newFilters);
    },
    [simulateAsyncFiltering],
  );

  // Initial data load - populate filteredData immediately when linksData is available
  useEffect(() => {
    if (linksData.length > 0) {
      const filtered = applyFiltersToData(filters);
      setFilteredData(filtered);
    } else if (linksData.length === 0 && !loading) {
      // Clear filteredData when no linksData is available
      setFilteredData([]);
    }
  }, [linksData, applyFiltersToData, filters, loading]);

  // Status badge component - adapted for links
  const StatusBadge = ({ status }: { status: string }) => {
    if (status == "active") {
      return (
        /*<Badge variant="success" >
                            success
                        </Badge>*/
        <Status variant="active" label="Live Now" />
      );
    } else if (status == "expired") {
      return (
        /* <Badge variant="destructive" appearance={"light"}>
                            <BadgeDot/>
                            Expired
                        </Badge>*/
        <Status variant="danger" label="Expired" />
      );
    } else if (status == "paused") {
      return (
        /*<Badge variant="outline" >
                            <PauseCircle className="h-3 w-3 mr-1"/>
                            Paused
                        </Badge>*/
        <Status variant={"warn"} label="Paused" />
      );
    } else if (status == "archived") {
      return (
        /*<Badge variant="outline" >
                            <ArchiveIcon className="h-3 w-3 mr-1"/>
                            Archived
                        </Badge>*/
        <Status variant="default" label="Archived" />
      );
    }
  };

  // Link type badge component
  const TypeBadge = ({ linkType }: { linkType: string }) => {
    return linkType === "smart" ? (
      <Label className="text-xs">Smart</Label>
    ) : (
      <Label className="text-xs">Single</Label>
    );
  };

  // Format date utility
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isPast: date < new Date(),
    };
  };

  // Avatar fallback
  const getAvatarFallback = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle pause/archive actions
  const handlePauseArchiveAction = async (linkId: string, action: string) => {
    setActionLoading(linkId);
    try {
      const res = await authFetch(`/api/links/${linkId}/${action}`, {
        method: "POST",
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(result.message || `Link ${action}ed successfully`);
        loadLinks();
        onRefresh?.();
      } else {
        const error = await res.text();
        toast.error(`Failed to ${action} link: ${error}`);
      }
    } catch (error) {
      console.error(`Failed to ${action} link:`, error);
      toast.error(`Failed to ${action} link`);
    } finally {
      setActionLoading(null);
      setConfirmDialog({
        isOpen: false,
        action: "",
        linkId: null,
        linkName: "",
      });
    }
  };

  const openConfirmDialog = (action: string, link: IData) => {
    setConfirmDialog({
      isOpen: true,
      action,
      linkId: link.id,
      linkName: link.name,
    });
  };

  // Column definitions - exact demo structure with link fields
  const columns = useMemo<ColumnDef<IData>[]>(
    () => [
      {
        //accessorKey: "id",
        id: "id",
        header: () => null,
        cell: ({ row }) => {
          const linkId = row.original.id;

          // Trigger data fetch when expanding
          const isExpanded = row.getIsExpanded();
          useEffect(() => {
            if (isExpanded) {
              fetchExpandedData(linkId);
            }
          }, [isExpanded, linkId, fetchExpandedData]);

          return row.getCanExpand() ? (
            <Button
              className={"bg-transparent text-red-500"}
              onClick={row.getToggleExpandedHandler()}
            >
              {row.getIsExpanded() ? <ChevronUp /> : <ChevronDown />}
            </Button>
          ) : null;
        },
        size: 22,
        meta: {
          expandedContent: (row) => {
            const linkId = row.id;
            const isLoadingExpanded = loadingExpanded.has(linkId);
            const expandedData = expandedDataCache.get(linkId);
            const utmParams = expandedData?.utm_params || {};
            return (
              <div className="p-6  rounded-lg mx-4 mb-2">
                {/* 2-Column Grid Layout */}
                <div className="grid grid-cols-3 gap-6">
                  {/* Grid Column 1 - LINK INFORMATION */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">
                      LINK INFORMATION
                    </h3>

                    <div className={"w-full"}>
                      <h4 className="font-normal text-balance mb-2 text-muted-foreground">
                        Basic Information
                      </h4>
                      <div className="border border-border rounded-lg overflow-hidden ">
                        <Table className="text-xs w-full text-balance">
                          <TableBody>
                            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                              <TableCell className="bg-muted/50 py-2 font-medium">
                                Link Name
                              </TableCell>
                              <TableCell className="flex py-2 gap-2 items-center">
                                {row.name}
                                <StatusBadge status={row.status} />
                              </TableCell>
                            </TableRow>
                            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                              <TableCell className="bg-muted/50 py-2 font-medium">
                                Description
                              </TableCell>
                              <TableCell className="py-2">
                                {row.description || "--"}
                              </TableCell>
                            </TableRow>
                            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                              <TableCell className="bg-muted/50 py-2 font-medium">
                                Campaign
                              </TableCell>
                              <TableCell className="py-2">
                                {row.campaign || "--"}
                              </TableCell>
                            </TableRow>
                            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                              <TableCell className="bg-muted/50 py-2 font-medium">
                                Group
                              </TableCell>
                              <TableCell className="py-2">
                                {row.group || "Default Group"}
                              </TableCell>
                            </TableRow>

                            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                              <TableCell className="bg-muted/50 py-2 font-medium">
                                Short URL
                              </TableCell>
                              <TableCell className="py-2">
                                {/*{row.short_url ? (
                                            <a
                                                href={row.short_url}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {row.short_url}
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground/50">
                                      --
                                    </span>
                                        )}*/}

                                {/* <GlimpsePreview url={row.short_url} label={row.short_url} />*/}
                                <GlimpsePreview url={row.short_url} />
                              </TableCell>
                            </TableRow>

                            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                              <TableCell className="bg-muted/50 py-2 font-medium">
                                Fallback URL
                              </TableCell>
                              <TableCell className="py-2">
                                {row.fallback_url ? (
                                  <a
                                    href={row.fallback_url}
                                    className="text-blue-600 hover:underline"
                                  >
                                    {row.fallback_url}
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground/50">
                                    --
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    <div className={"w-full"}>
                      <h4 className="font-normal text-sm mb-2 text-muted-foreground">
                        Advanced Rules
                      </h4>
                      <div className="w-full border border-border rounded-lg overflow-hidden flex-1">
                        <Table className="text-xs">
                          <TableBody>
                            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                              <TableCell className=" bg-muted/50 py-2 font-medium">
                                IP Address
                              </TableCell>
                              <TableCell className="flex py-2">
                                {row.rules?.ip_addresses &&
                                row.rules.ip_addresses.length > 0 ? (
                                  row.rules.ip_addresses.length === 1 ? (
                                    row.rules.ip_addresses[0]
                                  ) : (
                                    row.rules.ip_addresses.join(", ")
                                  )
                                ) : (
                                  <span className={"text-muted-foreground"}>
                                    No restrictions
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                              <TableCell className="bg-muted/50 py-2 font-medium">
                                Referer
                              </TableCell>
                              <TableCell className="py-2">
                                {row.rules?.referer_domains &&
                                row.rules.referer_domains.length > 0 ? (
                                  row.rules.referer_domains.length === 1 ? (
                                    row.rules.referer_domains[0]
                                  ) : (
                                    row.rules.referer_domains.join(", ")
                                  )
                                ) : (
                                  <span className={"text-muted-foreground"}>
                                    No restrictions
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                              <TableCell className="w-25 bg-muted/50 py-2 font-medium">
                                Start At
                              </TableCell>
                              <TableCell className="flex py-2">
                                {row.start_at ? (
                                  new Date(row.start_at).toLocaleDateString() +
                                  " " +
                                  new Date(row.start_at).toLocaleTimeString()
                                ) : (
                                  <span className={"text-muted-foreground"}>
                                    "mm/dd/yy hh:mm"
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                              <TableCell className="bg-muted/50 py-2 font-medium">
                                Expired At
                              </TableCell>
                              <TableCell className="py-2">
                                {row.expires_at ? (
                                  new Date(
                                    row.expires_at,
                                  ).toLocaleDateString() +
                                  " " +
                                  new Date(row.expires_at).toLocaleTimeString()
                                ) : (
                                  <span className={"text-muted-foreground"}>
                                    "mm/dd/yy hh:mm"
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>

                            <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                              <TableCell className="bg-muted/50 py-2 font-medium"></TableCell>
                              <TableCell className="py-2">
                                {row.expires_at && (
                                  <div className="w-full">
                                    <ProgressTTL
                                      startDate={row.start_at}
                                      endDate={row.expires_at}
                                      expiresAt={row.expires_at}
                                      createdAt={row.created_at}
                                      showTitle={true}
                                      className="w-full"
                                    />
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/*<div className="border border-border rounded-lg overflow-hidden">
                          <Table className="w-full text-xs md:w-[350px]">
                              <TableBody>
                                  <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                                      <TableCell className="bg-muted/50 py-2 font-medium">
                                          Role
                                      </TableCell>
                                      <TableCell className="py-2">
                                          <Badge variant="secondary">Admin</Badge>
                                      </TableCell>
                                  </TableRow>
                                  <TableRow className="*:border-border hover:bg-transparent [&>:not(:last-child)]:border-r">
                                      <TableCell className="bg-muted/50 py-2 font-medium">
                                          Status
                                      </TableCell>
                                      <TableCell className="py-2">
                                          <Badge variant="primary">Active</Badge>
                                      </TableCell>
                                  </TableRow>
                              </TableBody>
                          </Table>
                      </div>*/}
                  </div>

                  {/* Grid Column 2 - TARGETS */}
                  <div>
                    <div className="w-full inline-flex items-center font-semibold text-lg border-b pb-2 gap-1">
                      <h3>{row.targets_count > 1 ? "TARGETS" : "TARGET"}</h3>

                      <Badge size="xs" shape="circle" variant="primary">
                        {row.targets_count}
                      </Badge>
                    </div>

                    {isLoadingExpanded ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Loading...</p>
                      </div>
                    ) : row.targets && row.targets.length > 0 ? (
                      <Accordion type="multiple" className="w-full">
                        {row.targets.map((target, i) => (
                          <AccordionItem key={target.id} value={target.id}>
                            <AccordionTrigger className="text-left hover:no-underline">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs flex-shrink-1 font-light font-mono"
                                >
                                  {target.weight}%
                                </Badge>
                                <span className="font-normal text-balance text-muted-foreground">
                                  {target.url}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className={"text-xs"}>
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-medium mb-2">
                                    Audience Rules
                                  </h4>

                                  {/* Allowed Countries */}
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                      <span className="font-medium text-xs min-w-[120px]">
                                        Allowed Countries:
                                      </span>
                                      <div className="flex flex-wrap gap-1">
                                        {target.allowed_countries &&
                                        target.allowed_countries.length > 0 ? (
                                          target.allowed_countries.map(
                                            (country, j) => (
                                              <Badge
                                                key={j}
                                                variant="secondary"
                                                className="text-xs font-light"
                                              >
                                                {country}
                                              </Badge>
                                            ),
                                          )
                                        ) : (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs font-light"
                                          >
                                            All
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    {/* Allowed Device */}
                                    <div className="flex text-xs items-center gap-3">
                                      <span className="font-medium min-w-[120px]">
                                        Allowed Device:
                                      </span>
                                      <div className="flex font-mono flex-wrap gap-1">
                                        {target.allowed_devices &&
                                        target.allowed_devices.length > 0 ? (
                                          target.allowed_devices.map(
                                            (device, j) => {
                                              const deviceLabel =
                                                device === "mobile"
                                                  ? "Mobile"
                                                  : device === "desktop"
                                                    ? "Desktop"
                                                    : `${device}`;
                                              return (
                                                <Badge
                                                  key={j}
                                                  variant="secondary"
                                                  className="text-xs font-light"
                                                >
                                                  {deviceLabel}
                                                </Badge>
                                              );
                                            },
                                          )
                                        ) : (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs font-light"
                                          >
                                            [Any]
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    {/* UTM Template */}
                                    <div className="flex items-center gap-3">
                                      <span className="font-medium min-w-[120px]">
                                        UTM Template:
                                      </span>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs font-light"
                                      >
                                        {target.utm_template ||
                                          "Default Template"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                {/* UTM Fields Table */}
                                <div>
                                  <h4 className="font-medium mb-3">
                                    UTM Parameters
                                  </h4>
                                  <div className="border rounded-lg overflow-hidden bg-gray-50">
                                    {/* Display UTM parameters */}
                                    {(() => {
                                      // Access UTM overrides directly from target.utm_overrides
                                      const utmOverrides = target.utm_overrides;

                                      return utmOverrides &&
                                        Object.keys(utmOverrides).length > 0 ? (
                                        Object.entries(utmOverrides).map(
                                          ([key, value], index) => (
                                            <div
                                              key={key}
                                              className={`grid grid-cols-2 gap-4 p-3 ${index < Object.keys(utmOverrides).length - 1 ? "border-b" : ""} bg-white`}
                                            >
                                              <span className="font-medium text-accent-foreground">
                                                {key}:
                                              </span>
                                              <span className="text-muted-foreground font-mono">
                                                {String(value) ||
                                                  "Not configured"}
                                              </span>
                                            </div>
                                          ),
                                        )
                                      ) : (
                                        <div className="grid grid-cols-2 gap-4 p-3 bg-white">
                                          <span className="font-medium text-gray-700">
                                            No UTM parameters configured
                                          </span>
                                          <span className="text-gray-500 font-mono">
                                            Default template will be used
                                          </span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500">
                          No targets configured
                        </p>
                      </div>
                    )}
                  </div>
                  <div></div>
                </div>
              </div>
            );
          },
        },
      },
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <DataGridColumnHeader title="Link Name" column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarImage
                  src={`/media/avatars/${row.original.avatar}`}
                  alt={row.original.name}
                />
                <AvatarFallback>
                  {getAvatarFallback(row.original.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-px">
                <div className="font-medium text-foreground">
                  {row.original.name}
                </div>
                <div className="text-muted-foreground text-xs truncate flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {row.original.short_url}
                </div>
                {/*{row.original.description && (
                  <div className="text-xs text-gray-500 truncate">{row.original.description}</div>
                )}*/}
              </div>
            </div>
          );
        },
        size: 350,
        enableSorting: true,
        enableHiding: false,
        meta: {
          skeleton: (
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-60" />
                {/*<Skeleton className="h-3 w-20" />*/}
              </div>
            </div>
          ),
        },
      },
      {
        accessorKey: "link_type",
        id: "link_type",
        header: "Link Type",
        cell: ({ row }) => <TypeBadge linkType={row.original.link_type} />,
        size: 120,
        enableSorting: true,
        enableHiding: false,
        meta: {
          skeleton: <Skeleton className="h-4 w-16 rounded-full" />,
        },
      },
      {
        accessorKey: "targets_count",
        id: "targets_count",
        header: "Targets",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            {row.original.targets_count} target
            {row.original.targets_count !== 1 ? "s" : ""}
          </Badge>
        ),
        size: 100,
        enableSorting: true,
        meta: {
          skeleton: <Skeleton className="h-4 w-16 rounded-full" />,
        },
      },
      {
        accessorKey: "click_count",
        id: "click_count",
        header: ({ column }) => (
          <DataGridColumnHeader title="Clicks" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-normal text-sm">
              {row.original.click_count}
            </span>
          </div>
        ),
        size: 100,
        enableSorting: true,
        meta: {
          skeleton: (
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-8" />
            </div>
          ),
        },
      },
      {
        accessorKey: "campaign",
        id: "campaign",
        header: "Campaign",
        cell: ({ row }) => {
          const campaign = row.original.campaign;
          return campaign ? (
            <Badge variant="outline">{campaign}</Badge>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
        size: 140,
        enableSorting: true,
        meta: {
          skeleton: <Skeleton className="h-4 w-20" />,
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        size: 120,
        enableSorting: true,
        meta: {
          skeleton: <Skeleton className="h-4 w-16 rounded-full" />,
        },
      },
      {
        accessorKey: "created_at",
        id: "created_at",
        header: ({ column }) => (
          <DataGridColumnHeader title="Created" column={column} />
        ),
        cell: ({ row }) => {
          const createdInfo = formatDate(row.original.created_at);
          return createdInfo ? (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <div className="font-normal text-xs">{createdInfo.date}</div>
                <div className="text-xs text-muted-foreground">
                  {createdInfo.time}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
        size: 140,
        enableSorting: true,
        meta: {
          skeleton: (
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ),
        },
      },
      {
        accessorKey: "expires_at",
        id: "expires_at",
        header: "Expires",
        cell: ({ row }) => {
          const expiresInfo = formatDate(row.original.expires_at);
          return expiresInfo ? (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <div>
                <div
                  className={`text-sm font-medium ${expiresInfo.isPast ? "text-red-500" : "text-gray-900"}`}
                >
                  {expiresInfo.isPast ? "Expired" : "Expires"}
                </div>
                <div className="text-xs text-gray-500">{expiresInfo.date}</div>
              </div>
            </div>
          ) : (
            <span className="text-gray-400">Never</span>
          );
        },
        size: 140,
        enableSorting: true,
        meta: {
          skeleton: (
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ),
        },
      },
      {
        id: "actions",
        header: "Actions",
        enablePinning: true,
        minSize: 1,
        cell: ({ row }) => {
          const link = row.original;
          const isActionLoading = actionLoading === link.id;

          return (
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" disabled={isActionLoading}>
                    {isActionLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                    ) : (
                      <MoreHorizontal className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {/* Visit Link - Always Available */}
                  <DropdownMenuItem
                    onClick={() => window.open(link.short_url, "_blank")}
                    className="flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit
                  </DropdownMenuItem>

                  {/* Preview Link - Always Available */}
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/workspace/links/${link.id}/preview`}
                      className="flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Link>
                  </DropdownMenuItem>

                  {/* Edit Link - Always Available */}
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/workspace/edit/${link.id}`}
                      className="flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {/* Status-dependent Actions */}
                  {link.status === "active" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => openConfirmDialog("pause", link)}
                        disabled={isActionLoading}
                        className="flex items-center text-yellow-600"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openConfirmDialog("archive", link)}
                        disabled={isActionLoading}
                        className="flex items-center text-gray-600"
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </>
                  )}

                  {link.status === "paused" && (
                    <DropdownMenuItem
                      onClick={() => openConfirmDialog("unpause", link)}
                      disabled={isActionLoading}
                      className="flex items-center text-green-600"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </DropdownMenuItem>
                  )}

                  {link.status === "archived" && (
                    <DropdownMenuItem
                      onClick={() => openConfirmDialog("unarchive", link)}
                      disabled={isActionLoading}
                      className="flex items-center text-blue-600"
                    >
                      <ArchiveIcon className="h-4 w-4 mr-2" />
                      Restore
                    </DropdownMenuItem>
                  )}

                  {link.status === "expired" && (
                    <DropdownMenuItem
                      disabled
                      className="flex items-center text-gray-400"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Link expired
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 80,
        enableSorting: false,
        meta: {
          skeleton: (
            <div className="flex items-center">
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          ),
        },
      },
    ],
    [actionLoading],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row: IData) => row.id,
    getRowCanExpand: (row) => true,
    state: {
      pagination,
      sorting,
      columnOrder,
    },

    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className={`w-full self-start ${className}`}>
      {/* Filters Section - Exact demo structure */}
      <div className="flex items-start gap-2.5 mb-3.5">
        <div className="flex-1">
          <Filters
            filters={filters}
            fields={fields}
            onChange={handleFiltersChange}
            variant="outline"
            size="sm"
          />
        </div>
        {filters.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilters([]);
              simulateAsyncFiltering([]);
            }}
            disabled={isLoading}
          >
            <FunnelX /> Clear
          </Button>
        )}
      </div>

      {/* Data Grid - Exact demo structure */}
      <DataGrid
        table={table}
        isLoading={isLoading}
        loadingMode="skeleton"
        recordCount={filteredData?.length || 0}
        tableLayout={{
          dense: true,
          columnsMovable: true,
          headerSticky: true,
          columnsResizable: true,
        }}
      >
        <div className="w-full space-y-2.5">
          <DataGridContainer>
            <ScrollArea className="max-h-196">
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </DataGridContainer>
          <DataGridPagination />
        </div>
      </DataGrid>

      {/* Async Info Alert - Exact demo structure */}
      <Alert
        variant="success"
        appearance="light"
        close={false}
        className="mt-5"
      >
        <AlertIcon>
          <CircleAlert />
        </AlertIcon>
        <AlertTitle>
          Async Mode: Simulated API Delay of <strong>800-2000ms</strong>
        </AlertTitle>
      </Alert>

      {/* Confirmation Dialog - Using proper Dialog component */}
      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === "pause" && "Pause Link"}
              {confirmDialog.action === "unpause" && "Resume Link"}
              {confirmDialog.action === "archive" && "Archive Link"}
              {confirmDialog.action === "unarchive" && "Unarchive Link"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmDialog.action} "
              {confirmDialog.linkName}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({
                  isOpen: false,
                  action: "",
                  linkId: null,
                  linkName: "",
                })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                confirmDialog.linkId &&
                confirmDialog.action &&
                handlePauseArchiveAction(
                  confirmDialog.linkId,
                  confirmDialog.action,
                )
              }
              className={
                confirmDialog.action === "pause"
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : confirmDialog.action === "unpause"
                    ? "bg-green-600 hover:bg-green-700"
                    : confirmDialog.action === "archive"
                      ? "bg-gray-600 hover:bg-gray-700"
                      : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {confirmDialog.action === "pause" && "Pause Link"}
              {confirmDialog.action === "unpause" && "Resume Link"}
              {confirmDialog.action === "archive" && "Archive Link"}
              {confirmDialog.action === "unarchive" && "Unarchive Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
