import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DepartmentForm from "@/components/admin/department-form";
import { getDepartmentById } from "@/action/departments";

export default async function EditDepartmentPage({
  params,
}: {
  params: { id: string };
}) {
  let department;
  
  try {
    department = await getDepartmentById(params.id);
  } catch (error) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/admin/departments">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Departments
        </Button>
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Department</h1>
        <p className="text-muted-foreground">
          Update the details for {department.name}
        </p>
      </div>

      {/* Form Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Department Information</CardTitle>
          <CardDescription>
            Modify the department details. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DepartmentForm mode="edit" department={department} />
        </CardContent>
      </Card>
    </div>
  );
}