"use client";

import React, { useEffect } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelect } from "@/components/multi-select";

interface Campaign {
  id: number;
  name: string;
}

interface UtmTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: {
    name?: string;
    description?: string;
    utm_params?: Record<string, string>;
    is_global?: boolean;
    campaign_ids?: number[];
  };
  onSave: (values: UTMTemplateFormValues) => Promise<void>;
  campaigns: Campaign[];
  loading?: boolean;
}

const utmKeys = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  is_global: z.boolean(),
  campaign_ids: z.array(z.number()),
  utm_params: z.object({
    utm_source: z.string().min(1, "Source is required"),
    utm_medium: z.string().min(1, "Medium is required"),
    utm_campaign: z.string().min(1, "Campaign is required"),
    utm_term: z.string().optional(),
    utm_content: z.string().optional(),
  }),
});

export type UTMTemplateFormValues = z.infer<typeof schema>;

export function UtmTemplateModal({
  open,
  onOpenChange,
  initialValues,
  onSave,
  campaigns,
  loading,
}: UtmTemplateModalProps) {
  console.log("campaigns:", campaigns);
  const defaultValues: UTMTemplateFormValues = {
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
    is_global: initialValues?.is_global ?? false,
    campaign_ids: initialValues?.campaign_ids ?? [],
    utm_params: {
      utm_source: initialValues?.utm_params?.utm_source ?? "",
      utm_medium: initialValues?.utm_params?.utm_medium ?? "",
      utm_campaign: initialValues?.utm_params?.utm_campaign ?? "",
      utm_term: initialValues?.utm_params?.utm_term ?? "",
      utm_content: initialValues?.utm_params?.utm_content ?? "",
    },
  };

  const form = useForm<UTMTemplateFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { control, handleSubmit, watch, formState, reset } = form;
  const { isSubmitting, errors } = formState;

  // Reset form when initialValues or open state changes
  useEffect(() => {
    if (open && initialValues) {
      reset({
        name: initialValues.name ?? "",
        description: initialValues.description ?? "",
        is_global: initialValues.is_global ?? false,
        campaign_ids: initialValues.campaign_ids ?? [], // number[] as expected by form
        utm_params: {
          utm_source: initialValues.utm_params?.utm_source ?? "",
          utm_medium: initialValues.utm_params?.utm_medium ?? "",
          utm_campaign: initialValues.utm_params?.utm_campaign ?? "",
          utm_term: initialValues.utm_params?.utm_term ?? "",
          utm_content: initialValues.utm_params?.utm_content ?? "",
        },
      });
    }
  }, [open, initialValues, reset]);

  const watchIsGlobal = watch("is_global");

  const onSubmit = async (values: UTMTemplateFormValues) => {
    const payload = {
      ...values,
      campaign_ids: values.is_global ? [] : values.campaign_ids,
    };
    await onSave(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialValues ? "Edit UTM Template" : "Create UTM Template"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Template Name"
                      disabled={isSubmitting || loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Optional description"
                      disabled={isSubmitting || loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Global Checkbox */}
            <FormField
              control={control}
              name="is_global"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting || loading}
                    />
                  </FormControl>
                  <FormLabel className="mb-0">
                    Global (available in all campaigns)
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* Campaign MultiSelect - Using Controller to Avoid FormField Context Error */}
            {!watchIsGlobal && (
              <FormField
                control={control}
                name="campaign_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Campaigns</FormLabel>
                    <FormControl>
                      {/*<MultiSelect
                                                placeholder="Select campaigns"
                                                // Label = name (what user sees), value = id as string (internal for MultiSelect)
                                                options={campaigns.map((c) => ({ label: c.name, value: String(c.id) }))}
                                                // field.value is number[], convert to string[] for MultiSelect
                                                value={field.value.map(String)}

                                                // Convert selected string[] back to number[] for form
                                                onValueChange={(vals) => field.onChange(vals.map(Number))}
                                                disabled={isSubmitting || loading}

                                            />*/}
                      <MultiSelect
                        placeholder="Assign to Campaigns"
                        options={campaigns.map((c) => ({
                          label: c.name,
                          value: String(c.id),
                        }))}
                        defaultValue={defaultValues.campaign_ids.map(String)}
                        onValueChange={(vals) =>
                          field.onChange(vals.map(Number))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* UTM fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {utmKeys.map((key) => (
                <FormField
                  key={key}
                  control={control}
                  name={`utm_params.${key}` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {key
                          .replace("utm_", "")
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                        {["utm_source", "utm_medium", "utm_campaign"].includes(
                          key,
                        )
                          ? " *"
                          : ""}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={`e.g., ${key.replace("utm_", "")}`}
                          disabled={isSubmitting || loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="submit" disabled={isSubmitting || loading}>
                {isSubmitting || loading
                  ? "Saving…"
                  : initialValues
                    ? "Save Changes"
                    : "Create Template"}
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
