// app/components/UtmTemplateModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import {
  Combobox,
  ComboboxContent,
  ComboboxCreateNew,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/kibo-ui/combobox";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { flushSync } from "react-dom";

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
    pinned?: boolean;
    campaign_ids?: number[];
  };
  onSave: (values: any) => Promise<void>;
  campaigns: Campaign[];
  loading?: boolean;
}

// Default UTM parameter options
const defaultUtmParams = [
  { value: "utm_source", label: "Source" },
  { value: "utm_medium", label: "Medium" },
  { value: "utm_campaign", label: "Campaign" },
  { value: "utm_term", label: "Term" },
  { value: "utm_content", label: "Content" },
  { value: "utm_id", label: "ID" },
];

const paramSchema = z.object({
  key: z.string().min(1, "Parameter key is required"),
  value: z.string().min(1, "Parameter value is required"),
});

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  is_global: z.boolean(),
  pinned: z.boolean(),
  campaign_ids: z.array(z.number()),
  utm_params_array: z
    .array(paramSchema)
    .min(1, "At least one parameter is required"),
});

type FormValues = z.infer<typeof schema>;

export function UtmTemplateModal({
  open,
  onOpenChange,
  initialValues,
  onSave,
  campaigns,
  loading,
}: UtmTemplateModalProps) {
  const [availableParams, setAvailableParams] = useState(defaultUtmParams);

  // Convert utm_params object to array format
  const utmParamsToArray = (params?: Record<string, string>) => {
    if (!params || Object.keys(params).length === 0) {
      return [{ key: "", value: "" }];
    }
    return Object.entries(params).map(([key, value]) => ({ key, value }));
  };

  const defaultValues: FormValues = {
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
    is_global: initialValues?.is_global ?? false,
    pinned: initialValues?.pinned ?? false,
    campaign_ids: initialValues?.campaign_ids ?? [],
    utm_params_array: utmParamsToArray(initialValues?.utm_params),
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { control, handleSubmit, watch, reset } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "utm_params_array",
  });

  const watchIsGlobal = watch("is_global");

  // Reset form when initialValues or open state changes
  useEffect(() => {
    if (open) {
      const values: FormValues = {
        name: initialValues?.name ?? "",
        description: initialValues?.description ?? "",
        is_global: initialValues?.is_global ?? false,
        pinned: initialValues?.pinned ?? false,
        campaign_ids: initialValues?.campaign_ids ?? [],
        utm_params_array: utmParamsToArray(initialValues?.utm_params),
      };
      reset(values);

      // Merge custom params from initialValues with default params
      if (initialValues?.utm_params) {
        const customParams = Object.keys(initialValues.utm_params)
          .filter((key) => !defaultUtmParams.some((p) => p.value === key))
          .map((key) => ({
            value: key,
            label: key
              .replace(/^utm_/, "")
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" "),
          }));

        setAvailableParams([...defaultUtmParams, ...customParams]);
      } else {
        setAvailableParams(defaultUtmParams);
      }
    }
  }, [open, initialValues, reset]);
  //console.log("initVal", initialValues);

  const handleCreateNewParam = (newParamKey: string, index: number) => {
    // Remove utm_ prefix if user included it, for clean label generation
    const cleanKey = newParamKey
      .toLowerCase()
      .replace(/^utm_/, "")
      .replace(/\s+/g, "_");

    // Always add utm_ prefix for the actual value
    const formattedKey = `utm_${cleanKey}`;

    // Add to available params if not already there
    const paramExists = availableParams.some((p) => p.value === formattedKey);
    if (!paramExists) {
      // Create a nice label from the clean key
      const label = cleanKey
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const newParam = {
        value: formattedKey,
        label: label,
      };
      setAvailableParams((prev) => [...prev, newParam]);
    }

    // Set the value in the form
    form.setValue(`utm_params_array.${index}.key`, formattedKey);
  };

  const onSubmit = async (values: FormValues) => {
    // Convert utm_params_array back to object
    const utm_params: Record<string, string> = {};
    values.utm_params_array.forEach((param) => {
      if (param.key && param.value) {
        utm_params[param.key] = param.value;
      }
    });

    const payload = {
      name: values.name,
      description: values.description,
      is_global: values.is_global,
      pinned: values.pinned,
      campaign_ids: values.is_global ? [] : values.campaign_ids,
      utm_params,
    };

    await onSave(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialValues?.utm_params
              ? "Edit UTM Template"
              : "Create UTM Template"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                      placeholder="e.g., Facebook Ads Template"
                      disabled={form.formState.isSubmitting || loading}
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
                      placeholder="Brief description of when to use this template"
                      disabled={form.formState.isSubmitting || loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* UTM Parameters Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>UTM Parameters *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ key: "", value: "" })}
                  disabled={form.formState.isSubmitting || loading}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Parameter
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    {/* Parameter Key Combobox */}
                    <div className="flex-1 space-y-2">
                      <FormField
                        control={control}
                        name={`utm_params_array.${index}.key`}
                        render={({ field: formField }) => (
                          <Combobox
                            data={availableParams}
                            onValueChange={formField.onChange}
                            type="parameter"
                            value={formField.value}
                          >
                            <ComboboxTrigger
                              className="w-full"
                              //placeholder="Select or create parameter"
                            />
                            <ComboboxContent>
                              <ComboboxInput placeholder="Search parameters..." />
                              <ComboboxEmpty>
                                <ComboboxCreateNew
                                  onCreateNew={(newValue) => {
                                    const cleanKey = newValue
                                      .toLowerCase()
                                      .replace(/^utm_/, "")
                                      .replace(/\s+/g, "_");
                                    const formattedKey = `utm_${cleanKey}`;
                                    const label = cleanKey
                                      .split("_")
                                      .map(
                                        (word) =>
                                          word.charAt(0).toUpperCase() +
                                          word.slice(1),
                                      )
                                      .join(" ");

                                    const paramExists = availableParams.some(
                                      (p) => p.value === formattedKey,
                                    );
                                    if (!paramExists) {
                                      const newParam = {
                                        value: formattedKey,
                                        label,
                                      };
                                      setAvailableParams((prev) => [
                                        ...prev,
                                        newParam,
                                      ]);
                                    }

                                    // Use setTimeout to ensure state update completes first
                                    setTimeout(() => {
                                      form.setValue(
                                        `utm_params_array.${index}.key`,
                                        formattedKey,
                                      );
                                    }, 0);
                                  }}
                                />
                              </ComboboxEmpty>
                              <ComboboxList>
                                <ComboboxGroup>
                                  {availableParams.map((p) => (
                                    <ComboboxItem key={p.value} value={p.value}>
                                      {p.label}
                                    </ComboboxItem>
                                  ))}
                                </ComboboxGroup>
                              </ComboboxList>
                            </ComboboxContent>
                          </Combobox>
                        )}
                      />
                      {form.formState.errors.utm_params_array?.[index]?.key && (
                        <p className="text-sm font-medium text-destructive">
                          {
                            form.formState.errors.utm_params_array[index]?.key
                              ?.message
                          }
                        </p>
                      )}
                    </div>

                    {/* Parameter Value Input */}
                    <FormField
                      control={control}
                      name={`utm_params_array.${index}.value`}
                      render={({ field: formField }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              {...formField}
                              placeholder="Parameter value"
                              disabled={form.formState.isSubmitting || loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={
                        fields.length === 1 ||
                        form.formState.isSubmitting ||
                        loading
                      }
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {form.formState.errors.utm_params_array?.root && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.utm_params_array.root.message}
                </p>
              )}
            </div>

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
                      disabled={form.formState.isSubmitting || loading}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">
                    Global (available in all campaigns)
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* Pinned Checkbox */}
            <FormField
              control={control}
              name="pinned"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={form.formState.isSubmitting || loading}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">
                    Pinned (keep at top of list)
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* Campaign MultiSelect */}
            {!watchIsGlobal && (
              <FormField
                control={control}
                name="campaign_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Campaigns</FormLabel>
                    <FormControl>
                      <MultiSelect
                        placeholder="Select campaigns"
                        options={campaigns.map((c) => ({
                          label: c.name,
                          value: String(c.id),
                        }))}
                        defaultValue={field.value.map(String)}
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

            {/* Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting || loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting || loading}
              >
                {form.formState.isSubmitting || loading
                  ? "Saving…"
                  : initialValues
                    ? "Save Changes"
                    : "Create Template"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
