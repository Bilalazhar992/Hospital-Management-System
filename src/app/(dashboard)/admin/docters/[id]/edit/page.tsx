import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DoctorForm from "@/components/admin/docter-form";
import { getDoctorById } from "@/action/doctors";
import { getDepartmentsForSelect } from "@/action/departments";

export default async function EditDoctorPage({
  params,
}: {
  params: { id: string };
}) {
  let doctor;
  
  try {
    doctor = await getDoctorById(params.id);
  } catch (error) {
    notFound();
  }

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
        <h1 className="text-3xl font-bold tracking-tight">Edit Doctor</h1>
        <p className="text-muted-foreground">
          Update the details for {doctor.user?.name}
        </p>
      </div>

      {/* Form Card */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Doctor Information</CardTitle>
          <CardDescription>
            Modify the doctor details. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DoctorForm mode="edit" doctor={doctor} departments={departments} />
        </CardContent>
      </Card>
    </div>
  );
}