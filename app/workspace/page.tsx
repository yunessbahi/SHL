"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/spinner";

export default function Workspace() {
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Check authentication on mount
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Middleware should handle this, but fallback just in case
        router.replace("/auth/login?redirectedFrom=/workspace");
        return;
      }
      setAuthLoading(false);
    };
    checkUser();
  }, [router, supabase]);

  // Prevent flash by not rendering anything until auth is checked
  if (authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen ">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className=" p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-semibold  mb-4">Workspace</h1>
          <p className="text-gray-600">
            Welcome to your workspace. This is where you can manage your
            projects and collaborate.
          </p>
          {/* Add more content here as needed */}
        </div>
      </main>
    </div>
  );
}
