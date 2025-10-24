"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  Workflow,
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

interface HeaderProps {
  children: React.ReactNode;
  items?: { title: string };
}

export default function Header({ children, items }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

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

  // Remove unused variables

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getInitials = (email: string) => {
    return email.split("@")[0].slice(0, 2).toUpperCase();
  };

  const getBreadcrumbItems = () => {
    const pathSegments = pathname.split("/").filter(Boolean);
    const items = [];

    // Add Dashboard as first item if not on dashboard
    if (pathname !== "/workspace") {
      items.push({
        label: "Workspace",
        title: "Workspace",
        href: "/workspace",
        icon: Workflow,
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
          icon = Workflow;
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
        isFirst: index === 0 && pathname === "/workspace",
      });
    });

    return items;
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

  // Show loading state initially, then check auth
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="flex items-center justify-between px-6 py-3 border-b bg-card">
          <div className="flex items-center space-x-4">
            <div className="w-[300px] h-10 bg-muted rounded animate-pulse" />
          </div>
          <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    );
  }

  // If on root page or not authenticated, don't show header
  if (pathname === "/" || !user) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b ">
        {/* Left side - Breadcrumb */}
        <div className="flex flex-col">
          <h1 className={"font-black"}>
            {items?.title ||
              getBreadcrumbItems()[getBreadcrumbItems().length - 1]?.title ||
              "Workflow"}
          </h1>
          <Breadcrumb className={""}>
            <BreadcrumbList className={"text-xs"}>
              {getBreadcrumbItems().map((item, index) => (
                <React.Fragment key={item.href}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {index === getBreadcrumbItems().length - 1 ? (
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
              ))}
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
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
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
