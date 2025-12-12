"use client";

import {
  Bell,
  CheckCheck,
  MessageSquare,
  Settings,
  Star,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Kbd } from "@/components/ui/kbd";

interface Notification {
  id: string;
  type: "mention" | "comment" | "follow" | "like" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
  avatar?: string;
  userName?: string;
}

const notifications: Notification[] = [
  {
    id: "1",
    type: "mention",
    title: "Sarah mentioned you",
    message: "in Design System Updates thread",
    time: "2 min ago",
    read: false,
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    userName: "Sarah Chen",
  },
  {
    id: "2",
    type: "comment",
    title: "New comment on your post",
    message: 'Alex replied: "Great work on this!"',
    time: "15 min ago",
    read: false,
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    userName: "Alex Kim",
  },
  {
    id: "3",
    type: "follow",
    title: "New follower",
    message: "Jordan started following you",
    time: "1 hour ago",
    read: false,
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    userName: "Jordan Lee",
  },
  {
    id: "4",
    type: "like",
    title: "Your post was liked",
    message: "5 people liked your recent post",
    time: "2 hours ago",
    read: true,
  },
  {
    id: "5",
    type: "system",
    title: "Weekly digest ready",
    message: "Your activity summary is available",
    time: "1 day ago",
    read: true,
  },
];

const typeIcons = {
  mention: MessageSquare,
  comment: MessageSquare,
  follow: User,
  like: Star,
  system: Bell,
};

export const title = "React Command Menu Notifications";

export default function CommandMenu13() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(notifications);
  const [filter, setFilter] = useState<string | null>(null);

  const unreadCount = items.filter((n) => !n.read).length;

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

  const markAsRead = (id: string) => {
    setItems(items.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setItems(items.map((n) => ({ ...n, read: true })));
  };

  const filteredItems = filter ? items.filter((n) => n.type === filter) : items;

  const unreadItems = filteredItems.filter((n) => !n.read);
  const readItems = filteredItems.filter((n) => n.read);

  return (
    <div className="">
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="relative"
      >
        <Bell className="mr-2 h-4 w-4" />
        <span>Notifications</span>
        {unreadCount > 0 && (
          <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
            {unreadCount}
          </Badge>
        )}
        <Kbd className="ml-2">⌘N</Kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader className="sr-only">
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>
            View and manage your notifications.
          </DialogDescription>
        </DialogHeader>
        <DialogContent
          className="gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          <Command>
            {/* Header */}
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="font-medium">Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Mark all read
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1 border-b px-3 py-2">
              <Button
                variant={filter === null ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilter(null)}
              >
                All
              </Button>
              <Button
                variant={filter === "mention" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilter("mention")}
              >
                Mentions
              </Button>
              <Button
                variant={filter === "comment" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilter("comment")}
              >
                Comments
              </Button>
              <Button
                variant={filter === "follow" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilter("follow")}
              >
                Follows
              </Button>
            </div>

            <CommandList className="max-h-[350px]">
              <CommandEmpty>No notifications.</CommandEmpty>

              {unreadItems.length > 0 && (
                <CommandGroup heading="New">
                  {unreadItems.map((notification) => {
                    const Icon = typeIcons[notification.type];
                    return (
                      <CommandItem
                        key={notification.id}
                        onSelect={() => markAsRead(notification.id)}
                        className="py-3"
                      >
                        <div className="relative mr-3">
                          {notification.avatar ? (
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={notification.avatar} />
                              <AvatarFallback>
                                {notification.userName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {notification.time}
                          </p>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {readItems.length > 0 && (
                <CommandGroup heading="Earlier">
                  {readItems.map((notification) => {
                    const Icon = typeIcons[notification.type];
                    return (
                      <CommandItem
                        key={notification.id}
                        className="py-3 opacity-60"
                      >
                        <div className="mr-3">
                          {notification.avatar ? (
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={notification.avatar} />
                              <AvatarFallback>
                                {notification.userName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {notification.time}
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
