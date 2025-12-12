"use client";

import {
  Activity,
  BarChart3,
  BellIcon,
  CheckCheck,
  FlagTriangleRight,
  LinkIcon,
  Settings,
} from "lucide-react";

import { formatNotificationTime } from "@/lib/api/notifications";
import { useEffect, useState } from "react";
import { useNotificationStore } from "../../../lib/stores/notification-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// CATEGORY TYPES
export type NotificationCategory =
  | "links"
  | "campaigns"
  | "system"
  | "activities"
  | "insights";

// CATEGORY ICONS
const categoryIcons: Record<NotificationCategory, any> = {
  links: LinkIcon,
  campaigns: FlagTriangleRight,
  system: Settings,
  activities: Activity,
  insights: BarChart3,
};

export default function NotificationCenter({
  unread,
  isDark,
}: {
  unread: number;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationCategory | null>(null);

  const {
    notifications,
    unreadByCategory,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  // Keyboard shortcut CMD+N
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Close notification center on theme change
  useEffect(() => {
    setOpen(false);
  }, [isDark]);

  const filteredItems = filter
    ? notifications.filter((n) => n.category === filter)
    : notifications;

  const unreadItems = filteredItems.filter((n) => !n.is_read);
  const readItems = filteredItems.filter((n) => n.is_read);

  // Use unread counts from API instead of calculating from items
  const categoryCounts = unreadByCategory;
  const totalUnreadCount = unread;

  return (
    <div>
      {/* NOTIFICATION BUTTON */}
      <Button
        onClick={() => setOpen(true)}
        className="relative"
        size="sm"
        variant="outline"
      >
        <BellIcon />
        <Badge className="-top-1 -right-2 absolute z-10 h-5 min-w-5 rounded-full px-1 text-xs">
          {unread}
        </Badge>
      </Button>

      {/* COMMAND MENU DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader className="sr-only">
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>Your notification center</DialogDescription>
        </DialogHeader>

        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <div className="flex h-[500px]">
            {/* SIDEBAR FILTERS */}
            <div className="w-48 border-r bg-muted/30 p-2 flex flex-col gap-1">
              {[
                { id: null, label: "All", icon: BellIcon },
                { id: "links", label: "Links", icon: LinkIcon },
                {
                  id: "campaigns",
                  label: "Campaigns",
                  icon: FlagTriangleRight,
                },
                { id: "system", label: "System", icon: Settings },
                { id: "activities", label: "Activities", icon: Activity },
                { id: "insights", label: "Insights", icon: BarChart3 },
              ].map((f) => {
                const active =
                  filter === f.id || (f.id === null && filter === null);
                const Icon = f.icon;
                const count =
                  f.id === null
                    ? totalUnreadCount
                    : categoryCounts[f.id as string] || 0;

                return (
                  <Button
                    key={f.label}
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    className="justify-between h-8 text-xs w-full px-3"
                    onClick={() => setFilter(f.id as any)}
                  >
                    <div className="flex items-center">
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{f.label}</span>
                    </div>
                    {count > 0 && (
                      <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                        {count}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>

            {/* NOTIFICATION LIST */}
            <Command className="flex-1">
              {/* Header */}
              <div className="flex items-center justify-between border-b px-3 py-2">
                <div className="flex items-center gap-2">
                  <BellIcon className="h-4 w-4" />
                  <span className="font-medium">Notifications</span>
                  {unread > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unread} new
                    </Badge>
                  )}
                </div>

                <div className="mr-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={markAllAsRead}
                    disabled={unread === 0}
                  >
                    <CheckCheck className="mr-1 h-3 w-3" />
                    Mark all read
                  </Button>
                </div>
              </div>

              <CommandList className="max-h-[450px]">
                <CommandEmpty>No notifications.</CommandEmpty>

                {unreadItems.length > 0 && (
                  <CommandGroup heading="New">
                    {unreadItems.map((n) => {
                      const Icon = categoryIcons[n.category];
                      return (
                        <CommandItem
                          key={n.id}
                          onSelect={() => markAsRead(n.id)}
                          className="py-3 min-w-0"
                        >
                          <div className="relative mr-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>

                            <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary" />
                          </div>

                          <div className="flex-1 min-w-0 space-y-0.5">
                            <p className="text-sm font-medium break-words whitespace-normal">
                              {n.title}
                            </p>

                            <p className="text-xs text-muted-foreground break-words whitespace-normal line-clamp-2">
                              {n.message}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {formatNotificationTime(n.created_at)}
                            </p>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}

                {readItems.length > 0 && (
                  <CommandGroup heading="Earlier">
                    {readItems.map((n) => {
                      const Icon = categoryIcons[n.category];
                      return (
                        <CommandItem
                          key={n.id}
                          className="py-3 opacity-60 min-w-0" // <-- Important
                        >
                          {/* Icon */}
                          <div className="mr-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>

                          {/* Text Container */}
                          <div className="flex-1 min-w-0 space-y-0.5">
                            {" "}
                            {/* <-- Important */}
                            <p className="text-sm break-words whitespace-normal">
                              {n.title}
                            </p>
                            <p className="text-xs text-muted-foreground break-words whitespace-normal line-clamp-2">
                              {n.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatNotificationTime(n.created_at)}
                            </p>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}

                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => console.log("Settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Notification settings
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
