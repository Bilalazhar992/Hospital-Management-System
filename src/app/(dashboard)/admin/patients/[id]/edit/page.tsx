// src/app/admin/patients/[id]/edit/page.tsx

import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import PatientForm from "@/components/admin/patient-form";
// Import the action to fetch patient data
import { getPatientById } from "@/action/patients";

// This is an async Server Component
export default async function EditPatientPage({
  params,
}: {
  params: { id: string }; // Get the patient ID from the URL
}) {
  let patient;

  // Fetch the patient data using the ID from the URL
  try {
    patient = await getPatientById(params.id);
    // If getPatientById throws an error or returns null/undefined
    if (!patient) {
      notFound(); // Show a 404 page
    }
    // Transform null values to undefined to match PatientWithDetails type
    patient = {
      ...patient,
      user: {
        ...patient.user,
        image: patient.user.image ?? undefined,
        banned: patient.user.banned ?? undefined,
      },
    };
  } catch (error) {
    console.error("Failed to fetch patient:", error);
    notFound(); // Show 404 on any fetch error
  }

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
        <h1 className="text-3xl font-bold tracking-tight">Edit Patient</h1>
        <p className="text-muted-foreground">
          {/* Display the patient's name */}
          Update details for {patient.user.name}
        </p>
      </div>

      {/* Form Card */}
      <Card className="max-w-4xl"> {/* Match the max-width from create page */}
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
          <CardDescription>
            Modify the patient's account and profile details. Fields marked with *
            are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Render the form in 'edit' mode, passing the fetched patient data */}
          <PatientForm patient={patient} mode="edit"  />
        </CardContent>
      </Card>
    </div>
  );
}