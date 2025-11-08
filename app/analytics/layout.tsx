import { Metadata } from "next";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { BarChart3, TrendingUp, Target, Search, Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics - Smart Link Hub",
  description: "Analytics dashboard for your link and campaign performance",
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="flex">
        <aside className="pr-6 border-r">
          <div className="pb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analytics
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track your link performance
            </p>
          </div>
          <div className=" pb-4">
            <nav className="space-y-1">
              <Link
                href="/analytics"
                className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <BarChart3 className="mr-3 h-4 w-4 flex-shrink-0" />
                Overview
              </Link>
              <Link
                href="/analytics/campaigns"
                className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <Target className="mr-3 h-4 w-4 flex-shrink-0" />
                Campaign Analytics
              </Link>
              <Link
                href="/analytics/links"
                className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <TrendingUp className="mr-3 h-4 w-4 flex-shrink-0" />
                Link Analytics
              </Link>
              <Link
                href="/analytics/explore"
                className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <Search className="mr-3 h-4 w-4 flex-shrink-0" />
                Custom Explore
              </Link>
            </nav>

            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="px-3">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quick Actions
                </h3>
                <div className="mt-2 space-y-1">
                  <button className="group flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white">
                    <Activity className="mr-2 h-3 w-3" />
                    Real-time Feed
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
        <main className="flex-1">
          <div className="px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
