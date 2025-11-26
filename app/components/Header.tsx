"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Settings,
  LogOut,
  Search,
  LayoutDashboard,
  Link as LinkIcon,
  Megaphone,
  Users,
  Target,
  ChevronRight,
  Slash,
  SearchIcon,
  FlaskConical,
  ChartSpline,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ThemeToggle } from "@/app/components/ui/theme-toggle";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import type { SafeUser } from "@/lib/getSafeSession";

interface HeaderProps {
  children: React.ReactNode;
  items?: { title: string };
  user?: SafeUser | null;
}

export default function Header({
  children,
  items,
  user: propUser,
}: HeaderProps) {
  const [user, setUser] = useState<any>(propUser || null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!propUser);
  const [isDark, setIsDark] = useState(false);
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

  // Theme management
  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem("theme");
    const initialDark = savedTheme === "dark";
    setIsDark(initialDark);
    // Apply to document
    if (initialDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleThemeChange = (value: boolean) => {
    setIsDark(value);
    // Save to localStorage
    localStorage.setItem("theme", value ? "dark" : "light");
    // Apply to document
    if (value) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSignOut = async () => {
    console.log("[DEBUG] Header: Sign out initiated");
    try {
      const { error } = await supabase.auth.signOut();
      console.log("[DEBUG] Header: Sign out result", { error: error?.message });
      router.push("/");
    } catch (err) {
      console.error("[DEBUG] Header: Error during sign out", err);
    }
  };

  const getInitials = (email: string) => {
    return email.split("@")[0].slice(0, 2).toUpperCase();
  };

  const getBreadcrumbItems = () => {
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
  };

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
      setIsLoading(false);
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
        setIsLoading(false);
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
      setIsLoading(false);
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
              getBreadcrumbItems()[getBreadcrumbItems().length - 1]?.title ||
              "Workspace"}
          </h1>
          <Breadcrumb className={""}>
            <BreadcrumbList className={"text-xs"}>
              {(() => {
                const breadcrumbItems = getBreadcrumbItems().slice(0, -1);
                return breadcrumbItems.map((item, index) => (
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
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </InputGroupAddon>
          </InputGroup>
          {/* Theme Toggle */}
          <div className="">
            <ThemeToggle isDark={isDark} onChange={handleThemeChange} />
          </div>

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
}
