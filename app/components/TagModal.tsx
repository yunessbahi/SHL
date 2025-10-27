"use client";
import React, { useEffect } from "react";
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

interface Tag {
  id: number;
  tag_name: string;
  color: string;
  description?: string;
  created_at?: string;
}

const tagSchema = z.object({
  tag_name: z.string().min(1, "Tag name is required"),
  color: z.string().min(1, "Color is required"),
  description: z.string().optional(),
});

type TagFormValues = z.infer<typeof tagSchema>;

interface TagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Tag;
  onSave: (data: TagFormValues) => void;
}

export default function TagModal({
  open,
  onOpenChange,
  initialData,
  onSave,
}: TagModalProps) {
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      tag_name: "",
      color: "#6b7280",
      description: "",
    },
  });

  const { control, handleSubmit, formState } = form;
  const { isSubmitting } = formState;

  // Set form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        tag_name: initialData.tag_name || "",
        color: initialData.color || "#6b7280",
        description: initialData.description || "",
      });
    } else {
      form.reset({
        tag_name: "",
        color: "#6b7280",
        description: "",
      });
    }
  }, [initialData, form]);

  const handleSubmitForm = async (values: TagFormValues) => {
    await onSave(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Tag" : "Create New Tag"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
            <FormField
              control={control}
              name="tag_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tag name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color *</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        {...field}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        placeholder="#6b7280"
                        {...field}
                        className="flex-1"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter tag description (optional)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : initialData
                    ? "Update Tag"
                    : "Create Tag"}
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
      </DialogContent>
    </Dialog>
  );
}
