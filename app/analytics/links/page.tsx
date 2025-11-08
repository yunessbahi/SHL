"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  TrendingUp,
  Link as LinkIcon,
  Filter,
  Download,
  ExternalLink,
  Copy,
  Eye,
} from "lucide-react";
import Link from "next/link";

interface LinkData {
  id: number;
  short_code: string;
  target_url: string;
  campaign_name?: string;
  total_clicks: number;
  unique_visitors: number;
  conversion_rate: number;
  status: string;
  created_at: string;
  last_click?: string;
}

interface LinkAnalytics {
  overview: {
    total_links: number;
    active_links: number;
    total_clicks: number;
    avg_conversion_rate: number;
  };
  links: LinkData[];
}

const MOCK_LINKS: LinkData[] = [
  {
    id: 1,
    short_code: "abc123",
    target_url: "https://example.com/summer-sale",
    campaign_name: "Summer Sale 2024",
    total_clicks: 1542,
    unique_visitors: 1234,
    conversion_rate: 8.5,
    status: "active",
    created_at: "2024-06-01",
    last_click: "2024-06-16",
  },
  {
    id: 2,
    short_code: "def456",
    target_url: "https://example.com/product-launch",
    campaign_name: "Product Launch Q2",
    total_clicks: 893,
    unique_visitors: 756,
    conversion_rate: 6.2,
    status: "active",
    created_at: "2024-04-15",
    last_click: "2024-06-15",
  },
  {
    id: 3,
    short_code: "ghi789",
    target_url: "https://example.com/newsletter",
    campaign_name: "Email Marketing Series",
    total_clicks: 1245,
    unique_visitors: 1089,
    conversion_rate: 12.7,
    status: "paused",
    created_at: "2024-05-01",
    last_click: "2024-06-10",
  },
  {
    id: 4,
    short_code: "jkl012",
    target_url: "https://example.com/social",
    campaign_name: "Social Media Campaign",
    total_clicks: 678,
    unique_visitors: 623,
    conversion_rate: 4.1,
    status: "active",
    created_at: "2024-06-05",
    last_click: "2024-06-16",
  },
  {
    id: 5,
    short_code: "mno345",
    target_url: "https://example.com/blog",
    total_clicks: 234,
    unique_visitors: 198,
    conversion_rate: 3.2,
    status: "active",
    created_at: "2024-06-10",
    last_click: "2024-06-14",
  },
];

export default function LinkAnalytics() {
  const [analytics, setAnalytics] = useState<LinkAnalytics | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("total_clicks");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      let filteredLinks = MOCK_LINKS.filter((link) => {
        const matchesSearch =
          link.short_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          link.target_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (link.campaign_name &&
            link.campaign_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase()));
        const matchesStatus =
          statusFilter === "all" || link.status === statusFilter;
        return matchesSearch && matchesStatus;
      });

      // Sort links
      filteredLinks.sort((a, b) => {
        switch (sortBy) {
          case "total_clicks":
            return b.total_clicks - a.total_clicks;
          case "unique_visitors":
            return b.unique_visitors - a.unique_visitors;
          case "conversion_rate":
            return b.conversion_rate - a.conversion_rate;
          case "created_at":
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          default:
            return 0;
        }
      });

      const analyticsData: LinkAnalytics = {
        overview: {
          total_links: MOCK_LINKS.length,
          active_links: MOCK_LINKS.filter((l) => l.status === "active").length,
          total_clicks: MOCK_LINKS.reduce((sum, l) => sum + l.total_clicks, 0),
          avg_conversion_rate:
            MOCK_LINKS.reduce((sum, l) => sum + l.conversion_rate, 0) /
            MOCK_LINKS.length,
        },
        links: filteredLinks,
      };

      setAnalytics(analyticsData);
      setLoading(false);
    }, 500);
  }, [searchTerm, statusFilter, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Link Analytics
          </h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Link Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor performance of all your shortened links
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Overview Cards */}
      {analytics && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Links
              </p>
              <LinkIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(analytics.overview.total_links)}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Links
              </p>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(analytics.overview.active_links)}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Clicks
              </p>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(analytics.overview.total_clicks)}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Conversion Rate
              </p>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.overview.avg_conversion_rate.toFixed(1)}%
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search links, URLs, or campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="total_clicks">Sort by Clicks</option>
              <option value="unique_visitors">Sort by Visitors</option>
              <option value="conversion_rate">Sort by Conversion</option>
              <option value="created_at">Sort by Date</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Links Table */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Link Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Link
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visitors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Click
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics?.links.map((link) => (
                <tr key={link.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium text-gray-900">
                          {link.short_code}
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              `${window.location.origin}/${link.short_code}`,
                            )
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {link.target_url}
                      </div>
                      {link.campaign_name && (
                        <div className="text-xs text-blue-600">
                          {link.campaign_name}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(link.status)}`}
                    >
                      {link.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(link.total_clicks)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(link.unique_visitors)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {link.conversion_rate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {link.last_click
                      ? new Date(link.last_click).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <Link href={`/analytics/links/${link.id}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(`/${link.short_code}`, "_blank")
                        }
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
