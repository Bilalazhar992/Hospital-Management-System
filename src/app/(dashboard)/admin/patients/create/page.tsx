import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PatientForm from "@/components/admin/patient-form";

export default function CreatePatientPage() {
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/admin/patients">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </Button>
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Register Patient</h1>
        <p className="text-muted-foreground">
          Add a new patient to the system
        </p>
      </div>

      {/* Form Card */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
          <CardDescription>
            Enter the patient's details. This will create both a user account and
            medical profile. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PatientForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}