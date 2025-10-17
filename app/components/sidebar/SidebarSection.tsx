"use client";

import { cn } from "@/lib/utils";

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  collapsed?: boolean;
}

export default function SidebarSection({
  title,
  children,
  collapsed,
}: SidebarSectionProps) {
  return (
    <div className="space-y-1">
      {!collapsed && (
        <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h2>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}
