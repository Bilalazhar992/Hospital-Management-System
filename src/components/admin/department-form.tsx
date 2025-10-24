"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createDepartment, updateDepartment } from "@/action/departments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Department } from "@/types/database";

const departmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  floor: z.number().int().min(0).max(20).optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  department?: Department;
  mode: "create" | "edit";
}

export default function DepartmentForm({ department, mode }: DepartmentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: department?.name || "",
      description: department?.description || "",
      floor: department?.floor || ("" as any),
      phoneNumber: department?.phoneNumber || "",
    },
  });

  const onSubmit = async (values: DepartmentFormValues) => {
    setIsSubmitting(true);
    try {
      const data = {
        name: values.name,
        description: values.description,
        floor: values.floor === "" ? undefined : Number(values.floor),
        phoneNumber: values.phoneNumber,
      };

      let result;
      if (mode === "create") {
        result = await createDepartment(data);
      } else if (department) {
        result = await updateDepartment(department.id, data);
      }

      if (result?.success) {
        toast.success(
          mode === "create"
            ? "Department created successfully"
            : "Department updated successfully"
        );
        router.push("/admin/departments");
        router.refresh();
      } else {
        toast.error(result?.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Cardiology" {...field} />
              </FormControl>
              <FormDescription>
                Enter the official name of the department
              </FormDescription>
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
                  placeholder="Brief description of the department..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide a brief overview of the department's services
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="floor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Floor Number</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 3"
                    {...field}
                    value={field.value === "" ? "" : field.value}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? "" : parseInt(value, 10));
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Floor location of the department
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="e.g., +1234567890"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Contact number for the department
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting
              ? mode === "create"
                ? "Creating..."
                : "Updating..."
              : mode === "create"
              ? "Create Department"
              : "Update Department"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}