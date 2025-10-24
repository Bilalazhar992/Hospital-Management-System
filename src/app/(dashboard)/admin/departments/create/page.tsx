import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DepartmentForm from "@/components/admin/department-form";

export default function CreateDepartmentPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Create Department</h1>
        <p className="text-muted-foreground">
          Add a new department to the hospital system
        </p>
      </div>

      {/* Form Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Department Information</CardTitle>
          <CardDescription>
            Enter the details for the new department. Fields marked with * are
            required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DepartmentForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}