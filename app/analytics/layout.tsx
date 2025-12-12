import React from "react";
import Sidebar from "./SidebarClient";

export const metadata = {
  title: "Analytics - Linker",
  description: "Analytics dashboard for your link and campaign performance",
};

// Main Layout Component
export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden scrollbar-hide">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden scrollbar-hide">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 pr-0 scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
}
