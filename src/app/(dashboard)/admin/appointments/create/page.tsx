import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AppointmentBookingForm from "@/components/admin/appointments-form";
import { getPatients } from "@/action/patients";
import { getDoctors } from "@/action/doctors";
import { getDepartmentsForSelect } from "@/action/departments";

export default async function CreateAppointmentPage() {
  const [patients, doctors, departments] = await Promise.all([
    getPatients(),
    getDoctors(),
    getDepartmentsForSelect(),
  ]);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/admin/appointments">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Appointments
        </Button>
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Book Appointment</h1>
        <p className="text-muted-foreground">
          Schedule a new appointment for a patient
        </p>
      </div>

      {/* Form Card */}
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
          <CardDescription>
            Select patient, doctor, date and time to book an appointment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentBookingForm
            patients={patients}
            doctors={doctors}
            departments={departments}
          />
        </CardContent>
      </Card>
    </div>
  );
}