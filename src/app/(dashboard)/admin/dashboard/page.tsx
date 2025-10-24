import StatsCard from "@/components/shared/stats-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Stethoscope,
  Calendar,
  DollarSign,
  UserPlus,
  Building2,
  Activity,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import {
  getAdminStats,
  getRecentAppointments,
  getDepartmentStats,
} from "@/action/admin";

export default async function AdminDashboardPage() {
  // Fetch real data from database
  const stats = await getAdminStats();
  const recentAppointments = await getRecentAppointments(4);
  const departments = await getDepartmentStats();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Patients"
          value={stats.totalPatients.toLocaleString()}
          description="Registered patients"
          icon={Users}
          iconClassName="text-blue-600"
          iconBgClassName="bg-blue-100 dark:bg-blue-950"
        />
        <StatsCard
          title="Total Doctors"
          value={stats.totalDoctors}
          description="Active doctors"
          icon={Stethoscope}
          iconClassName="text-green-600"
          iconBgClassName="bg-green-100 dark:bg-green-950"
        />
        <StatsCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          description="Scheduled for today"
          icon={Calendar}
          iconClassName="text-purple-600"
          iconBgClassName="bg-purple-100 dark:bg-purple-950"
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${(stats.monthlyRevenue / 1000).toFixed(1)}K`}
          description="Revenue this month"
          icon={DollarSign}
          iconClassName="text-orange-600"
          iconBgClassName="bg-orange-100 dark:bg-orange-950"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/patients" className="group">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 group-hover:bg-accent">
              <UserPlus className="h-5 w-5" />
              <span className="text-sm font-medium">Register Patient</span>
            </Button>
          </Link>
          <Link href="/admin/doctors" className="group">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 group-hover:bg-accent">
              <Stethoscope className="h-5 w-5" />
              <span className="text-sm font-medium">Add Doctor</span>
            </Button>
          </Link>
          <Link href="/admin/departments" className="group">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 group-hover:bg-accent">
              <Building2 className="h-5 w-5" />
              <span className="text-sm font-medium">Manage Departments</span>
            </Button>
          </Link>
          <Link href="/admin/analytics" className="group">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 group-hover:bg-accent">
              <Activity className="h-5 w-5" />
              <span className="text-sm font-medium">View Analytics</span>
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Appointments</CardTitle>
              <CardDescription>Today's appointment schedule</CardDescription>
            </div>
            <Link href="/admin/appointments">
              <Button variant="ghost" size="sm" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentAppointments.length > 0 ? (
              <div className="space-y-4">
                {recentAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{appointment.patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.doctorName} • {appointment.department}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium">{appointment.time}</p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          appointment.status === "confirmed"
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                            : appointment.status === "scheduled"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No appointments scheduled for today
              </p>
            )}
          </CardContent>
        </Card>

        {/* Department Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Department Overview</CardTitle>
              <CardDescription>Active departments and stats</CardDescription>
            </div>
            <Link href="/admin/departments">
              <Button variant="ghost" size="sm" className="gap-2">
                Manage
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {departments.length > 0 ? (
              <div className="space-y-4">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{dept.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {dept.doctors} doctors
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{dept.patients}</p>
                      <p className="text-xs text-muted-foreground">patients</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No departments found. Create one to get started.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}