"use server";

import { db } from "@/lib/db";
import { departments } from "@/lib/db/schema";
import { eq, ilike, or, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { NewDepartment } from "@/types/database";

// Check if user is admin
async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  
  return session.user;
}

// Get all departments with optional search
export async function getDepartments(searchQuery?: string) {
  await requireAdmin();

  try {
    if (searchQuery) {
      return await db.query.departments.findMany({
        where: or(
          ilike(departments.name, `%${searchQuery}%`),
          ilike(departments.description, `%${searchQuery}%`)
        ),
        orderBy: [desc(departments.createdAt)],
      });
    }

    return await db.query.departments.findMany({
      orderBy: [desc(departments.createdAt)],
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw new Error("Failed to fetch departments");
  }
}

// Get departments for dropdown (only id and name)
export async function getDepartmentsForSelect() {
  await requireAdmin();

  try {
    return await db
      .select({
        id: departments.id,
        name: departments.name,
      })
      .from(departments)
      .where(eq(departments.isActive, true))
      .orderBy(departments.name);
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw new Error("Failed to fetch departments");
  }
}

// Get department by ID
export async function getDepartmentById(id: string) {
  await requireAdmin();

  try {
    const department = await db.query.departments.findFirst({
      where: eq(departments.id, id),
      with: {
        doctors: {
          where: (doctors, { eq }) => eq(doctors.isActive, true),
        },
        rooms: true,
      },
    });

    if (!department) {
      throw new Error("Department not found");
    }

    return department;
  } catch (error) {
    console.error("Error fetching department:", error);
    throw new Error("Failed to fetch department");
  }
}

// Create new department
export async function createDepartment(data: {
  name: string;
  description?: string;
  floor?: number;
  phoneNumber?: string;
}) {
  await requireAdmin();

  try {
    // Check if department name already exists
    const existing = await db.query.departments.findFirst({
      where: eq(departments.name, data.name),
    });

    if (existing) {
      return {
        success: false,
        error: "Department with this name already exists",
      };
    }

    const [newDepartment] = await db
      .insert(departments)
      .values({
        name: data.name,
        description: data.description || null,
        floor: data.floor || null,
        phoneNumber: data.phoneNumber || null,
        isActive: true,
      })
      .returning();

    revalidatePath("/admin/departments");
    
    return {
      success: true,
      data: newDepartment,
    };
  } catch (error) {
    console.error("Error creating department:", error);
    return {
      success: false,
      error: "Failed to create department",
    };
  }
}

// Update department
export async function updateDepartment(
  id: string,
  data: {
    name: string;
    description?: string;
    floor?: number;
    phoneNumber?: string;
    isActive?: boolean;
  }
) {
  await requireAdmin();

  try {
    // Check if department exists
    const existing = await db.query.departments.findFirst({
      where: eq(departments.id, id),
    });

    if (!existing) {
      return {
        success: false,
        error: "Department not found",
      };
    }

    // Check if new name conflicts with another department
    if (data.name !== existing.name) {
      const nameExists = await db.query.departments.findFirst({
        where: eq(departments.name, data.name),
      });

      if (nameExists) {
        return {
          success: false,
          error: "Department with this name already exists",
        };
      }
    }

    const [updatedDepartment] = await db
      .update(departments)
      .set({
        name: data.name,
        description: data.description || null,
        floor: data.floor || null,
        phoneNumber: data.phoneNumber || null,
        isActive: data.isActive ?? true,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, id))
      .returning();

    revalidatePath("/admin/departments");
    revalidatePath(`/admin/departments/${id}`);
    
    return {
      success: true,
      data: updatedDepartment,
    };
  } catch (error) {
    console.error("Error updating department:", error);
    return {
      success: false,
      error: "Failed to update department",
    };
  }
}

// Delete department (soft delete by setting isActive to false)
export async function deleteDepartment(id: string) {
  await requireAdmin();

  try {
    // Check if department has active doctors
    const department = await db.query.departments.findFirst({
      where: eq(departments.id, id),
      with: {
        doctors: {
          where: (doctors, { eq }) => eq(doctors.isActive, true),
        },
      },
    });

    if (!department) {
      return {
        success: false,
        error: "Department not found",
      };
    }

    if (department.doctors.length > 0) {
      return {
        success: false,
        error: "Cannot delete department with active doctors. Please reassign or deactivate doctors first.",
      };
    }

    // Soft delete
    await db
      .update(departments)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, id));

    revalidatePath("/admin/departments");
    
    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting department:", error);
    return {
      success: false,
      error: "Failed to delete department",
    };
  }
}

// Toggle department active status
export async function toggleDepartmentStatus(id: string) {
  await requireAdmin();

  try {
    const department = await db.query.departments.findFirst({
      where: eq(departments.id, id),
    });

    if (!department) {
      return {
        success: false,
        error: "Department not found",
      };
    }

    await db
      .update(departments)
      .set({
        isActive: !department.isActive,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, id));

    revalidatePath("/admin/departments");
    
    return {
      success: true,
    };
  } catch (error) {
    console.error("Error toggling department status:", error);
    return {
      success: false,
      error: "Failed to update department status",
    };
  }
}