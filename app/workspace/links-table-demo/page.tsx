"use client";

import React, { useState } from "react";
import { SafeUser } from "@/lib/getSafeSession";
import LinksDataTable from "@/app/components/links/LinksDataTable";
import PageClient from "@/app/workspace/links/PageClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LinksTableDemoPageProps {
  user: SafeUser;
}

export default function LinksTableDemoPage({ user }: LinksTableDemoPageProps) {
  const [activeView, setActiveView] = useState<"table" | "cards">("table");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-accent-foreground">
            Links Management Demo
          </h1>
          <p className="text-gray-600 mt-1">
            Testing the new data table component for links management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            New Feature
          </Badge>
        </div>
      </div>

      {/* Demo Info */}
      <div className="bg-card border border-muted-foreground-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="bg-secondary rounded-full p-2">
            <svg
              className="h-5 w-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              New Data Table Component
            </h3>
            <div className="text-sm text-muted-foreground mt-1">
              <p>
                This demo showcases the new filterable data table component for
                links management. The table includes all required columns: Name
                (with avatar), Link Type, Target, Clicks, Campaign, Status,
                Created At, Expiry, and Actions.
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Advanced filtering and sorting capabilities</li>
                <li>• Pagination support</li>
                <li>• Status-specific badges and action buttons</li>
                <li>• Loading states and skeleton UI</li>
                <li>• Responsive design</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">View:</span>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView("table")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeView === "table"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Data Table
            </div>
          </button>
          <button
            onClick={() => setActiveView("cards")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeView === "cards"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Card View
            </div>
          </button>
        </div>
      </div>

      {/* View Content */}
      {activeView === "table" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Data Table View</h2>
            <div className="text-sm text-gray-500">
              Features: Filter, Sort, Pagination, Actions
            </div>
          </div>
          <LinksDataTable />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Card View (Current Implementation)
            </h2>
            <div className="text-sm text-gray-500">
              Original card-based layout
            </div>
          </div>
          <PageClient user={user} />
        </div>
      )}

      {/* Feature Comparison */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Feature Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Data Table View</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>✅ Compact display of all links</li>
              <li>✅ Advanced filtering and sorting</li>
              <li>✅ Pagination for large datasets</li>
              <li>✅ Column-based organization</li>
              <li>✅ Action buttons in dropdown</li>
              <li>✅ Status badges and indicators</li>
              <li>✅ Better for bulk operations</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Card View</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>✅ Rich visual information</li>
              <li>✅ Easy to scan individual links</li>
              <li>✅ Prominent action buttons</li>
              <li>✅ Better for link details</li>
              <li>✅ Mobile-friendly layout</li>
              <li>✅ Contextual information display</li>
              <li>✅ More accessible for users</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg
            className="h-5 w-5 text-amber-600 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-amber-900">
              Implementation Notes
            </h4>
            <div className="text-sm text-amber-800 mt-1">
              <ul className="space-y-1">
                <li>
                  • The data table uses the same API endpoints as the current
                  implementation
                </li>
                <li>
                  • All existing functionality (pause/archive actions) is
                  preserved
                </li>
                <li>
                  • The component can be easily integrated into the main links
                  page
                </li>
                <li>
                  • Responsive design ensures it works on all screen sizes
                </li>
                <li>
                  • Future enhancements: advanced filtering, column
                  customization, export features
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
