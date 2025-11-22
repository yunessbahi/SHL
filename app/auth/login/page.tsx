// app/auth/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/app/components/auth/login-form";

function getSafeRedirect(redirectedFrom: string | null): string {
  if (!redirectedFrom) return "/dashboard";

  // Decode URI component if encoded
  try {
    redirectedFrom = decodeURIComponent(redirectedFrom);
  } catch {
    return "/dashboard";
  }

  // Trim whitespace
  redirectedFrom = redirectedFrom.trim();

  // Validate it's a safe relative path
  if (!redirectedFrom.startsWith("/")) return "/dashboard";
  if (redirectedFrom.includes("://")) return "/dashboard";
  if (redirectedFrom.startsWith("//")) return "/dashboard";

  // Whitelist allowed paths to prevent open redirect
  const allowedPaths = [
    "/dashboard",
    "/campaigns",
    "/links",
    "/groups",
    "/settings",
    "/tags",
    "/utm-templates",
    "/workspace",
  ];

  if (!allowedPaths.some((path) => redirectedFrom.startsWith(path))) {
    return "/dashboard";
  }

  return redirectedFrom;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const redirectedFrom = getSafeRedirect(searchParams.get("redirectedFrom"));

  useEffect(() => {
    // Check for existing session on mount
    const checkInitialSession = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (user) {
        router.replace(redirectedFrom);
      } else {
        setIsCheckingAuth(false);
      }
    };
    checkInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle multiple auth events that indicate successful authentication
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session) {
        router.replace(redirectedFrom);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase, redirectedFrom]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) setError(error.message);
      else {
        router.replace(redirectedFrom);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${redirectedFrom}`,
        },
      });

      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch {
      setError("An unexpected error occurred");
      setGoogleLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 p-6 rounded-lg shadow">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-h-screen flex items-center justify-center p-4">
      <LoginForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        emailLoading={emailLoading}
        googleLoading={googleLoading}
        error={error}
        handleEmailLogin={handleEmailLogin}
        handleGoogleLogin={handleGoogleLogin}
        redirectedFrom={redirectedFrom}
      />
    </div>
  );
}
