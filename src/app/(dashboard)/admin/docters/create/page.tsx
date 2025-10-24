import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DoctorForm from "@/components/admin/docter-form";
import { getDepartmentsForSelect } from "@/action/departments";

export default async function CreateDoctorPage() {
  const departments = await getDepartmentsForSelect();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/admin/doctors">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Doctors
        </Button>
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Doctor</h1>
        <p className="text-muted-foreground">
          Create a new doctor account and profile
        </p>
      </div>

      {/* Form Card */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Doctor Information</CardTitle>
          <CardDescription>
            Enter the details for the new doctor. This will create both a user
            account and doctor profile. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DoctorForm mode="create" departments={departments} />
        </CardContent>
      </Card>
    </div>
  );
}