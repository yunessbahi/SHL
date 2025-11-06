"use client";
import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Eye,
  Edit,
  Calendar,
  ExternalLink,
  Plus,
  Clock,
  BarChart3,
  Link as LinkIcon,
  Globe,
  Pause,
  Play,
  Archive,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { SafeUser } from "@/lib/getSafeSession";
import { toast } from "sonner";

interface LinksPageProps {
  user: SafeUser;
}

interface LinkItem {
  id: number;
  short_code: string;
  name: string;
  description?: string;
  link_type: string;
  type: string;
  campaign?: string;
  status: string;
  original_status?: string;
  status_reason?: string;
  status_changed_at?: string;
  created_at: string;
  expires_at?: string;
  start_datetime?: string;
  end_datetime?: string;
  click_count: number;
  short_url: string;
  target_url: string;
  campaign_id?: number;
}

export default function LinksPage({ user }: LinksPageProps) {
  const [items, setItems] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: string;
    linkId: number | null;
    linkName: string;
    reason?: string;
  }>({
    isOpen: false,
    action: "",
    linkId: null,
    linkName: "",
    reason: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/api/links/");
        if (res.ok) {
          const data = await res.json();
          setItems(data);
        }
      } catch (error) {
        console.error("Failed to load links:", error);
        toast.error("Failed to load links");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "smart") return item.link_type === "smart";
    if (filter === "single") return item.link_type === "redirect";
    if (filter === "active") return item.status === "active";
    if (filter === "expired") return item.status === "expired";
    if (filter === "paused") return item.status === "paused";
    if (filter === "archived") return item.status === "archived";
    return true;
  });

  const formatDate = (
    dateString?: string,
  ): { date: string; time: string; isPast: boolean } | null => {
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        label: "Active",
        className: "bg-green-100 text-green-800 hover:bg-green-100",
        icon: null,
      },
      expired: {
        label: "Expired",
        className: "bg-red-100 text-red-800 hover:bg-red-100",
        icon: null,
      },
      paused: {
        label: "Paused",
        className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        icon: <Pause className="h-3 w-3 mr-1" />,
      },
      archived: {
        label: "Archived",
        className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
        icon: <Archive className="h-3 w-3 mr-1" />,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.expired;

    return (
      <Badge variant="primary" className={config.className}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return type === "smart" ? (
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200"
      >
        Smart Link
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-gray-50 text-gray-700 border-gray-200"
      >
        Single Link
      </Badge>
    );
  };

  const handlePauseArchiveAction = async (linkId: number, action: string) => {
    setActionLoading(linkId);
    try {
      const endpoint =
        action === "pause" || action === "archive" ? action : action;
      const res = await authFetch(`/api/links/${linkId}/${endpoint}`, {
        method: "POST",
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(result.message || `Link ${action}ed successfully`);
        // Refresh the links list
        const refreshRes = await authFetch("/api/links/");
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setItems(data);
        }
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

  const openConfirmDialog = (action: string, link: LinkItem) => {
    const actionConfig = {
      pause: {
        title: "Pause Link",
        description:
          "This will temporarily stop the link from redirecting. You can resume it anytime.",
        confirmText: "Pause Link",
        buttonClassName: "bg-yellow-600 hover:bg-yellow-700",
      },
      unpause: {
        title: "Resume Link",
        description:
          "This will make the link active again and allow it to redirect normally.",
        confirmText: "Resume Link",
        buttonClassName: "bg-green-600 hover:bg-green-700",
      },
      archive: {
        title: "Archive Link",
        description:
          "This will archive the link and stop it from redirecting. You can unarchive it later.",
        confirmText: "Archive Link",
        buttonClassName: "bg-gray-600 hover:bg-gray-700",
      },
      unarchive: {
        title: "Unarchive Link",
        description:
          "This will restore the link to active status and allow it to redirect normally.",
        confirmText: "Unarchive Link",
        buttonClassName: "bg-blue-600 hover:bg-blue-700",
      },
    };

    const config = actionConfig[action as keyof typeof actionConfig];

    setConfirmDialog({
      isOpen: true,
      action,
      linkId: link.id,
      linkName: link.name,
      reason: link.status_reason,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-gray-100 rounded animate-pulse mt-2"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="h-6 w-32 bg-gray-200 rounded"></div>
                  <div className="h-5 w-16 bg-gray-200 rounded"></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="flex gap-2">
                  <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  <div className="h-8 w-24 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Links</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all your {items.length} links in one place
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/workspace/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Link
          </Link>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All Links", count: items.length },
          {
            key: "active",
            label: "Active",
            count: items.filter((i) => i.status === "active").length,
          },
          {
            key: "paused",
            label: "Paused",
            count: items.filter((i) => i.status === "paused").length,
          },
          {
            key: "archived",
            label: "Archived",
            count: items.filter((i) => i.status === "archived").length,
          },
          {
            key: "expired",
            label: "Expired",
            count: items.filter((i) => i.status === "expired").length,
          },
          {
            key: "smart",
            label: "Smart",
            count: items.filter((i) => i.link_type === "smart").length,
          },
          {
            key: "single",
            label: "Single",
            count: items.filter((i) => i.link_type === "redirect").length,
          },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter(tab.key)}
            className="text-sm"
          >
            {tab.label}
            <Badge variant="secondary" className="ml-2 text-xs">
              {tab.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Links Grid */}
      {filteredItems.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <LinkIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  No links found
                </h3>
                <p className="text-gray-600">
                  {filter === "all"
                    ? "Get started by creating your first link"
                    : `No ${filter} links match your current filter`}
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href="/workspace/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Link
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const expiresInfo = formatDate(item.expires_at);
            const createdInfo = formatDate(item.created_at);

            return (
              <Card
                key={item.id}
                className={`hover:shadow-lg transition-shadow duration-200 ${
                  item.status === "paused" ? "border-yellow-200" : ""
                } ${item.status === "archived" ? "border-gray-200" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {item.name}
                      </CardTitle>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {getTypeBadge(item.link_type)}
                    {getStatusBadge(item.status)}
                    {item.campaign && (
                      <Badge variant="outline" className="text-xs">
                        {item.campaign}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Status Reason */}
                  {item.status_reason && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Status Note:
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.status_reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Target URL */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{item.target_url}</span>
                    </div>
                  </div>

                  {/* Short URL */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {item.short_url}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-auto p-1"
                        onClick={() => window.open(item.short_url, "_blank")}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      <span>{item.click_count} clicks</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>
                        Created {createdInfo ? createdInfo.date : "Unknown"}
                      </span>
                    </div>
                  </div>

                  {/* Expiry Info */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <div>
                        {expiresInfo ? (
                          <>
                            <div
                              className={`font-medium ${expiresInfo.isPast ? "text-red-600" : "text-gray-900"}`}
                            >
                              {expiresInfo.isPast ? "Expired" : "Expires"}
                            </div>
                            <div className="text-xs text-gray-600">
                              {expiresInfo.date} at {expiresInfo.time}
                            </div>
                          </>
                        ) : (
                          <div className="font-medium text-gray-900">
                            No expiry
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        expiresInfo && expiresInfo.isPast
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {expiresInfo
                        ? expiresInfo.isPast
                          ? "Expired"
                          : "Active"
                        : "No expiry"}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Link href={`/workspace/edit/${item.id}`}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Link href={`/workspace/links/${item.id}/preview`}>
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Link>
                    </Button>
                  </div>

                  {/* Status Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    {item.status === "active" ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                          onClick={() => openConfirmDialog("pause", item)}
                          disabled={actionLoading === item.id}
                        >
                          {actionLoading === item.id ? (
                            <Spinner className="h-3 w-3 mr-1" />
                          ) : (
                            <Pause className="h-3 w-3 mr-1" />
                          )}
                          Pause
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                          onClick={() => openConfirmDialog("archive", item)}
                          disabled={actionLoading === item.id}
                        >
                          {actionLoading === item.id ? (
                            <Spinner className="h-3 w-3 mr-1" />
                          ) : (
                            <Archive className="h-3 w-3 mr-1" />
                          )}
                          Archive
                        </Button>
                      </>
                    ) : item.status === "paused" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        onClick={() => openConfirmDialog("unpause", item)}
                        disabled={actionLoading === item.id}
                      >
                        {actionLoading === item.id ? (
                          <Spinner className="h-3 w-3 mr-1" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        Resume
                      </Button>
                    ) : item.status === "archived" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        onClick={() => openConfirmDialog("unarchive", item)}
                        disabled={actionLoading === item.id}
                      >
                        {actionLoading === item.id ? (
                          <Spinner className="h-3 w-3 mr-1" />
                        ) : (
                          <Archive className="h-3 w-3 mr-1" />
                        )}
                        Restore
                      </Button>
                    ) : (
                      <div className="text-center text-sm text-gray-500 py-2">
                        {item.status === "expired"
                          ? "Link has expired"
                          : "Actions not available"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
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
              {confirmDialog.reason && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <strong>Previous status:</strong> {confirmDialog.reason}
                </div>
              )}
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
              onClick={() => {
                if (confirmDialog.linkId && confirmDialog.action) {
                  const actionMap = {
                    pause: "pause",
                    unpause: "unpause",
                    archive: "archive",
                    unarchive: "unarchive",
                  };
                  handlePauseArchiveAction(
                    confirmDialog.linkId,
                    actionMap[confirmDialog.action as keyof typeof actionMap],
                  );
                }
              }}
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
