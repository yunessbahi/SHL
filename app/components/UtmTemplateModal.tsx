import React, { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
//import MultiSelect from "../components/MultiSelect";
import { MultiSelect } from "@/components/multi-select";

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

function getUtmParams(obj: any) {
  let utm = obj?.utm_params;
  if (utm && typeof utm === "string") {
    try {
      utm = JSON.parse(utm);
    } catch {
      utm = {};
    }
  }
  return utm || {};
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
    let utmParams: any = initialValues?.utm_params;
    if (utmParams && typeof utmParams === "string") {
      try {
        utmParams = JSON.parse(utmParams);
      } catch {
        utmParams = {};
      }
    }
    utmParams = utmParams || {
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_term: "",
      utm_content: "",
    };
    setForm({
      name: initialValues?.name || "",
      description: initialValues?.description || "",
      utm_params: utmParams,
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
  const paramFields = [
    ["utm_source", "Source *", "e.g., google"],
    ["utm_medium", "Medium *", "e.g., cpc"],
    ["utm_campaign", "Campaign *", "e.g., spring_sale"],
    ["utm_term", "Term", "e.g., shoes"],
    ["utm_content", "Content", "e.g., logolink"],
  ];
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
              <MultiSelect
                placeholder="Assign to Campaigns"
                options={campaigns.map((c) => ({
                  label: c.name,
                  value: String(c.id),
                }))}
                defaultValue={form.campaign_ids.map(String)}
                onValueChange={(vals) =>
                  setForm({
                    ...form,
                    campaign_ids: vals.map((v) => Number(v)),
                  })
                }
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paramFields.map(([key, label, placeholder]) => (
              <div key={key as string}>
                <label className="block text-sm font-medium mb-2">
                  {label}
                </label>
                <input
                  type="text"
                  value={
                    getUtmParams(form)?.[
                      key as keyof ReturnType<typeof getUtmParams>
                    ] || ""
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
