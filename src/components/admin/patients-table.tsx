"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Pencil, Search, Eye, Ban, CheckCircle, Users } from "lucide-react";
import { togglePatientAccountStatus } from "@/action/patients";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { PatientWithDetails } from "@/types/database";

interface PatientsTableProps {
  patients: PatientWithDetails[];
}

export default function PatientsTable({ patients }: PatientsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter patients
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const handleToggleStatus = async (id: string) => {
    try {
      const result = await togglePatientAccountStatus(id);

      if (result.success) {
        toast.success("Patient status updated");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateAge = (dateOfBirth: Date | null | undefined) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      {filteredPatients.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Age / Gender</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={patient.user.image || ""} alt={patient.user.name} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(patient.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{patient.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {patient.user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {patient.phoneNumber && (
                        <p className="text-sm">{patient.phoneNumber}</p>
                      )}
                      {patient.address && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {patient.address}
                        </p>
                      )}
                      {!patient.phoneNumber && !patient.address && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {calculateAge(patient.dateOfBirth) && (
                        <p className="text-sm font-medium">
                          {calculateAge(patient.dateOfBirth)} years
                        </p>
                      )}
                      {patient.gender && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {patient.gender}
                        </p>
                      )}
                      {!patient.dateOfBirth && !patient.gender && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {patient.bloodGroup ? (
                      <Badge variant="outline" className="font-mono">
                        {patient.bloodGroup}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(patient.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={patient.user.banned ? "destructive" : "default"}
                      className={
                        !patient.user.banned
                          ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950 dark:text-green-400"
                          : ""
                      }
                    >
                      {patient.user.banned ? "Banned" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/patients/${patient.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/patients/${patient.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(patient.id)}
                          className={patient.user.banned ? "" : "text-red-600 focus:text-red-600"}
                        >
                          {patient.user.banned ? (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Activate Account
                            </>
                          ) : (
                            <>
                              <Ban className="mr-2 h-4 w-4" />
                              Ban Account
                            </>
                          )}
                        </DropdownMenuItem>
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
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No patients found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {searchQuery
              ? "Try adjusting your search"
              : "Get started by registering a new patient"}
          </p>
        </div>
      )}
    </div>
  );
}