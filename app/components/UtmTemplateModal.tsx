import React, { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

interface Campaign {
  id: number;
  name: string;
}
interface UTMTemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: any;
  onSave: (values: any) => Promise<void>;
  campaigns: Campaign[];
  loading?: boolean;
}

export function UtmTemplateModal({
  open,
  onOpenChange,
  initialValues,
  onSave,
  campaigns,
  loading,
}: UTMTemplateFormProps) {
  const [form, setForm] = useState({
    name: initialValues?.name || "",
    description: initialValues?.description || "",
    utm_params: initialValues?.utm_params || {
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_term: "",
      utm_content: "",
    },
    is_global: initialValues?.is_global || false,
    campaign_ids: initialValues?.campaign_ids || [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      name: initialValues?.name || "",
      description: initialValues?.description || "",
      utm_params: initialValues?.utm_params || {
        utm_source: "",
        utm_medium: "",
        utm_campaign: "",
        utm_term: "",
        utm_content: "",
      },
      is_global: initialValues?.is_global || false,
      campaign_ids: initialValues?.campaign_ids || [],
    });
  }, [initialValues, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (
      !form.name.trim() ||
      !form.utm_params.utm_source ||
      !form.utm_params.utm_medium ||
      !form.utm_params.utm_campaign
    ) {
      setError("Name, source, medium, and campaign fields are required");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        campaign_ids: form.is_global ? [] : form.campaign_ids,
      });
      setSaving(false);
      onOpenChange(false);
    } catch (err) {
      setError((err as any)?.message || "Save failed");
      setSaving(false);
    }
  };
  const updateUTMParam = (key: string, value: string) => {
    setForm({ ...form, utm_params: { ...form.utm_params, [key]: value } });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialValues ? "Edit UTM Template" : "Create UTM Template"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex items-center gap-2 mb-1">
            <input
              type="checkbox"
              checked={form.is_global}
              onChange={(e) =>
                setForm({
                  ...form,
                  is_global: e.target.checked,
                  campaign_ids: [],
                })
              }
            />
            <label className="text-sm">
              Global (available in all campaigns)
            </label>
          </div>
          {!form.is_global && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Assign to Campaigns
              </label>
              <select
                className="w-full border p-2 rounded"
                multiple
                value={form.campaign_ids.map(String)}
                onChange={(e) => {
                  const vals = Array.from(e.target.selectedOptions).map((opt) =>
                    Number(opt.value),
                  );
                  setForm({ ...form, campaign_ids: vals });
                }}
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ["utm_source", "Source *", "e.g., google"],
              ["utm_medium", "Medium *", "e.g., cpc"],
              ["utm_campaign", "Campaign *", "e.g., spring_sale"],
              ["utm_term", "Term", "e.g., shoes"],
              ["utm_content", "Content", "e.g., logolink"],
            ].map(([key, label, placeholder]) => (
              <div key={key as string}>
                <label className="block text-sm font-medium mb-2">
                  {label}
                </label>
                <input
                  type="text"
                  value={
                    form.utm_params[key as keyof typeof form.utm_params] || ""
                  }
                  onChange={(e) =>
                    updateUTMParam(key as string, e.target.value)
                  }
                  className="w-full border p-2 rounded"
                  placeholder={placeholder as string}
                  required={label.endsWith("*")}
                />
              </div>
            ))}
          </div>
          {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
          <div className="flex gap-2 mt-2">
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : initialValues
                  ? "Save Changes"
                  : "Create Template"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
