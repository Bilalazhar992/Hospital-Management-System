"use server";

import { db } from "@/lib/db";
import { departments, doctors, patients, appointments } from "@/lib/db/schema";
import { count, sql, eq, and, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Check if user is admin
async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  
  return session.user;
}

// Get dashboard statistics
export async function getAdminStats() {
  await requireAdmin();

  try {
    // Get total counts
    const [totalPatients] = await db
      .select({ count: count() })
      .from(patients);

    const [totalDoctors] = await db
      .select({ count: count() })
      .from(doctors)
      .where(eq(doctors.isActive, true));

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayAppointments] = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          gte(appointments.appointmentDate, today),
          lte(appointments.appointmentDate, tomorrow)
        )
      );

    // Calculate monthly revenue (current month)
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // This is a placeholder - you'll need to implement billing sum
    // const [monthlyRevenue] = await db
    //   .select({ sum: sql<number>`COALESCE(SUM(${billings.totalAmount}), 0)` })
    //   .from(billings)
    //   .where(
    //     and(
    //       gte(billings.createdAt, firstDayOfMonth),
    //       lte(billings.createdAt, lastDayOfMonth)
    //     )
    //   );

    return {
      totalPatients: totalPatients.count,
      totalDoctors: totalDoctors.count,
      todayAppointments: todayAppointments.count,
      monthlyRevenue: 0, // Will be calculated from billings table
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    throw new Error("Failed to fetch statistics");
  }
}

// Get recent appointments with details
export async function getRecentAppointments(limit = 10) {
  await requireAdmin();

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recentAppointments = await db.query.appointments.findMany({
      where: gte(appointments.appointmentDate, today),
      limit,
      orderBy: (appointments, { asc }) => [asc(appointments.appointmentDate)],
      with: {
        patient: {
          columns: {
            id: true,
            userId: true,
          },
        },
        doctor: {
          columns: {
            id: true,
            userId: true,
          },
        },
        department: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    // We need to fetch user names separately since Better Auth users aren't in Drizzle schema
    // For now, return basic info - you can enhance this by joining with user table
    return recentAppointments.map((apt) => ({
      id: apt.id,
      patientName: "Patient", // TODO: Fetch from Better Auth user
      doctorName: "Doctor", // TODO: Fetch from Better Auth user
      department: apt.department?.name || "N/A",
      time: apt.appointmentTime,
      date: apt.appointmentDate,
      status: apt.status,
    }));
  } catch (error) {
    console.error("Error fetching recent appointments:", error);
    throw new Error("Failed to fetch appointments");
  }
}

// Get department statistics
export async function getDepartmentStats() {
  await requireAdmin();

  try {
    const departmentList = await db.query.departments.findMany({
      where: eq(departments.isActive, true),
      with: {
        doctors: {
          where: eq(doctors.isActive, true),
        },
      },
    });

    // Count patients per department through doctors
    const stats = await Promise.all(
      departmentList.map(async (dept) => {
        // Count appointments for this department
        const [appointmentCount] = await db
          .select({ count: count() })
          .from(appointments)
          .where(eq(appointments.departmentId, dept.id));

        return {
          id: dept.id,
          name: dept.name,
          doctors: dept.doctors.length,
          patients: appointmentCount.count, // Using appointment count as proxy
        };
      })
    );

    return stats;
  } catch (error) {
    console.error("Error fetching department stats:", error);
    throw new Error("Failed to fetch department statistics");
  }
}

// Get all departments
export async function getDepartments() {
  await requireAdmin();

  try {
    return await db.query.departments.findMany({
      where: eq(departments.isActive, true),
      orderBy: (departments, { asc }) => [asc(departments.name)],
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw new Error("Failed to fetch departments");
  }
}