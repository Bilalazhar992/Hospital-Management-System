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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAppointment, getAvailableTimeSlots } from "@/action/appointments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { appointmentTypeEnum } from "@/lib/db/schema";

const appointmentSchema = z.object({
  patientId: z.string().min(1, "Please select a patient"),
  doctorId: z.string().min(1, "Please select a doctor"),
  departmentId: z.string().optional(),
  appointmentDate: z.date({
    message: "Please select a date",
  }),
  appointmentTime: z.string().min(1, "Please select a time"),
  appointmentType: z.enum(appointmentTypeEnum.enumValues),
  reasonForVisit: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentBookingFormProps {
  patients: Array<{ id: string; user: { name: string; email: string } }>;
  doctors: Array<{ 
    id: string; 
    user: { name: string }; 
    specialization: string;
    departmentId: string | null;
  }>;
  departments: Array<{ id: string; name: string }>;
}

export default function AppointmentBookingForm({
  patients,
  doctors,
  departments,
}: AppointmentBookingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      departmentId: "",
      appointmentType: "consultation",
      reasonForVisit: "",
    },
  });

  const watchedDoctorId = form.watch("doctorId");
  const watchedDate = form.watch("appointmentDate");

  // Fetch available time slots when doctor and date are selected
  useEffect(() => {
    if (watchedDoctorId && watchedDate) {
      setLoadingSlots(true);
      getAvailableTimeSlots(watchedDoctorId, watchedDate)
        .then((slots) => {
          setAvailableSlots(slots);
          // Clear time if it's no longer available
          const currentTime = form.getValues("appointmentTime");
          if (currentTime && !slots.includes(currentTime)) {
            form.setValue("appointmentTime", "");
          }
        })
        .catch(() => {
          toast.error("Failed to load available time slots");
          setAvailableSlots([]);
        })
        .finally(() => setLoadingSlots(false));
    } else {
      setAvailableSlots([]);
    }
  }, [watchedDoctorId, watchedDate, form]);

  const onSubmit = async (values: AppointmentFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createAppointment({
        patientId: values.patientId,
        doctorId: values.doctorId,
        departmentId: values.departmentId,
        appointmentDate: values.appointmentDate,
        appointmentTime: values.appointmentTime,
        appointmentType: values.appointmentType,
        reasonForVisit: values.reasonForVisit,
      });

      if (result.success) {
        toast.success("Appointment booked successfully");
        router.push("/admin/appointments");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to book appointment");
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
        {/* Patient Selection */}
        <FormField
          control={form.control}
          name="patientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Patient *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      <div className="flex flex-col">
                        <span>{patient.user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {patient.user.email}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Department & Doctor Selection */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="doctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Doctor *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {doctors
                      .filter((doc) =>
                        !form.watch("departmentId") ||
                        doc.departmentId === form.watch("departmentId")
                      )
                      .map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          <div className="flex flex-col">
                            <span>Dr. {doctor.user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {doctor.specialization}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Date & Time Selection */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="appointmentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Appointment Date *</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined;
                      field.onChange(date);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="appointmentTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Appointment Time *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!watchedDoctorId || !watchedDate || loadingSlots}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingSlots
                            ? "Loading slots..."
                            : availableSlots.length === 0
                            ? "No slots available"
                            : "Select time"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {!watchedDoctorId || !watchedDate
                    ? "Select doctor and date first"
                    : availableSlots.length === 0 && !loadingSlots
                    ? "No available slots for this date"
                    : null}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Appointment Type */}
        <FormField
          control={form.control}
          name="appointmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Appointment Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {appointmentTypeEnum.enumValues.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Reason for Visit */}
        <FormField
          control={form.control}
          name="reasonForVisit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Visit</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the reason for this appointment..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional: Provide details about the patient's condition or reason for visit
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
            {isSubmitting ? "Booking..." : "Book Appointment"}
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