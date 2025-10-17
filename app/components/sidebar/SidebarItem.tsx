"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  collapsed?: boolean;
}

export default function SidebarItem({
  href,
  icon: Icon,
  children,
  collapsed,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon className="h-4 w-4" />
      {!collapsed && <span>{children}</span>}
    </Link>
  );
}
