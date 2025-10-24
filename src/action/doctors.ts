"use server";

import { db } from "@/lib/db";
import { doctors, user, account } from "@/lib/db/schema";
import { eq, ilike, or, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

// Check if user is admin
async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  
  return session.user;
}

// Get all doctors with search and filters
export async function getDoctors(filters?: {
  search?: string;
  departmentId?: string;
  isActive?: boolean;
}) {
  await requireAdmin();

  try {
    const conditions = [];

    if (filters?.search) {
      // Note: We'll need to join with user table for name/email search
      conditions.push(
        or(
          ilike(doctors.specialization, `%${filters.search}%`),
          ilike(doctors.qualification, `%${filters.search}%`)
        )
      );
    }

    if (filters?.departmentId) {
      conditions.push(eq(doctors.departmentId, filters.departmentId));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(doctors.isActive, filters.isActive));
    }

    const doctorsList = await db.query.doctors.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(doctors.createdAt)],
      with: {
        department: true,
      },
    });

    // Fetch user details for each doctor
    const doctorsWithUsers = await Promise.all(
      doctorsList.map(async (doctor) => {
        const [userDetails] = await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          })
          .from(user)
          .where(eq(user.id, doctor.userId))
          .limit(1);

        return {
          ...doctor,
          user: userDetails,
        };
      })
    );

    return doctorsWithUsers;
  } catch (error) {
    console.error("Error fetching doctors:", error);
    throw new Error("Failed to fetch doctors");
  }
}

// Get doctor by ID with full details
export async function getDoctorById(id: string) {
  await requireAdmin();

  try {
    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.id, id),
      with: {
        department: true,
        appointments: {
          limit: 10,
          orderBy: (appointments, { desc }) => [desc(appointments.createdAt)],
        },
      },
    });

    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // Fetch user details
    const [userDetails] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.emailVerified,
      })
      .from(user)
      .where(eq(user.id, doctor.userId))
      .limit(1);

    return {
      ...doctor,
      user: userDetails,
    };
  } catch (error) {
    console.error("Error fetching doctor:", error);
    throw new Error("Failed to fetch doctor details");
  }
}

// Create new doctor (creates user + doctor profile)
export async function createDoctor(data: {
  // User data
  name: string;
  email: string;
  password: string;
  // Doctor data
  specialization: string;
  qualification: string;
  experience?: number;
  departmentId?: string;
  licenseNumber?: string;
  consultationFee?: string;
  bio?: string;
  availableFrom?: string;
  availableTo?: string;
}) {
  await requireAdmin();

  try {
    // Check if email already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, data.email),
    });

    if (existingUser) {
      return {
        success: false,
        error: "Email already exists",
      };
    }

    // Check if license number exists (if provided)
    if (data.licenseNumber) {
      const existingLicense = await db.query.doctors.findFirst({
        where: eq(doctors.licenseNumber, data.licenseNumber),
      });

      if (existingLicense) {
        return {
          success: false,
          error: "License number already exists",
        };
      }
    }

    // Hash password
    const hashedPassword = await hash(data.password, 10);

    // Create user first
    const [newUser] = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        role: "doctor",
        emailVerified: true, // Auto-verify for admin-created users
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create account with password
    await db.insert(account).values({
      id: crypto.randomUUID(),
      userId: newUser.id,
      accountId: newUser.email,
      providerId: "credential",
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create doctor profile
    const [newDoctor] = await db
      .insert(doctors)
      .values({
        userId: newUser.id,
        specialization: data.specialization,
        qualification: data.qualification,
        experience: data.experience ?? null,
        departmentId: data.departmentId ?? null,
        licenseNumber: data.licenseNumber ?? null,
        consultationFee: data.consultationFee ?? null,
        bio: data.bio ?? null,
        availableFrom: data.availableFrom ?? null,
        availableTo: data.availableTo ?? null,
        isActive: true,
      })
      .returning();

    revalidatePath("/admin/doctors");
    
    return {
      success: true,
      data: { user: newUser, doctor: newDoctor },
    };
  } catch (error) {
    console.error("Error creating doctor:", error);
    return {
      success: false,
      error: "Failed to create doctor",
    };
  }
}

// Update doctor
export async function updateDoctor(
  id: string,
  data: {
    // User data
    name?: string;
    email?: string;
    // Doctor data
    specialization?: string;
    qualification?: string;
    experience?: number;
    departmentId?: string;
    licenseNumber?: string;
    consultationFee?: string;
    bio?: string;
    availableFrom?: string;
    availableTo?: string;
    isActive?: boolean;
  }
) {
  await requireAdmin();

  try {
    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.id, id),
    });

    if (!doctor) {
      return {
        success: false,
        error: "Doctor not found",
      };
    }

    // Update user details if provided
    if (data.name || data.email) {
      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.email) {
        // Check if new email exists
        const existingUser = await db.query.user.findFirst({
          where: and(
            eq(user.email, data.email),
            // Not the current user
            eq(user.id, doctor.userId)
          ),
        });

        if (existingUser && existingUser.id !== doctor.userId) {
          return {
            success: false,
            error: "Email already exists",
          };
        }
        updateData.email = data.email;
      }

      await db
        .update(user)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(user.id, doctor.userId));
    }

    // Update doctor profile
    const [updatedDoctor] = await db
      .update(doctors)
      .set({
        specialization: data.specialization ?? doctor.specialization,
        qualification: data.qualification ?? doctor.qualification,
        experience: data.experience ?? doctor.experience,
        departmentId: data.departmentId ?? doctor.departmentId,
        licenseNumber: data.licenseNumber ?? doctor.licenseNumber,
        consultationFee: data.consultationFee ?? doctor.consultationFee,
        bio: data.bio ?? doctor.bio,
        availableFrom: data.availableFrom ?? doctor.availableFrom,
        availableTo: data.availableTo ?? doctor.availableTo,
        isActive: data.isActive ?? doctor.isActive,
        updatedAt: new Date(),
      })
      .where(eq(doctors.id, id))
      .returning();

    revalidatePath("/admin/doctors");
    revalidatePath(`/admin/doctors/${id}`);
    
    return {
      success: true,
      data: updatedDoctor,
    };
  } catch (error) {
    console.error("Error updating doctor:", error);
    return {
      success: false,
      error: "Failed to update doctor",
    };
  }
}

// Delete doctor (soft delete)
export async function deleteDoctor(id: string) {
  await requireAdmin();

  try {
    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.id, id),
      with: {
        appointments: {
          where: (appointments, { eq, or }) =>
            or(
              eq(appointments.status, "scheduled"),
              eq(appointments.status, "confirmed")
            ),
        },
      },
    });

    if (!doctor) {
      return {
        success: false,
        error: "Doctor not found",
      };
    }

    if (doctor.appointments.length > 0) {
      return {
        success: false,
        error: "Cannot delete doctor with active appointments. Please reassign or cancel appointments first.",
      };
    }

    // Soft delete
    await db
      .update(doctors)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(doctors.id, id));

    revalidatePath("/admin/doctors");
    
    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting doctor:", error);
    return {
      success: false,
      error: "Failed to delete doctor",
    };
  }
}

// Toggle doctor status
export async function toggleDoctorStatus(id: string) {
  await requireAdmin();

  try {
    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.id, id),
    });

    if (!doctor) {
      return {
        success: false,
        error: "Doctor not found",
      };
    }

    await db
      .update(doctors)
      .set({
        isActive: !doctor.isActive,
        updatedAt: new Date(),
      })
      .where(eq(doctors.id, id));

    revalidatePath("/admin/doctors");
    
    return {
      success: true,
    };
  } catch (error) {
    console.error("Error toggling doctor status:", error);
    return {
      success: false,
      error: "Failed to update doctor status",
    };
  }
}