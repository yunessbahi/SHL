"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import SidebarItem from "./SidebarItem";
import SidebarSection from "./SidebarSection";
import SidebarFooter from "./SidebarFooter";
import {
  LayoutDashboard,
  Link as LinkIcon,
  Megaphone,
  Users,
  Settings,
  Target,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <LinkIcon className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Smart Link Hub</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
          >
            {collapsed ? (
              <Menu className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <SidebarSection title="Main" collapsed={collapsed}>
            <SidebarItem
              href="/dashboard"
              icon={LayoutDashboard}
              collapsed={collapsed}
            >
              Dashboard
            </SidebarItem>
            <SidebarItem href="/links" icon={LinkIcon} collapsed={collapsed}>
              Links
            </SidebarItem>
          </SidebarSection>

          <SidebarSection title="Marketing" collapsed={collapsed}>
            <SidebarItem
              href="/campaigns"
              icon={Megaphone}
              collapsed={collapsed}
            >
              Campaigns
            </SidebarItem>
            <SidebarItem href="/groups" icon={Users} collapsed={collapsed}>
              Groups
            </SidebarItem>
            <SidebarItem
              href="/utm-templates"
              icon={Target}
              collapsed={collapsed}
            >
              UTM Templates
            </SidebarItem>
          </SidebarSection>

          <SidebarSection title="Settings" collapsed={collapsed}>
            <SidebarItem href="/settings" icon={Settings} collapsed={collapsed}>
              Settings
            </SidebarItem>
          </SidebarSection>
        </div>

        {/* Footer */}
        <SidebarFooter collapsed={collapsed} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
