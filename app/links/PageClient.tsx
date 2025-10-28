"use client";
import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { SafeUser } from "@/lib/getSafeSession";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Target, Calendar, ExternalLink } from "lucide-react";

interface LinksPageProps {
  user: SafeUser;
}

export default function LinksPage({ user }: LinksPageProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/api/links/");
        if (res.ok) setItems(await res.json());
      } catch (error) {
        console.error("Failed to load links:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Authentication is now handled by the server component

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-18" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="rounded border">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
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
                        href={`/workspace/edit/${l.id}`}
                        className="text-indigo-600 underline"
                      >
                        Edit
                      </Link>
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {items.map((l: any) => (
          <Card key={l.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-indigo-600 truncate">
                    {l.short_url}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {l.link_type === "smart" ? "Smart" : "Single"}
                  </Badge>
                </div>

                <div className="text-sm text-gray-600 truncate">
                  {l.target_url}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {l.expires_at
                      ? new Date(l.expires_at).toLocaleDateString()
                      : "No expiry"}
                  </div>
                  <div>
                    Created {new Date(l.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/workspace/edit/${l.id}`}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/links/${l.id}/targets`}>
                      <Target className="h-3 w-3 mr-1" />
                      Targets
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/links/${l.id}/preview`}>
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
