"use client";

import { ThemeToggle } from "@/app/components/ui/theme-toggle";
import CommandMenu13 from "@/components/blocks/command-menu/command-menu-notifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import type { SafeUser } from "@/lib/getSafeSession";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3,
  ChartSpline,
  FlaskConical,
  FolderTree,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Megaphone,
  Search,
  SearchIcon,
  Settings,
  Sparkles,
  Tag as TagIcon,
  Target,
  User,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNotificationPolling } from "../../lib/hooks/useNotificationPolling";
import { useNotificationStore } from "../../lib/stores/notification-store";

interface HeaderProps {
  children: React.ReactNode;
  items?: { title: string };
  user?: SafeUser | null;
}

const HeaderComponent = ({ children, items, user: propUser }: HeaderProps) => {
  useNotificationPolling();

  const unread = useNotificationStore((s) => s.unreadCount);
  const { theme } = useTheme();

  const [user, setUser] = useState<any>(propUser || null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();

  // Command menu keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSignOut = useCallback(async () => {
    console.log("[DEBUG] Header: Sign out initiated");
    try {
      const { error } = await supabase.auth.signOut();
      console.log("[DEBUG] Header: Sign out result", { error: error?.message });
      router.push("/");
    } catch (err) {
      console.error("[DEBUG] Header: Error during sign out", err);
    }
  }, [supabase, router]);

  const getInitials = (email: string) => {
    return email.split("@")[0].slice(0, 2).toUpperCase();
  };

  const getBreadcrumbItems = useMemo(() => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const items = [];

    // Add Workspace as first item if not on workspace
    if (
      pathSegments.length > 0 &&
      pathSegments[0] !== "workspace" &&
      pathSegments[0] !== "analytics" &&
      pathSegments[0] !== "settings"
    ) {
      items.push({
        label: "Workspace",
        title: "Workspace",
        href: "/workspace",
        icon: FlaskConical,
        isFirst: true,
      });
    }

    // Map path segments to breadcrumb items
    pathSegments.forEach((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 1).join("/");
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      let icon = null;
      let title = null;

      // Add icons for main sections
      switch (segment) {
        case "workspace":
          icon = FlaskConical;
          title = "Workspace";
          break;
        case "dashboard":
          icon = LayoutDashboard;
          title = "Dashboard";
          break;
        case "links":
          icon = LinkIcon;
          title = "Links";
          break;
        case "campaigns":
          icon = Megaphone;
          title = "Campaigns";
          break;
        case "groups":
          icon = Users;
          title = "Groups";
          break;
        case "utm-templates":
          icon = Target;
          title = "UTM Templates";
          break;
        case "settings":
          icon = Settings;
          title = "Settings";
          break;
        case "analytics":
          icon = ChartSpline;
          title = "Analytics";
          break;
        case "explore":
          icon = Search;
          title = "Explore";
          break;
        case "tags":
          icon = Users;
          title = "Tags";
          break;
      }

      // Handle dynamic segments (like [id])
      if (segment.match(/^\[.*\]$/)) {
        label = "Details";
        icon = null; // No icon for subsections
      }

      items.push({
        label,
        href,
        icon,
        title,
        isFirst: index === 0,
      });
    });

    return items;
  }, [pathname]);

  const getPageTitle = () => {
    if (pathname.startsWith("/workspace/create")) {
      const type = searchParams.get("type");
      if (type === "smart") return "Create Smart Link";
      if (type === "single") return "Create Single Link";
      return "Create Link";
    }
    if (pathname.startsWith("/workspace/edit/")) {
      return "Edit Link";
    }
    return null;
  };

  const quickActions = [
    {
      title: "New Single Link",
      description: "Create a simple short link with custom slug",
      href: "/workspace/create?type=single",
      icon: LinkIcon,
    },
    {
      title: "New Smart Link",
      description: "Create intelligent links with device and geo-targeting",
      href: "/workspace/create?type=smart",
      icon: Sparkles,
    },
    {
      title: "New Campaign",
      description: "Set up a marketing campaign with tracking",
      href: "/campaigns/create",
      icon: Megaphone,
    },
    {
      title: "New UTM Template",
      description: "Create reusable UTM parameter templates",
      href: "/utm-templates/create",
      icon: BarChart3,
    },
    {
      title: "Create Group",
      description: "Organize links into custom groups",
      href: "/groups/create",
      icon: FolderTree,
    },
    {
      title: "Create Tag",
      description: "Add tags to categorize and filter links",
      href: "/tags/create",
      icon: TagIcon,
    },
  ];

  const searchItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Links",
      href: "/links",
      icon: LinkIcon,
    },
    {
      title: "Campaigns",
      href: "/campaigns",
      icon: Megaphone,
    },
    {
      title: "Groups",
      href: "/groups",
      icon: Users,
    },
    {
      title: "UTM Templates",
      href: "/utm-templates",
      icon: Target,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  // Public routes that don't need authentication
  const publicRoutes = ["/", "/auth/login", "/auth/signup", "/demo"];

  // If user is passed as prop, use it and skip client-side fetching
  useEffect(() => {
    if (propUser !== undefined) {
      setUser(propUser);
      return;
    }

    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user || null);
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        // Loading state removed
      }
    };

    checkAuth();

    // Listen for auth changes
    console.log("[DEBUG] Header: Setting up auth state listener");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[DEBUG] Header: Auth state change", {
        event,
        hasSession: !!session,
      });
      if (session) {
        // Use getUser() to get fresh user data for UI display
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user || null);
      } else {
        setUser(null);
      }
      // Loading state removed
    });

    return () => subscription.unsubscribe();
  }, [supabase, propUser]);

  // Don't show header on public routes
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // If not authenticated, don't show header
  if (!user) {
    return <>{children}</>;
  }

  return (
    // h-screen
    <div className="flex flex-col ">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b">
        {/* Left side - Breadcrumb */}
        <div className="flex flex-col">
          <h1 className={"text-xl font-black"}>
            {items?.title ||
              getPageTitle() ||
              getBreadcrumbItems[getBreadcrumbItems.length - 1]?.title ||
              "Workspace"}
          </h1>
          <Breadcrumb className={""}>
            <BreadcrumbList className={"text-xs"}>
              {(() => {
                const breadcrumbItems = getBreadcrumbItems.slice(0, -1);
                return breadcrumbItems.map((item: any, index: number) => (
                  <React.Fragment key={`${item.href}-${index}`}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {index === breadcrumbItems.length - 1 ? (
                        <BreadcrumbPage className="flex items-center gap-2">
                          {item.icon && item.isFirst && (
                            <item.icon className="h-3 w-3" />
                          )}
                          {item.title}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href={item.href}
                          className="flex items-center gap-2"
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(item.href);
                          }}
                        >
                          {item.icon && item.isFirst && (
                            <item.icon className="h-3 w-3" />
                          )}
                          {item.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ));
              })()}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right side - Theme Toggle, Search Command and User Avatar */}
        <div className="flex items-center space-x-0">
          {/* Search Command */}
          <InputGroup onClick={() => setOpen(true)}>
            <InputGroupInput placeholder="Search..." />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <Kbd className="bg-border">⌘</Kbd>
              <Kbd className="bg-border">K</Kbd>
            </InputGroupAddon>
          </InputGroup>
          {/* Theme Toggle */}
          <div className="">
            <ThemeToggle />
          </div>
          <CommandMenu13 unread={unread} isDark={theme === "dark"} />
          {/* User Avatar Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.user_metadata?.avatar_url}
                    alt={user?.email}
                  />
                  <AvatarFallback>
                    {getInitials(user?.email || "")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Account</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Quick Actions Group */}
          <CommandGroup heading="Quick Actions">
            {quickActions.map((item) => (
              <CommandItem
                className="bg-popover"
                key={item.href}
                onSelect={() => {
                  router.push(item.href);
                  setOpen(false);
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{item.title}</span>
                  <span className="text-muted-foreground text-xs">
                    {item.description}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          {/* Navigation Group */}
          <CommandGroup heading="Navigation">
            {searchItems.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  router.push(item.href);
                  setOpen(false);
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-0">{children}</div>
      </div>
    </div>
  );
};

export default React.memo(HeaderComponent);
