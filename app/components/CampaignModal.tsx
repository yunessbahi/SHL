"use client";
import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/multi-select";
import { CalendarWithTimeInput } from "@/components/ui/calendar-with-time-input";
import { authFetch } from "@/lib/api";
import { Clock, Calendar, Infinity, Tag } from "lucide-react";
import { MultiSelectOption } from "@/components/multi-select";

const campaignSchema = z
  .object({
    name: z.string().min(1, "Campaign name is required"),
    description: z.string().optional(),
    lifecycle_attr: z.number().min(1).max(3),
    default_link_ttl_days: z.number().optional(),
    campaign_start_date: z.date().optional(),
    campaign_end_date: z.date().optional(),
    status: z.enum(["active", "inactive", "paused"]),
    tags: z.array(z.number()).optional(),
  })
  .refine(
    (data) => {
      if (data.lifecycle_attr === 1) {
        return (
          data.default_link_ttl_days !== undefined &&
          data.default_link_ttl_days > 0
        );
      }
      return true;
    },
    {
      message: "TTL is required for Always-on campaigns",
      path: ["default_link_ttl_days"],
    },
  )
  .refine(
    (data) => {
      if (data.lifecycle_attr === 2) {
        return data.campaign_start_date !== undefined;
      }
      return true;
    },
    {
      message: "Start date is required for One-off campaigns",
      path: ["campaign_start_date"],
    },
  )
  .refine(
    (data) => {
      if (data.lifecycle_attr === 2) {
        return data.campaign_end_date !== undefined;
      }
      return true;
    },
    {
      message: "End date is required for One-off campaigns",
      path: ["campaign_end_date"],
    },
  )
  .refine(
    (data) => {
      if (
        data.lifecycle_attr === 2 &&
        data.campaign_start_date &&
        data.campaign_end_date
      ) {
        return (
          new Date(data.campaign_end_date) > new Date(data.campaign_start_date)
        );
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["campaign_end_date"],
    },
  );

type CampaignFormValues = z.infer<typeof campaignSchema>;

interface Campaign {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  templates?: any[];
  status: string;
  lifecycle_attr: number;
  default_link_ttl_days?: number;
  campaign_start_date?: string;
  campaign_end_date?: string;
  tags?: { id: number; tag_name: string; color: string }[];
}

interface CampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Campaign;
  onSave: (data: any) => void;
}

const lifecycleOptions = [
  {
    id: 1,
    name: "Always-on",
    description: "Campaign runs continuously without end date",
    icon: Clock,
  },
  {
    id: 2,
    name: "One-off",
    description: "Campaign runs once with a specific end date",
    icon: Calendar,
  },
  {
    id: 3,
    name: "Infinite",
    description: "Campaign runs indefinitely until manually stopped",
    icon: Infinity,
  },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "paused", label: "Paused" },
];

export default function CampaignModal({
  open,
  onOpenChange,
  initialData,
  onSave,
}: CampaignModalProps) {
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch tags function for MultiSelect
  const fetchTags = async (search?: string): Promise<MultiSelectOption[]> => {
    try {
      const url = search
        ? `/api/tags/?search=${encodeURIComponent(search)}`
        : "/api/tags/";
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        return data.map((tag: any) => ({
          label: tag.tag_name,
          value: tag.id.toString(),
        }));
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch tags:", error);
      return [];
    }
  };

  // Create tag function for MultiSelect
  const createTag = async (tagName: string): Promise<MultiSelectOption> => {
    try {
      const res = await authFetch("/api/tags/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tag_name: tagName }),
      });

      if (res.ok) {
        const newTag = await res.json();
        // Update local tags state
        setTags((prev) => [...prev, newTag]);
        return {
          label: newTag.tag_name,
          value: newTag.id.toString(),
        };
      }
      throw new Error("Failed to create tag");
    } catch (error) {
      console.error("Failed to create tag:", error);
      throw error;
    }
  };

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      lifecycle_attr: 1,
      default_link_ttl_days: 30,
      campaign_start_date: undefined,
      campaign_end_date: undefined,
      status: "active",
      tags: [],
    },
  });

  const watchedValues = form.watch();

  // Clear dates when switching to always-on lifecycle
  useEffect(() => {
    if (watchedValues.lifecycle_attr === 1) {
      form.setValue("campaign_start_date", undefined);
      form.setValue("campaign_end_date", undefined);
    }
  }, [watchedValues.lifecycle_attr, form]);

  // Load tags on mount
  useEffect(() => {
    const loadTags = async () => {
      try {
        const res = await authFetch("/api/tags/");
        if (res.ok) {
          const data = await res.json();
          setTags(data);
        }
      } catch (error) {
        console.error("Failed to load tags:", error);
      }
    };
    if (open) loadTags();
  }, [open]);

  // Set form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        description: initialData.description || "",
        lifecycle_attr: initialData.lifecycle_attr || 1,
        default_link_ttl_days: initialData.default_link_ttl_days || 30,
        campaign_start_date: initialData.campaign_start_date
          ? new Date(initialData.campaign_start_date)
          : undefined,
        campaign_end_date: initialData.campaign_end_date
          ? new Date(initialData.campaign_end_date)
          : undefined,
        status:
          (initialData.status as "active" | "inactive" | "paused") || "active",
        tags: initialData.tags?.map((t: any) => t.id) || [],
      });
    } else {
      form.reset({
        name: "",
        description: "",
        lifecycle_attr: 1,
        default_link_ttl_days: 30,
        campaign_start_date: undefined,
        campaign_end_date: undefined,
        status: "active",
        tags: [],
      });
    }
  }, [initialData, form]);

  const handleSubmit = async (values: CampaignFormValues) => {
    setLoading(true);
    try {
      // Convert Date objects to ISO strings for backend
      const payload = {
        ...values,
        campaign_start_date: values.campaign_start_date
          ? values.campaign_start_date.toISOString()
          : undefined,
        campaign_end_date: values.campaign_end_date
          ? values.campaign_end_date.toISOString()
          : undefined,
      };
      await onSave(payload);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save campaign:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedLifecycle = lifecycleOptions.find(
    (opt) => opt.id === watchedValues.lifecycle_attr,
  );

  const selectedTags = tags.filter((tag) =>
    watchedValues.tags?.includes(tag.id),
  );

  const selectedCampaignTags =
    initialData?.tags?.filter((tag) => watchedValues.tags?.includes(tag.id)) ||
    selectedTags;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Campaign" : "Create New Campaign"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="space-y-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter campaign name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter campaign description"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Lifecycle Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Campaign Lifecycle</h3>

                  <FormField
                    control={form.control}
                    name="lifecycle_attr"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            value={field.value.toString()}
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            className="grid grid-cols-1 gap-4"
                          >
                            {lifecycleOptions.map((option) => {
                              const Icon = option.icon;
                              return (
                                <div key={option.id}>
                                  <RadioGroupItem
                                    value={option.id.toString()}
                                    id={`lifecycle-${option.id}`}
                                    className="peer sr-only"
                                  />
                                  <Label
                                    htmlFor={`lifecycle-${option.id}`}
                                    className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent peer-checked:border-primary"
                                  >
                                    <Icon className="h-5 w-5 text-primary" />
                                    <div>
                                      <div className="font-medium">
                                        {option.name}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {option.description}
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                              );
                            })}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Conditional Fields */}
                {watchedValues.lifecycle_attr === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Always-on Settings
                    </h3>

                    <FormField
                      control={form.control}
                      name="default_link_ttl_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Link TTL (days) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="30"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 30)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {watchedValues.lifecycle_attr === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">One-off Settings</h3>

                    <FormField
                      control={form.control}
                      name="campaign_start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date & Time *</FormLabel>
                          <FormControl>
                            <CalendarWithTimeInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select start date and time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="campaign_end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date & Time *</FormLabel>
                          <FormControl>
                            <CalendarWithTimeInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select end date and time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Status</h3>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Status</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tags */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tags</h3>

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Tags</FormLabel>
                        <FormControl>
                          <MultiSelect
                            fetchTags={fetchTags}
                            createTag={createTag}
                            enableTagCreation={true}
                            defaultValue={field.value?.map(String) || []}
                            onValueChange={(values: string[]) =>
                              field.onChange(values.map(Number))
                            }
                            placeholder="Select or create tags"
                            emptyIndicator="No tags found"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading
                      ? "Saving..."
                      : initialData
                        ? "Update Campaign"
                        : "Create Campaign"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Summary Card */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Campaign Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Name</h4>
                  <p className="text-sm text-muted-foreground">
                    {watchedValues.name || "Not specified"}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {watchedValues.description || "Not specified"}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium">Lifecycle</h4>
                  <div className="flex items-center gap-2">
                    {selectedLifecycle && (
                      <>
                        <selectedLifecycle.icon className="h-4 w-4" />
                        <span className="text-sm">
                          {selectedLifecycle.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {watchedValues.lifecycle_attr === 1 && (
                  <div>
                    <h4 className="font-medium">Default TTL</h4>
                    <p className="text-sm text-muted-foreground">
                      {watchedValues.default_link_ttl_days} days
                    </p>
                  </div>
                )}

                {watchedValues.lifecycle_attr === 2 && (
                  <>
                    <div>
                      <h4 className="font-medium">Start Date</h4>
                      <p className="text-sm text-muted-foreground">
                        {watchedValues.campaign_start_date
                          ? new Date(
                              watchedValues.campaign_start_date,
                            ).toLocaleString()
                          : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">End Date</h4>
                      <p className="text-sm text-muted-foreground">
                        {watchedValues.campaign_end_date
                          ? new Date(
                              watchedValues.campaign_end_date,
                            ).toLocaleString()
                          : "Not specified"}
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <h4 className="font-medium">Status</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {watchedValues.status}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedCampaignTags.length > 0 ? (
                      selectedCampaignTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs"
                          style={{
                            backgroundColor: tag.color + "20",
                            color: tag.color,
                          }}
                        >
                          {tag.tag_name}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No tags selected
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
