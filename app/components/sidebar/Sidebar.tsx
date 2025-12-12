"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import SidebarItem from "./SidebarItem";
import { createClient } from "@/lib/supabase/client";
import {
  Link as LinkIcon,
  Settings,
  FlaskConical,
  ChartSpline,
} from "lucide-react";
import type { SafeUser } from "@/lib/getSafeSession";

interface SidebarProps {
  children: React.ReactNode;
  hasSession?: boolean;
  user?: SafeUser | null;
}

export default function Sidebar({
  children,
  hasSession = false,
  user: propUser,
}: SidebarProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(hasSession);
  const pathname = usePathname();
  const supabase = createClient();

  // Public routes that don't need sidebar
  const publicRoutes = ["/", "/auth/login", "/auth/signup", "/demo"];

  // If user is passed as prop, use it and skip client-side fetching
  useEffect(() => {
    if (propUser !== undefined) {
      setIsAuthenticated(!!propUser);
      return;
    }

    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    console.log("[DEBUG] Sidebar: Setting up auth state listener");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[DEBUG] Sidebar: Auth state change", {
        event,
        hasSession: !!session,
      });
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, [supabase, propUser]);

  // Exact match for root, startsWith for others
  const isPublicRoute =
    pathname === "/" ||
    publicRoutes.slice(1).some((route) => pathname.startsWith(route));

  // Show sidebar only when authenticated AND not on public route
  const shouldShowSidebar = isAuthenticated && !isPublicRoute;

  // If no sidebar needed, just render children
  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  // For protected routes, render sidebar
  // Middleware ensures only authenticated users reach here
  return (
    <div className="flex h-screen  m-0 p-0">
      {/* Sidebar */}
      <div className="flex flex-col border-r bg-background w-16">
        {/* Header */}
        <div className="flex items-center justify-center p-4 border-b">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <LinkIcon className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto my-4 px-2 space-y-2">
          <SidebarItem href="/workspace" icon={FlaskConical}>
            Workspace
          </SidebarItem>
          <SidebarItem href="/analytics" icon={ChartSpline}>
            Analytics
          </SidebarItem>
        </div>

        {/* Footer */}
        <div className="border-t p-3">
          <SidebarItem href="/settings" icon={Settings}>
            Settings
          </SidebarItem>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="">{children}</div>
      </div>
    </div>
  );
}
