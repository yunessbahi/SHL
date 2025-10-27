"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authFetch } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import TagModal from "@/app/components/TagModal";

interface Tag {
  id: number;
  tag_name: string;
  color: string;
  description?: string;
  created_at?: string;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Modal State
  const [tagModalState, setTagModalState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    tag?: Tag;
  }>({ open: false, mode: "create" });

  // Check authentication on mount
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/login?redirectedFrom=/tags");
        return;
      }
      setAuthLoading(false);
    };
    checkUser();
  }, [router, supabase]);

  // Fetch all tags
  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      const res = await authFetch("/api/tags/");
      if (res.ok) setTags(await res.json());
      setLoading(false);
    };
    fetchTags();
  }, []);

  const refreshTags = async () => {
    const res = await authFetch("/api/tags/");
    if (res.ok) setTags(await res.json());
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;
    const response = await authFetch(`/api/tags/${tagId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      await refreshTags();
    }
  };

  // Prevent flash by not rendering anything until auth is checked
  if (authLoading) {
    return null;
  }

  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Spinner className="size-6 mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        <Button
          onClick={() => setTagModalState({ open: true, mode: "create" })}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tags.map((tag) => (
          <Card key={tag.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: tag.color }}
                    />
                    <h3 className="font-semibold text-lg truncate">
                      {tag.tag_name}
                    </h3>
                  </div>
                  {tag.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {tag.description}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        setTagModalState({
                          open: true,
                          mode: "edit",
                          tag: tag,
                        })
                      }
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Tag
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteTag(tag.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Tag
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-muted-foreground">
                Created{" "}
                {tag.created_at
                  ? new Date(tag.created_at).toLocaleDateString()
                  : ""}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tag Modal */}
      <TagModal
        open={tagModalState.open}
        onOpenChange={(open) => {
          if (!open) {
            setTagModalState({ open: false, mode: "create" });
          }
        }}
        initialData={
          tagModalState.mode === "edit" ? tagModalState.tag : undefined
        }
        onSave={async (values) => {
          if (tagModalState.mode === "edit" && tagModalState.tag) {
            await authFetch(`/api/tags/${tagModalState.tag.id}`, {
              method: "PATCH",
              body: JSON.stringify(values),
            });
          } else {
            await authFetch("/api/tags/", {
              method: "POST",
              body: JSON.stringify(values),
            });
          }
          await refreshTags();
          setTagModalState({ open: false, mode: "create" });
        }}
      />
    </div>
  );
}
