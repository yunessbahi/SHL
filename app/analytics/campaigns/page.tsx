"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  TrendingUp,
  Target,
  Filter,
  Download,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface Campaign {
  id: number;
  name: string;
  description: string;
  total_clicks: number;
  active_links: number;
  status: string;
  created_at: string;
  last_activity?: string;
}

interface CampaignAnalytics {
  overview: {
    total_campaigns: number;
    active_campaigns: number;
    total_clicks: number;
    avg_click_per_campaign: number;
  };
  campaigns: Campaign[];
}

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 1,
    name: "Summer Sale 2024",
    description: "Summer promotion campaign",
    total_clicks: 15420,
    active_links: 8,
    status: "active",
    created_at: "2024-06-01",
    last_activity: "2024-06-15",
  },
  {
    id: 2,
    name: "Product Launch Q2",
    description: "New product launch campaign",
    total_clicks: 8930,
    active_links: 12,
    status: "active",
    created_at: "2024-04-15",
    last_activity: "2024-06-14",
  },
  {
    id: 3,
    name: "Email Marketing Series",
    description: "Automated email campaign",
    total_clicks: 12450,
    active_links: 5,
    status: "paused",
    created_at: "2024-05-01",
    last_activity: "2024-06-10",
  },
  {
    id: 4,
    name: "Social Media Campaign",
    description: "Social media promotion",
    total_clicks: 6780,
    active_links: 15,
    status: "active",
    created_at: "2024-06-05",
    last_activity: "2024-06-16",
  },
];

export default function CampaignAnalytics() {
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const filteredCampaigns = MOCK_CAMPAIGNS.filter((campaign) => {
        const matchesSearch =
          campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || campaign.status === statusFilter;
        return matchesSearch && matchesStatus;
      });

      const analyticsData: CampaignAnalytics = {
        overview: {
          total_campaigns: MOCK_CAMPAIGNS.length,
          active_campaigns: MOCK_CAMPAIGNS.filter((c) => c.status === "active")
            .length,
          total_clicks: MOCK_CAMPAIGNS.reduce(
            (sum, c) => sum + c.total_clicks,
            0,
          ),
          avg_click_per_campaign: Math.round(
            MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.total_clicks, 0) /
              MOCK_CAMPAIGNS.length,
          ),
        },
        campaigns: filteredCampaigns,
      };

      setAnalytics(analyticsData);
      setLoading(false);
    }, 500);
  }, [searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Campaign Analytics
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
            Campaign Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track performance across all your campaigns
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
            <div className="absolute inset-0 pointer-events-none [background-size:20px_20px] [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"></div>
            <div className="absolute inset-0 pointer-events-none bg-card [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
            <div className="relative z-20">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Campaigns
                </p>
                <Target className="h-4 w-4 text-gray-400" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(analytics.overview.total_campaigns)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="absolute inset-0 pointer-events-none [background-size:20px_20px] [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"></div>
            <div className="absolute inset-0 pointer-events-none bg-card [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
            <div className="relative z-20">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Campaigns
                </p>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(analytics.overview.active_campaigns)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="absolute inset-0 pointer-events-none [background-size:20px_20px] [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"></div>
            <div className="absolute inset-0 pointer-events-none bg-card [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
            <div className="relative z-20">
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
            </div>
          </Card>

          <Card className="p-6">
            <div className="absolute inset-0 pointer-events-none [background-size:20px_20px] [background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"></div>
            <div className="absolute inset-0 pointer-events-none bg-card [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
            <div className="relative z-20">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Clicks/Campaign
                </p>
                <TrendingUp className="h-4 w-4 text-purple-400" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(analytics.overview.avg_click_per_campaign)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search campaigns..."
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
              <option value="draft">Draft</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Campaign Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Links
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics?.campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {campaign.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {campaign.description}
                      </div>
                      <div className="text-xs text-gray-400">
                        Created{" "}
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(campaign.total_clicks)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.active_links}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.last_activity
                      ? new Date(campaign.last_activity).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <Link href={`/analytics/campaigns/${campaign.id}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/workspace/links?campaign=${campaign.id}`}>
                        <Button variant="outline" size="sm">
                          Links
                        </Button>
                      </Link>
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
