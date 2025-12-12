"use client";
import { MultiSelect, MultiSelectOption } from "@/components/multi-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimePicker24h } from "@/components/ui/date-time-picker-24h";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, Infinity, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
      // Convert Date objects to ISO strings with proper UTC handling for one-off campaigns
      const payload = {
        ...values,
        campaign_start_date: values.campaign_start_date
          ? new Date(
              values.campaign_start_date.getTime() -
                values.campaign_start_date.getTimezoneOffset() * 60000,
            )
              .toISOString()
              .replace("Z", "+00:00")
          : undefined,
        campaign_end_date: values.campaign_end_date
          ? new Date(
              values.campaign_end_date.getTime() -
                values.campaign_end_date.getTimezoneOffset() * 60000,
            )
              .toISOString()
              .replace("Z", "+00:00")
          : undefined,
      };

      // Log the payload for debugging one-off campaign datetime issues
      if (values.lifecycle_attr === 2) {
        console.log("Submitting one-off campaign payload:", payload);
      }

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-black">
            {initialData ? "Edit Campaign" : "Create New Campaign"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Section */}
          <div className="space-y-6 max-h-[75vh] lg:col-span-8 overflow-y-auto pr-6 scrollbar-none">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                {/* Basic Info */}
                <div className="space-y-4 p-2 ">
                  <h3 className="text-lg font-bold text-popover-foreground">
                    Basic Information
                  </h3>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">
                          Campaign Name *
                        </FormLabel>
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
                        <FormLabel className="text-muted-foreground">
                          Description
                        </FormLabel>
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
                <div className="space-y-4 px-2">
                  <h3 className="text-lg font-bold text-popover-foreground">
                    Campaign Lifecycle
                  </h3>

                  <FormField
                    control={form.control}
                    name="lifecycle_attr"
                    render={({ field }) => (
                      <FormItem className="">
                        <FormControl className="border-none ">
                          <RadioGroup
                            value={field.value.toString()}
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            defaultValue={"1"}
                            className="w-full justify-items-center sm:grid-cols-3"
                          >
                            {lifecycleOptions.map((option) => {
                              const Icon = option.icon;
                              return (
                                <div
                                  key={option.id}
                                  className={`
                                    relative flex w-full max-w-50 flex-col items-center gap-3
                                    rounded-md border  p-4 shadow-sm outline-none
                                    border-border hover:bg-muted/35
                                    ${field.value === option.id ? "border-primary/70" : ""}
                                    cursor-pointer
                                  `}
                                  ref={(el) => {
                                    if (el) {
                                      const radioItem =
                                        el.querySelector("[data-state]");
                                      console.log(
                                        `Radio item for ${option.id}:`,
                                        radioItem?.getAttribute("data-state"),
                                      );
                                    }
                                  }}
                                >
                                  <RadioGroupItem
                                    value={option.id.toString()}
                                    id={`lifecycle-${option.id}`}
                                    className="order-1 size-5 after:absolute after:inset-0 [&_svg]:size-3 border-muted-foreground/50 bg-muted"
                                    aria-describedby={`lifecycle-${option.id}-description`}
                                  />

                                  <div className="grid grow justify-items-center content-baseline gap-3">
                                    <Icon className="h-5 w-5 text-primary" />
                                    <Label
                                      htmlFor={`lifecycle-${option.id}`}
                                      className="justify-center"
                                    >
                                      {option.name}
                                    </Label>
                                    <p
                                      id={`lifecycle-${option.id}-description`}
                                      className="text-muted-foreground text-center text-xs"
                                    >
                                      {option.description}
                                    </p>
                                  </div>
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
                  <div className="space-y-4 px-2">
                    <h3 className="text-lg font-bold text-popover-foreground">
                      Always-on Settings
                    </h3>

                    <FormField
                      control={form.control}
                      name="default_link_ttl_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground">
                            Default Link TTL (days) *
                          </FormLabel>
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
                  <div className="space-y-4 px-2">
                    <h3 className="text-lg font-bold text-popover-foreground">
                      One-off Settings
                    </h3>

                    <FormField
                      control={form.control}
                      name="campaign_start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground">
                            Start Date & Time *
                          </FormLabel>
                          <FormControl>
                            <div onWheel={(e) => e.stopPropagation()}>
                              <DateTimePicker24h
                                className=""
                                value={
                                  field.value ? field.value.toISOString() : ""
                                }
                                onChange={(dateStr) =>
                                  field.onChange(
                                    dateStr ? new Date(dateStr) : undefined,
                                  )
                                }
                              />
                            </div>
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
                          <FormLabel className="text-muted-foreground">
                            End Date & Time *
                          </FormLabel>
                          <FormControl>
                            <div onWheel={(e) => e.stopPropagation()}>
                              <DateTimePicker24h
                                value={
                                  field.value ? field.value.toISOString() : ""
                                }
                                onChange={(dateStr) =>
                                  field.onChange(
                                    dateStr ? new Date(dateStr) : undefined,
                                  )
                                }
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Status */}
                <div className="space-y-4 px-2">
                  <h3 className="text-lg font-bold text-popover-foreground">
                    Status
                  </h3>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">
                          Campaign Status
                        </FormLabel>
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
                <div className="space-y-4 px-2">
                  <h3 className="text-lg font-bold text-popover-foreground">
                    Tags
                  </h3>

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground">
                          Campaign Tags
                        </FormLabel>
                        <FormControl>
                          <MultiSelect
                            fetchTags={fetchTags}
                            createTag={createTag}
                            enableTagCreation={true}
                            defaultValue={field.value?.map(String) || []}
                            onValueChange={(values: string[]) =>
                              field.onChange(values.map(Number))
                            }
                            variant={"secondary"}
                            animationConfig={{
                              optionHoverAnimation: "none",
                              badgeAnimation: "bounce",
                              popoverAnimation: "none",
                            }}
                            placeholder="Select or create tags"
                            emptyIndicator={
                              <p className="text-center text-sm">
                                No tags found
                              </p>
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-2 pt-4 px-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading
                      ? "Saving..."
                      : initialData
                        ? "Update Campaign"
                        : "Create Campaign"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Summary Card */}
          <div className="space-y-4 lg:col-span-4 max-h-[75vh] overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-bold text-popover-foreground">
                  <Tag className="h-5 w-5" />
                  Campaign Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
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
                      {watchedValues.default_link_ttl_days}{" "}
                      {watchedValues.default_link_ttl_days === 1
                        ? "day"
                        : "days"}
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
