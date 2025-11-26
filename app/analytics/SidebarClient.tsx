"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChartNoAxesCombinedIcon,
  Target,
  TrendingUp,
  Search,
} from "lucide-react";

// Sidebar Item Component
interface SidebarItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  href,
  icon: Icon,
  children,
}) => {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/analytics" && pathname.startsWith(href));

  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </a>
  );
};

// Sidebar Section Component
interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
};

// Sidebar Component
const Sidebar: React.FC = React.memo(() => {
  return (
    <div className="flex flex-col border-r bg-background w-52 sticky top-0">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 pr-4 space-y-6">
        <SidebarSection title="Analytics">
          <SidebarItem href="/analytics" icon={ChartNoAxesCombinedIcon}>
            Overview
          </SidebarItem>
          <SidebarItem href="/analytics/campaigns" icon={Target}>
            Campaign Analytics
          </SidebarItem>
          <SidebarItem href="/analytics/links" icon={TrendingUp}>
            Link Analytics
          </SidebarItem>
          <SidebarItem href="/analytics/explore" icon={Search}>
            Custom Explore
          </SidebarItem>
        </SidebarSection>
      </div>
    </div>
  );
});

export default Sidebar;
