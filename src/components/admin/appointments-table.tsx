"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye, Calendar, X, Check } from "lucide-react";
import { updateAppointmentStatus, cancelAppointment } from "@/action/appointments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AppointmentsTableProps {
  appointments: any[];
}

export default function AppointmentsTable({ appointments }: AppointmentsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      apt.patient?.user?.name?.toLowerCase().includes(searchLower) ||
      apt.doctor?.user?.name?.toLowerCase().includes(searchLower) ||
      apt.department?.name?.toLowerCase().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (id: string, status: any) => {
    try {
      const result = await updateAppointmentStatus(id, status);
      if (result.success) {
        toast.success("Appointment status updated");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const result = await cancelAppointment(id);
      if (result.success) {
        toast.success("Appointment cancelled");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to cancel");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      scheduled: { 
        label: "Scheduled", 
        className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400" 
      },
      confirmed: { 
        label: "Confirmed", 
        className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400" 
      },
      in_progress: { 
        label: "In Progress", 
        className: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400" 
      },
      completed: { 
        label: "Completed", 
        className: "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-400" 
      },
      cancelled: { 
        label: "Cancelled", 
        className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400" 
      },
      no_show: { 
        label: "No Show", 
        className: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400" 
      },
    };

    const config = statusConfig[status] || statusConfig.scheduled;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by patient, doctor, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredAppointments.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{formatDate(appointment.appointmentDate)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(appointment.appointmentTime)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{appointment.patient?.user?.name || "N/A"}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.patient?.user?.email || ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">Dr. {appointment.doctor?.user?.name || "N/A"}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.doctor?.specialization || ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {appointment.department?.name || "—"}
                  </TableCell>
                  <TableCell className="capitalize">
                    {appointment.appointmentType.replace("_", " ")}
                  </TableCell>
                  <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/appointments/${appointment.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {appointment.status !== "completed" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(appointment.id, "confirmed")}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Confirm
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(appointment.id, "completed")}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Mark Complete
                            </DropdownMenuItem>
                          </>
                        )}
                        {appointment.status !== "cancelled" && (
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleCancel(appointment.id)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No appointments found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Get started by booking a new appointment"}
          </p>
        </div>
      )}
    </div>
  );
}