import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Stethoscope, UserCheck, UserX } from "lucide-react";
import { getDoctors } from "@/action/doctors";
import { getDepartments } from "@/action/departments";
import DoctorsTable from "@/components/admin/doctors-table";
import { Skeleton } from "@/components/ui/skeleton";

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: { search?: string; department?: string };
}) {
  const doctors = await getDoctors({
    search: searchParams.search,
    departmentId: searchParams.department,
  });
  const departments = await getDepartments();

  const activeCount = doctors.filter((d) => d.isActive).length;
  const inactiveCount = doctors.filter((d) => !d.isActive).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
          <p className="text-muted-foreground">
            Manage doctors and their profiles
          </p>
        </div>
        <Link href="/admin/doctors/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Doctor
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctors.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all departments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Not available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Doctors Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Doctors</CardTitle>
          <CardDescription>
            A list of all doctors in the hospital
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <DoctorsTable doctors={doctors} departments={departments} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}