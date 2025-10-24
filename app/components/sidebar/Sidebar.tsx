"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";
import SidebarItem from "./SidebarItem";
import SidebarSection from "./SidebarSection";
import SidebarFooter from "./SidebarFooter";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Link as LinkIcon,
  Megaphone,
  Users,
  Settings,
  Target,
  Menu,
  X,
  Workflow,
} from "lucide-react";

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const supabase = createClient();

  // Public routes that don't need authentication
  const publicRoutes = ["/", "/auth/login", "/auth/signup", "/demo"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsAuthenticated(!!session?.user);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Show loading state initially, then check auth
  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        {/* Sidebar skeleton */}
        <div className="flex flex-col border-r bg-card w-64">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex-1 p-4 space-y-6">
            <div className="space-y-2">
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-full bg-muted rounded animate-pulse" />
                <div className="h-8 w-full bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-full bg-muted rounded animate-pulse" />
                <div className="h-8 w-full bg-muted rounded animate-pulse" />
                <div className="h-8 w-full bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        {/* Main content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    );
  }

  // If on root page, don't show sidebar
  if (pathname === "/") {
    return <>{children}</>;
  }

  // If not authenticated, show loading state until auth is determined
  if (!isAuthenticated && !isLoading) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-white m-0 p-0">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r bg-background  transition-all duration-300",
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
              <span className="font-semibold">Linker</span>
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
              href="/workspace"
              icon={Workflow}
              collapsed={collapsed}
            >
              Workspace
            </SidebarItem>
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
        <div className="">{children}</div>
      </div>
    </div>
  );
}
