"use client";

import { Button } from "@/app/components/ui/button";
import { LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SidebarFooterProps {
  collapsed?: boolean;
}

export default function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    console.log("[DEBUG] SidebarFooter: Sign out initiated");
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signOut();
      console.log("[DEBUG] SidebarFooter: Sign out result", {
        error: error?.message,
      });
      router.push("/auth/login");
    } catch (err) {
      console.error("[DEBUG] SidebarFooter: Error during sign out", err);
    }
  };

  return (
    <div className="border-t p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="flex-1">
            <p className="text-sm font-medium">User</p>
            <p className="text-xs text-muted-foreground">user@example.com</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="h-8 w-8"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
