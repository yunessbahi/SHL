"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import type { SafeUser } from "@/lib/getSafeSession";

interface LinkData {
  short_url: string;
  target_url: string;
  expires_at: string | null;
  created_at: string;
}

export default function DashboardPage({ user }: { user: SafeUser }) {
  const [url, setUrl] = useState("");
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const loadLinks = async () => {
    try {
      const res = await authFetch("/api/links/");
      if (res.ok) {
        const data = await res.json();
        setLinks(data);
      } else {
        const text = await res.text();
        console.error("Failed to load links:", res.status, text);
      }
    } catch (err) {
      console.error("Failed to load links:", err);
    }
  };

  /*  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };*/

  const createLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError("");

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const campaignId = urlParams.get("campaign");

      const payload: any = { target_url: url };
      if (campaignId) {
        payload.campaign_id = parseInt(campaignId);
      }

      const res = await authFetch("/api/links/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setLinks((prev) => [data, ...prev]);
        setUrl("");
      } else {
        const text = await res.text();
        console.error("Create link error:", res.status, text);
        try {
          const errorData = JSON.parse(text);
          setError(errorData.detail || "Failed to create link");
        } catch {
          setError("Failed to create link");
        }
      }
    } catch (err) {
      setError("Failed to create link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (shortUrl: string) => {
    await navigator.clipboard.writeText(shortUrl);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Load links on mount
  useEffect(() => {
    loadLinks();
  }, []);

  return (
    <div className="min-h-screen ">
      {/* Header */}
      {/*      <header className=" shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SL</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Linker
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>*/}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className=" p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Links</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {links.length}
                </p>
              </div>
            </div>
          </div>

          <div className=" p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Links
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {links.filter((link) => !isExpired(link.expires_at)).length}
                </p>
              </div>
            </div>
          </div>

          <div className=" p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Expired Links
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {links.filter((link) => isExpired(link.expires_at)).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Link Form */}
        <div className=" p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Create New Link
            {(() => {
              const urlParams = new URLSearchParams(window.location.search);
              const campaignId = urlParams.get("campaign");
              return campaignId ? ` for Campaign #${campaignId}` : "";
            })()}
          </h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={createLink} className="flex gap-4">
            <div className="flex-1">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL to shorten..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Link"}
            </button>
          </form>
        </div>

        {/* Links List */}
        <div className=" rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Links</h2>
          </div>

          {links.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <p>No links created yet. Create your first link above!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {links.map((link) => (
                <div key={link.short_url} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {link.short_url}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            → {link.target_url}
                          </p>
                        </div>
                        {isExpired(link.expires_at) && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Expired
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Created: {formatDate(link.created_at)}</span>
                        {link.expires_at && (
                          <span>Expires: {formatDate(link.expires_at)}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(link.short_url)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Copy link"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                      <a
                        href={link.short_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Open link"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
