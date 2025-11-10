/*
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">SL</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        <div className=" py-8 px-6 shadow rounded-lg">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleEmailLogin}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2  text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm  text-sm font-medium text-gray-500 hover: disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
*/

// app/auth/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

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
      <div className="max-w-md w-full space-y-8 p-6 rounded-lg shadow">
        <h2 className="text-center text-3xl font-bold">Sign in</h2>
        {error && <div className="text-red-600">{error}</div>}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-3 py-2 border rounded"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-3 py-2 border rounded"
          />
          <button
            type="submit"
            disabled={emailLoading}
            className="w-full py-2 bg-indigo-600 text-white rounded"
          >
            {emailLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full py-2 mt-2 border rounded"
        >
          {googleLoading ? "Signing in..." : "Sign in with Google"}
        </button>
        <p className="text-center mt-4">
          Or{" "}
          <Link
            href={`/auth/signup?redirectedFrom=${encodeURIComponent(redirectedFrom)}`}
            className="text-indigo-600"
          >
            create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
