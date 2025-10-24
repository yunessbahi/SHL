"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { authFetch } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";

export default function LinksPage() {
  const [items, setItems] = useState<any[]>([]);
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
        router.push("/auth/login?redirectedFrom=/links");
        return;
      }
      setAuthLoading(false);
    };
    checkUser();
  }, [router, supabase]);

  useEffect(() => {
    (async () => {
      const res = await authFetch("/api/links/");
      if (res.ok) setItems(await res.json());
    })();
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner className="size-6 mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="bg-white rounded border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2">Short URL</th>
              <th className="p-2">Target URL</th>
              <th className="p-2">Expires</th>
              <th className="p-2">Created</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l: any) => (
              <tr key={l.id} className="border-t">
                <td className="p-2 text-indigo-600">{l.short_url}</td>
                <td className="p-2">{l.target_url}</td>
                <td className="p-2">
                  {l.expires_at
                    ? new Date(l.expires_at).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-2">
                  {new Date(l.created_at).toLocaleDateString()}
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <Link
                      href={`/links/${l.id}/targets`}
                      className="text-indigo-600 underline"
                    >
                      Targets
                    </Link>
                    <Link
                      href={`/links/${l.id}/preview`}
                      className="text-indigo-600 underline"
                    >
                      Preview
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
