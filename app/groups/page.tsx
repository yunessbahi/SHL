"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/app/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { authFetch } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";

interface Group {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
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
        router.push("/auth/login?redirectedFrom=/groups");
        return;
      }
      setAuthLoading(false);
    };
    checkUser();
  }, [router, supabase]);

  const loadGroups = async () => {
    try {
      const response = await authFetch("/api/groups/");
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error("Failed to load groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const url = editingGroup
        ? `/api/groups/${editingGroup.id}`
        : "/api/groups/";
      const method = editingGroup ? "PATCH" : "POST";

      const response = await authFetch(url, {
        method,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadGroups();
        setShowForm(false);
        setEditingGroup(null);
        setFormData({ name: "", description: "" });
      }
    } catch (error) {
      console.error("Failed to save group:", error);
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({ name: group.name, description: group.description });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this group?")) return;

    try {
      const response = await authFetch(`/api/groups/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await loadGroups();
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingGroup(null);
    setFormData({ name: "", description: "" });
  };

  if (authLoading || loading) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {/*<h1 className="text-3xl font-bold">Groups</h1>
          <p className="text-muted-foreground">
            Organize your links into groups for better management and analytics.
          </p>*/}
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Group
        </Button>
      </div>

      {showForm && (
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">
            {editingGroup ? "Edit Group" : "Create New Group"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter group name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter group description"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">
                {editingGroup ? "Update Group" : "Create Group"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No groups created yet.</p>
            <Button onClick={() => setShowForm(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Group
            </Button>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="bg-card p-6 rounded-lg border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{group.name}</h3>
                  {group.description && (
                    <p className="text-muted-foreground mt-1">
                      {group.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    Created {new Date(group.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(group)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(group.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
