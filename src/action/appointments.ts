"use server";

import { db } from "@/lib/db";
import { appointments, doctors, patients, departments } from "@/lib/db/schema";
import { eq, and, gte, lte, desc, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { roles } from "@/lib/auth";

// ============================================
// HELPER FUNCTIONS
// ============================================

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in");
  }
  return session.user;
}

async function requireStaffOrDoctor() {
  const user = await requireAuth();
  if (![roles.ADMIN, roles.RECEPTIONIST, roles.DOCTOR].includes(user.role as any)) {
    throw new Error("Unauthorized: Staff or Doctor access required");
  }
  return user;
}

// ============================================
// CREATE APPOINTMENT
// ============================================

export async function createAppointment(data: {
  patientId: string;
  doctorId: string;
  departmentId?: string;
  appointmentDate: Date;
  appointmentTime: string;
  appointmentType: "consultation" | "follow_up" | "emergency" | "surgery" | "checkup";
  reasonForVisit?: string;
}) {
  const user = await requireAuth();

  try {
    // Verify patient exists
    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, data.patientId),
    });

    if (!patient) {
      return { success: false, error: "Patient not found" };
    }

    // Verify doctor exists and is active
    const doctor = await db.query.doctors.findFirst({
      where: and(
        eq(doctors.id, data.doctorId),
        eq(doctors.isActive, true)
      ),
    });

    if (!doctor) {
      return { success: false, error: "Doctor not found or inactive" };
    }

    // Check if patient is booking for themselves (if patient role)
    if (user.role === roles.PATIENT) {
      if (patient.userId !== user.id) {
        return { success: false, error: "You can only book appointments for yourself" };
      }
    }

    // Check for conflicting appointments (same doctor, date, time)
    const conflictingAppointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.doctorId, data.doctorId),
        eq(appointments.appointmentDate, data.appointmentDate),
        eq(appointments.appointmentTime, data.appointmentTime),
        or(
          eq(appointments.status, "scheduled"),
          eq(appointments.status, "confirmed")
        )
      ),
    });

    if (conflictingAppointment) {
      return { 
        success: false, 
        error: "This time slot is already booked. Please choose another time." 
      };
    }

    // Create appointment
    const [newAppointment] = await db
      .insert(appointments)
      .values({
        patientId: data.patientId,
        doctorId: data.doctorId,
        departmentId: data.departmentId || doctor.departmentId || null,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        appointmentType: data.appointmentType,
        reasonForVisit: data.reasonForVisit || null,
        status: "scheduled",
      })
      .returning();

    revalidatePath("/admin/appointments");
    revalidatePath("/doctor/appointments");
    revalidatePath("/patient/appointments");
    revalidatePath("/receptionist/appointments");

    return { success: true, data: newAppointment };
  } catch (error) {
    console.error("Error creating appointment:", error);
    return { success: false, error: "Failed to create appointment" };
  }
}

// ============================================
// GET APPOINTMENTS
// ============================================

export async function getAppointments(filters?: {
  patientId?: string;
  doctorId?: string;
  departmentId?: string;
  status?: string;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
}) {
  const user = await requireAuth();

  try {
    const conditions = [];

    // Role-based filtering
    if (user.role === roles.PATIENT) {
      // Patients see only their appointments
      const patient = await db.query.patients.findFirst({
        where: eq(patients.userId, user.id),
      });
      if (patient) {
        conditions.push(eq(appointments.patientId, patient.id));
      }
    } else if (user.role === roles.DOCTOR) {
      // Doctors see only their appointments
      const doctor = await db.query.doctors.findFirst({
        where: eq(doctors.userId, user.id),
      });
      if (doctor) {
        conditions.push(eq(appointments.doctorId, doctor.id));
      }
    }

    // Additional filters
    if (filters?.patientId) {
      conditions.push(eq(appointments.patientId, filters.patientId));
    }

    if (filters?.doctorId) {
      conditions.push(eq(appointments.doctorId, filters.doctorId));
    }

    if (filters?.departmentId) {
      conditions.push(eq(appointments.departmentId, filters.departmentId));
    }

    if (filters?.status) {
      conditions.push(eq(appointments.status, filters.status as any));
    }

    if (filters?.date) {
      conditions.push(eq(appointments.appointmentDate, filters.date));
    }

    if (filters?.startDate && filters?.endDate) {
      conditions.push(
        and(
          gte(appointments.appointmentDate, filters.startDate),
          lte(appointments.appointmentDate, filters.endDate)
        )!
      );
    }

    const appointmentsList = await db.query.appointments.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(appointments.appointmentDate), desc(appointments.appointmentTime)],
      with: {
        patient: true,
        doctor: true,
        department: true,
      },
    });

    return appointmentsList;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw new Error("Failed to fetch appointments");
  }
}

// ============================================
// GET APPOINTMENT BY ID
// ============================================

export async function getAppointmentById(id: string) {
  const user = await requireAuth();

  try {
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
      with: {
        patient: true,
        doctor: true,
        department: true,
        medicalRecords: true,
        prescriptions: true,
        labTests: true,
      },
    });

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Authorization check
    if (user.role === roles.PATIENT) {
      const patient = await db.query.patients.findFirst({
        where: eq(patients.userId, user.id),
      });
      if (!patient || appointment.patientId !== patient.id) {
        throw new Error("Unauthorized access");
      }
    } else if (user.role === roles.DOCTOR) {
      const doctor = await db.query.doctors.findFirst({
        where: eq(doctors.userId, user.id),
      });
      if (!doctor || appointment.doctorId !== doctor.id) {
        throw new Error("Unauthorized access");
      }
    }

    return appointment;
  } catch (error) {
    console.error("Error fetching appointment:", error);
    throw new Error("Failed to fetch appointment details");
  }
}

// ============================================
// UPDATE APPOINTMENT STATUS
// ============================================

export async function updateAppointmentStatus(
  id: string,
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show"
) {
  await requireStaffOrDoctor();

  try {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning();

    revalidatePath("/admin/appointments");
    revalidatePath("/doctor/appointments");
    revalidatePath("/patient/appointments");
    revalidatePath("/receptionist/appointments");

    return { success: true, data: updatedAppointment };
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return { success: false, error: "Failed to update appointment status" };
  }
}

// ============================================
// RESCHEDULE APPOINTMENT
// ============================================

export async function rescheduleAppointment(
  id: string,
  data: {
    appointmentDate: Date;
    appointmentTime: string;
  }
) {
  await requireStaffOrDoctor();

  try {
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
    });

    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    // Check for conflicts
    const conflictingAppointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.doctorId, appointment.doctorId),
        eq(appointments.appointmentDate, data.appointmentDate),
        eq(appointments.appointmentTime, data.appointmentTime),
        or(
          eq(appointments.status, "scheduled"),
          eq(appointments.status, "confirmed")
        )
      ),
    });

    if (conflictingAppointment && conflictingAppointment.id !== id) {
      return { success: false, error: "This time slot is already booked" };
    }

    const [rescheduledAppointment] = await db
      .update(appointments)
      .set({
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning();

    revalidatePath("/admin/appointments");
    revalidatePath("/doctor/appointments");
    revalidatePath("/patient/appointments");
    revalidatePath("/receptionist/appointments");

    return { success: true, data: rescheduledAppointment };
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    return { success: false, error: "Failed to reschedule appointment" };
  }
}

// ============================================
// CANCEL APPOINTMENT
// ============================================

export async function cancelAppointment(id: string) {
  const user = await requireAuth();

  try {
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
    });

    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    // Patients can only cancel their own appointments
    if (user.role === roles.PATIENT) {
      const patient = await db.query.patients.findFirst({
        where: eq(patients.userId, user.id),
      });
      if (!patient || appointment.patientId !== patient.id) {
        return { success: false, error: "Unauthorized" };
      }
    }

    const [cancelledAppointment] = await db
      .update(appointments)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning();

    revalidatePath("/admin/appointments");
    revalidatePath("/doctor/appointments");
    revalidatePath("/patient/appointments");
    revalidatePath("/receptionist/appointments");

    return { success: true, data: cancelledAppointment };
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return { success: false, error: "Failed to cancel appointment" };
  }
}

// ============================================
// GET AVAILABLE TIME SLOTS
// ============================================

export async function getAvailableTimeSlots(doctorId: string, date: Date) {
  await requireAuth();

  try {
    const doctor = await db.query.doctors.findFirst({
      where: eq(doctors.id, doctorId),
    });

    if (!doctor || !doctor.availableFrom || !doctor.availableTo) {
      return [];
    }

    // Get all booked slots for this doctor on this date
    const bookedAppointments = await db.query.appointments.findMany({
      where: and(
        eq(appointments.doctorId, doctorId),
        eq(appointments.appointmentDate, date),
        or(
          eq(appointments.status, "scheduled"),
          eq(appointments.status, "confirmed")
        )
      ),
    });

    const bookedTimes = bookedAppointments.map((apt) => apt.appointmentTime);

    // Generate time slots (example: 30-minute intervals)
    const slots = [];
    const [startHour, startMin] = doctor.availableFrom.split(":").map(Number);
    const [endHour, endMin] = doctor.availableTo.split(":").map(Number);

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += 30) {
        if (hour === startHour && min < startMin) continue;
        if (hour === endHour - 1 && min >= endMin) continue;

        const timeStr = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
        if (!bookedTimes.includes(timeStr)) {
          slots.push(timeStr);
        }
      }
    }

    return slots;
  } catch (error) {
    console.error("Error fetching time slots:", error);
    return [];
  }
}