
"use server";

import { db } from "@/lib/db";
// Import all tables AND enums we need
import {
  patients,
  user,
  account,
  genderEnum,
  bloodGroupEnum,
} from "@/lib/db/schema";
import { eq, ilike, or, desc, and, not } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { roles } from "@/lib/auth";
import type { PatientWithDetails } from "@/types/database";
import { z } from "zod"; // Import Zod

// ============================================
// VALIDATION SCHEMA
// ============================================

// Define the schema at the top of the file
export const CreatePatientSchema = z
  .object({
    // User fields
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),

    // Patient fields
    dateOfBirth: z.date().optional(),
    gender: z.enum(genderEnum.enumValues).optional(),
    bloodGroup: z.enum(bloodGroupEnum.enumValues).optional(),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactNumber: z.string().optional(),
    allergies: z.string().optional(),
    chronicDiseases: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Error will be shown on this field
  });

// ============================================
// HELPER FUNCTIONS
// ============================================

// Helper function to check for Admin role
async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== roles.ADMIN) {
    throw new Error("Unauthorized: Admin access required");
  }
  return session.user;
}

// Helper function to check for Staff (Admin or Receptionist)
async function requireStaff() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (
    !session?.user ||
    ![roles.ADMIN, roles.RECEPTIONIST].includes(session.user.role as any)
  ) {
    throw new Error("Unauthorized: Admin or Receptionist access required");
  }
  return session.user;
}

// ============================================
// CRUD ACTIONS
// ============================================

// Create a new patient (following your doctors.ts create pattern)
export async function createPatient(
  data: z.infer<typeof CreatePatientSchema>
) {
  await requireStaff();

  try {
    // 1. Check if email already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, data.email),
    });

    if (existingUser) {
      return {
        success: false,
        error: "Email already exists",
      };
    }

    // 2. Hash password
    const hashedPassword = await hash(data.password, 10);

    // 3. Create user first
    const [newUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(), // Manually generate ID
        name: data.name,
        email: data.email,
        role: roles.PATIENT,
        emailVerified: true, // Auto-verify as it's staff-created
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // 4. Create account with password
    await db.insert(account).values({
      id: crypto.randomUUID(), // Manually generate ID
      userId: newUser.id,
      accountId: newUser.email,
      providerId: "credential",
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 5. Create patient profile
    const [newPatient] = await db
      .insert(patients)
      .values({
        userId: newUser.id,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        address: data.address || null,
        phoneNumber: data.phoneNumber || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactNumber: data.emergencyContactNumber || null,
        allergies: data.allergies || null,
        chronicDiseases: data.chronicDiseases || null,
      })
      .returning();

    revalidatePath("/admin/patients");

    return {
      success: true,
      data: { user: newUser, patient: newPatient },
    };
  } catch (error: any) {
    console.error("Error creating patient:", error);
    return {
      success: false,
      error: "Failed to create patient",
    };
  }
}

// Get all patients (following your N+1 query pattern)
export async function getPatients(
  searchQuery?: string
): Promise<PatientWithDetails[]> {
  await requireStaff();

  try {
    // 1. Get all patients
    const patientsList = await db.query.patients.findMany({
      orderBy: [desc(patients.createdAt)],
    });

    // 2. Fetch user details for each patient
    const patientsWithUsers = await Promise.all(
      patientsList.map(async (patient) => {
        const [userDetails] = await db
          .select({
            // Select *only* the fields in PatientWithDetails['user']
            name: user.name,
            email: user.email,
            image: user.image,
            banned: user.banned, // This now matches our updated type
          })
          .from(user)
          .where(eq(user.id, patient.userId))
          .limit(1);

        if (!userDetails) {
          console.error(`Inconsistent data: No user found for patient ID ${patient.id}`);
          return null;
        }

        return {
          ...patient,
          user: userDetails,
        };
      })
    );

    // 3. Filter out nulls
    const validPatients = patientsWithUsers.filter((p) => p !== null) as PatientWithDetails[];

    // 4. Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();

      return validPatients.filter(
        (p) =>
          p.user.name.toLowerCase().includes(lowerQuery) ||
          p.user.email.toLowerCase().includes(lowerQuery) ||
          p.phoneNumber?.toLowerCase().includes(lowerQuery)
      );
    }

    return validPatients;
  } catch (error) {
    console.error("Error fetching patients:", error);
    throw new Error("Failed to fetch patients");
  }
}

// Get patient by ID with full details
export async function getPatientById(id: string) {
  await requireStaff();

  try {
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, id),
      with: {
        appointments: {
          limit: 10,
          orderBy: (appointments, { desc }) => [desc(appointments.createdAt)],
        },
        medicalRecords: {
          limit: 10,
          orderBy: (medicalRecords, { desc }) => [desc(medicalRecords.createdAt)],
        },
      },
    });

    if (!patient) {
      throw new Error("Patient not found");
    }

    // Fetch user details
    const [userDetails] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.emailVerified,
        banned: user.banned,
      })
      .from(user)
      .where(eq(user.id, patient.userId))
      .limit(1);

    return {
      ...patient,
      user: userDetails,
    };
  } catch (error) {
    console.error("Error fetching patient:", error);
    throw new Error("Failed to fetch patient details");
  }
}

// Update patient
// src/actions/patients.ts



// ... (keep createPatient, getPatients, getPatientById)

// Update patient
export async function updatePatient(
  id: string, // This is patient.id
  data: Partial<
    Omit<PatientWithDetails, "user" | "id"> & { name?: string; email?: string }
  >
) {
  await requireAdmin();

  try {
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, id),
    });

    if (!patient) {
      return {
        success: false,
        error: "Patient not found",
      };
    }

    // Update user details if provided
    if (data.name || data.email) {
      const updateData: any = { updatedAt: new Date() };
      if (data.name) updateData.name = data.name;

      if (data.email) {
        // **THIS IS THE FIX:**
        // Check if new email exists for a *different* user
        const existingUser = await db.query.user.findFirst({
            where: and(
                eq(user.email, data.email),
                not(eq(user.id, patient.userId)) // <-- Corrected logic here
            ),
        });

        if (existingUser) {
            return { success: false, error: "Email already exists" };
        }
        updateData.email = data.email;
      }


      await db
        .update(user)
        .set(updateData)
        .where(eq(user.id, patient.userId));
    }

    // ... (rest of the function is correct)
    // Update patient profile
    const [updatedPatient] = await db
      .update(patients)
      .set({
        dateOfBirth: data.dateOfBirth ?? patient.dateOfBirth,
        gender: data.gender ?? patient.gender,
        bloodGroup: data.bloodGroup ?? patient.bloodGroup,
        address: data.address ?? patient.address,
        phoneNumber: data.phoneNumber ?? patient.phoneNumber,
        emergencyContactName:
          data.emergencyContactName ?? patient.emergencyContactName,
        emergencyContactNumber:
          data.emergencyContactNumber ?? patient.emergencyContactNumber,
        allergies: data.allergies ?? patient.allergies,
        chronicDiseases: data.chronicDiseases ?? patient.chronicDiseases,
        updatedAt: new Date(),
      })
      .where(eq(patients.id, id))
      .returning();

    revalidatePath("/admin/patients");
    revalidatePath(`/admin/patients/${id}/edit`);

    return {
      success: true,
      data: updatedPatient,
    };
  } catch (error) {
    console.error("Error updating patient:", error);
    return {
      success: false,
      error: "Failed to update patient",
    };
  }
}



// ... (keep togglePatientAccountStatus)

// Toggle patient account status (ban/unban)
// This is the equivalent of your toggleDoctorStatus, but for the 'user' table
export async function togglePatientAccountStatus(id: string) { // patient.id
  await requireAdmin();

  try {
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, id),
    });

    if (!patient) {
      return { success: false, error: "Patient not found" };
    }

    const [currentUser] = await db
      .select({ banned: user.banned })
      .from(user)
      .where(eq(user.id, patient.userId));

    if (!currentUser) {
      return { success: false, error: "User account not found for this patient" };
    }

    const newStatus = !currentUser.banned;

    await db
      .update(user)
      .set({
        banned: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(user.id, patient.userId));

    revalidatePath("/admin/patients");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error toggling patient status:", error);
    return {
      success: false,
      error: "Failed to update patient status",
    };
  }
}