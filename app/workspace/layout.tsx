import React from "react";
import Sidebar from "./SidebarClient";

export const metadata = {
  title: "Workspace - Linker",
  description: "Your space for managing and creating links, templates and more",
};

// Main Layout Component
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
