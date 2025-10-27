"use client";
import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { SafeUser } from "@/lib/getSafeSession";

interface LinksPageProps {
  user: SafeUser;
}

export default function LinksPage({ user }: LinksPageProps) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const res = await authFetch("/api/links/");
      if (res.ok) setItems(await res.json());
    })();
  }, []);

  // Authentication is now handled by the server component

  return (
    <div className="">
      <div className=" rounded border">
        <table className="w-full text-sm">
          <thead>
            <tr className=" text-left">
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
