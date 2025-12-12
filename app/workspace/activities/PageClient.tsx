"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner";
import { authFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Filter,
  Link,
  MoreHorizontal,
  Search,
  Tag,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface ActivityItem {
  id: string;
  type:
    | "link_created"
    | "campaign_started"
    | "link_updated"
    | "notification_sent"
    | "user_action";
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface ActivitiesPageProps {
  // No props needed for now
}

const ACTIVITIES_PER_PAGE = 20;

const ACTIVITY_TYPES = [
  { value: "all", label: "All Types", icon: Activity },
  { value: "link_created", label: "Link Created", icon: Link },
  { value: "campaign_started", label: "Campaign Started", icon: CheckCircle },
  { value: "link_updated", label: "Link Updated", icon: Edit },
  { value: "notification_sent", label: "Notification Sent", icon: Users },
  { value: "user_action", label: "User Action", icon: Tag },
];

const TIME_RANGES = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
];

export default function ActivitiesPageClient({}: ActivitiesPageProps) {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: ACTIVITIES_PER_PAGE.toString(),
          type: typeFilter,
          timeRange,
          search: searchQuery,
        });

        const response = await authFetch(`/api/workspace/activities?${params}`);
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
        } else {
          toast.error("Failed to load activities");
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
        toast.error("Failed to load activities");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [currentPage, typeFilter, timeRange, searchQuery]);

  // Filter activities based on search query
  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) return activities;

    return activities.filter(
      (activity) =>
        activity.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (activity.metadata &&
          Object.values(activity.metadata).some((value) =>
            String(value).toLowerCase().includes(searchQuery.toLowerCase()),
          )),
    );
  }, [activities, searchQuery]);

  const getActivityIcon = (type: string) => {
    const activityType = ACTIVITY_TYPES.find((t) => t.value === type);
    return activityType?.icon || Activity;
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "link_created":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "campaign_started":
        return "text-green-600 bg-green-50 border-green-200";
      case "link_updated":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "notification_sent":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "user_action":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const totalPages = Math.ceil(filteredActivities.length / ACTIVITIES_PER_PAGE);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * ACTIVITIES_PER_PAGE,
    currentPage * ACTIVITIES_PER_PAGE,
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/workspace")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Workspace</span>
            </Button>
          </div>
        </div>

        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-muted-foreground">
            Activities Center
          </h1>
          <p className="text-md text-muted-foreground">
            View and manage all your workspace activities and track important
            events.
          </p>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters & Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search activities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <type.icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Time Range Filter */}
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activities List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Activities ({filteredActivities.length})
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages || 1}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="h-8 w-8" />
                <span className="ml-2 text-muted-foreground">
                  Loading activities...
                </span>
              </div>
            ) : paginatedActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No activities found
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {searchQuery || typeFilter !== "all" || timeRange !== "all"
                    ? "Try adjusting your filters or search terms."
                    : "Activities will appear here as you use the workspace."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {paginatedActivities.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className="p-6 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start space-x-4">
                        {/* Activity Icon */}
                        <div
                          className={cn(
                            "flex-shrink-0 w-10 h-10 rounded-full border flex items-center justify-center",
                            getActivityColor(activity.type),
                          )}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>

                        {/* Activity Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-foreground mb-1">
                                {activity.content}
                              </h4>

                              {/* Metadata */}
                              {activity.metadata &&
                                Object.keys(activity.metadata).length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {Object.entries(activity.metadata).map(
                                      ([key, value]) => (
                                        <Badge
                                          key={key}
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {key}:{" "}
                                          {typeof value === "object"
                                            ? JSON.stringify(value)
                                            : String(value)}
                                        </Badge>
                                      ),
                                    )}
                                  </div>
                                )}

                              {/* User and Timestamp */}
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                {activity.user && (
                                  <span className="flex items-center space-x-1">
                                    <Users className="h-3 w-3" />
                                    <span>{activity.user.name}</span>
                                  </span>
                                )}
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {formatTimestamp(activity.timestamp)}
                                  </span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {new Date(
                                      activity.timestamp,
                                    ).toLocaleString()}
                                  </span>
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
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
                                <DropdownMenuItem>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Related Items
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ACTIVITIES_PER_PAGE + 1} to{" "}
                {Math.min(
                  currentPage * ACTIVITIES_PER_PAGE,
                  filteredActivities.length,
                )}{" "}
                of {filteredActivities.length} activities
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum =
                      Math.max(1, Math.min(totalPages - 4, currentPage - 2)) +
                      i;
                    if (pageNum > totalPages) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          pageNum === currentPage ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
      <Toaster />
    </>
  );
}
