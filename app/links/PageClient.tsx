"use client";
import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Edit,
  Target,
  Calendar,
  ExternalLink,
  Plus,
  Clock,
  BarChart3,
  Link as LinkIcon,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { SafeUser } from "@/lib/getSafeSession";

interface LinksPageProps {
  user: SafeUser;
}

interface LinkItem {
  id: number;
  short_code: string;
  name: string;
  description?: string;
  link_type: string;
  campaign?: string;
  status: string;
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
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    if (filter === "smart") return item.link_type === "smart";
    if (filter === "single") return item.link_type === "single";
    if (filter === "active") return item.status === "active";
    if (filter === "expired") return item.status === "expired";
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
    return status === "active" ? (
      <Badge
        variant="default"
        className="bg-green-100 text-green-800 hover:bg-green-100"
      >
        Active
      </Badge>
    ) : (
      <Badge
        variant="secondary"
        className="bg-red-100 text-red-800 hover:bg-red-100"
      >
        Expired
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
            count: items.filter((i) => i.link_type === "single").length,
          },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? "default" : "outline"}
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
                className="hover:shadow-lg transition-shadow duration-200"
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
                      <Link href={`/links/${item.id}/targets`}>
                        <Target className="h-3 w-3 mr-1" />
                        Targets
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Link href={`/links/${item.id}/preview`}>
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
