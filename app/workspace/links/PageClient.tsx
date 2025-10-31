"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { SafeUser } from "@/lib/getSafeSession";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  Edit,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

interface Link {
  id: number;
  short_code: string;
  name: string;
  link_type: "redirect" | "smart"; // Database stores "redirect" for single links
  type: "single" | "smart"; // Frontend display type (mapped from link_type)
  campaign: string | null;
  status: "active" | "expired";
  created_at: string;
  expires_at: string | null;
  click_count: number;
  short_url: string;
  target_url: string;
}

interface LinksPageProps {
  user: SafeUser;
}

export default function LinksPage({ user }: LinksPageProps) {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const router = useRouter();

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/links/");
      if (res.ok) {
        const data = await res.json();
        // Map link_type from database to type for frontend display
        const mappedData = data.map((link: any) => ({
          ...link,
          type: link.link_type === "smart" ? "smart" : "single", // Map "redirect" to "single"
        }));
        setLinks(mappedData);
      }
    } catch (error) {
      console.error("Failed to fetch links:", error);
    }
    setLoading(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleEdit = (linkId: number) => {
    router.push(`/workspace/edit/${linkId}`);
  };

  const handleArchive = async (linkId: number) => {
    if (!confirm("Are you sure you want to archive this link?")) return;
    // Implement archive functionality
    console.log("Archive link:", linkId);
  };

  const filteredAndSortedLinks = links
    .filter((link) => {
      const matchesSearch =
        link.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.short_code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCampaign =
        campaignFilter === "all" || link.campaign === campaignFilter;
      const matchesStatus =
        statusFilter === "all" || link.status === statusFilter;
      const matchesType = typeFilter === "all" || link.type === typeFilter;
      return matchesSearch && matchesCampaign && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "created_at":
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case "clicks":
          aValue = a.click_count;
          bValue = b.click_count;
          break;
        case "expires_at":
          aValue = a.expires_at
            ? new Date(a.expires_at)
            : new Date("9999-12-31");
          bValue = b.expires_at
            ? new Date(b.expires_at)
            : new Date("9999-12-31");
          break;
        default:
          aValue = a.created_at;
          bValue = b.created_at;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const uniqueCampaigns = Array.from(
    new Set(links.map((l) => l.campaign).filter(Boolean)),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner className="size-6 mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Links</h1>
        <Button onClick={() => router.push("/workspace")}>
          Create New Link
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name or short code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={campaignFilter} onValueChange={setCampaignFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Campaigns" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {uniqueCampaigns.map((campaign) => (
              <SelectItem key={campaign} value={campaign!}>
                {campaign}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="smart">Smart</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Created Date</SelectItem>
            <SelectItem value="clicks">Clicks</SelectItem>
            <SelectItem value="expires_at">Expiry Date</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedLinks.map((link) => (
          <Card key={link.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {link.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      variant={link.type === "smart" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {link.type === "smart" ? "Smart" : "Single"}
                    </Badge>
                    <Badge
                      variant={
                        link.status === "active" ? "default" : "destructive"
                      }
                      className="text-xs"
                    >
                      {link.status}
                    </Badge>
                  </div>
                  {link.campaign && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Campaign: {link.campaign}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => copyToClipboard(link.short_url)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(link.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleArchive(link.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Clicks:</span>
                  <span className="font-medium">{link.click_count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(link.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expires:</span>
                  <span>
                    {link.expires_at
                      ? new Date(link.expires_at).toLocaleDateString()
                      : "Never"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(link.short_url, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Link
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedLinks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No links found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
}
