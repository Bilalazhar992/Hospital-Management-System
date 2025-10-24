
import { pgTable, text, timestamp, uuid, varchar, boolean, integer, decimal, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});


// ============================================
// ENUMS
// ============================================

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "confirmed", 
  "in_progress",
  "completed",
  "cancelled",
  "no_show"
]);

export const appointmentTypeEnum = pgEnum("appointment_type", [
  "consultation",
  "follow_up",
  "emergency",
  "surgery",
  "checkup"
]);

export const prescriptionStatusEnum = pgEnum("prescription_status", [
  "active",
  "completed",
  "cancelled"
]);

export const labTestStatusEnum = pgEnum("lab_test_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled"
]);

export const roomTypeEnum = pgEnum("room_type", [
  "general",
  "private",
  "icu",
  "emergency",
  "operation_theater"
]);

export const roomStatusEnum = pgEnum("room_status", [
  "available",
  "occupied",
  "maintenance",
  "reserved"
]);

export const billingStatusEnum = pgEnum("billing_status", [
  "pending",
  "paid",
  "partially_paid",
  "cancelled"
]);

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const bloodGroupEnum = pgEnum("blood_group", [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
]);

// ============================================
// DEPARTMENTS
// ============================================

export const departments = pgTable("departments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  floor: integer("floor"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// DOCTOR PROFILES (Extended user data)
// ============================================

export const doctors = pgTable("doctors", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(), // Links to Better Auth user
  specialization: varchar("specialization", { length: 100 }).notNull(),
  qualification: text("qualification").notNull(),
  experience: integer("experience"), // Years of experience
  departmentId: uuid("department_id").references(() => departments.id),
  licenseNumber: varchar("license_number", { length: 50 }).unique(),
  consultationFee: decimal("consultation_fee", { precision: 10, scale: 2 }),
  bio: text("bio"),
  availableFrom: varchar("available_from", { length: 5 }), // e.g., "09:00"
  availableTo: varchar("available_to", { length: 5 }), // e.g., "17:00"
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// PATIENT PROFILES (Extended user data)
// ============================================

export const patients = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(), // Links to Better Auth user
  dateOfBirth: timestamp("date_of_birth"),
  gender: genderEnum("gender"),
  bloodGroup: bloodGroupEnum("blood_group"),
  address: text("address"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  emergencyContactName: varchar("emergency_contact_name", { length: 100 }),
  emergencyContactNumber: varchar("emergency_contact_number", { length: 20 }),
  allergies: text("allergies"), // JSON or comma-separated
  chronicDiseases: text("chronic_diseases"), // JSON or comma-separated
  currentMedications: text("current_medications"),
  insuranceProvider: varchar("insurance_provider", { length: 100 }),
  insuranceNumber: varchar("insurance_number", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// APPOINTMENTS
// ============================================

export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  doctorId: uuid("doctor_id").references(() => doctors.id).notNull(),
  departmentId: uuid("department_id").references(() => departments.id),
  appointmentDate: timestamp("appointment_date").notNull(),
  appointmentTime: varchar("appointment_time", { length: 5 }).notNull(), // e.g., "10:30"
  appointmentType: appointmentTypeEnum("appointment_type").default("consultation").notNull(),
  status: appointmentStatusEnum("status").default("scheduled").notNull(),
  reasonForVisit: text("reason_for_visit"),
  notes: text("notes"), // Doctor's notes after appointment
  duration: integer("duration").default(30), // Minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// MEDICAL RECORDS
// ============================================

export const medicalRecords = pgTable("medical_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  doctorId: uuid("doctor_id").references(() => doctors.id).notNull(),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  diagnosis: text("diagnosis").notNull(),
  symptoms: text("symptoms"),
  treatment: text("treatment"),
  notes: text("notes"),
  followUpDate: timestamp("follow_up_date"),
  attachments: text("attachments"), // JSON array of file URLs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// PRESCRIPTIONS
// ============================================

export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  doctorId: uuid("doctor_id").references(() => doctors.id).notNull(),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  medicalRecordId: uuid("medical_record_id").references(() => medicalRecords.id),
  medicationName: varchar("medication_name", { length: 200 }).notNull(),
  dosage: varchar("dosage", { length: 100 }).notNull(),
  frequency: varchar("frequency", { length: 100 }).notNull(), // e.g., "3 times a day"
  duration: varchar("duration", { length: 50 }).notNull(), // e.g., "7 days"
  instructions: text("instructions"),
  status: prescriptionStatusEnum("status").default("active").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// LAB TESTS
// ============================================

export const labTests = pgTable("lab_tests", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  doctorId: uuid("doctor_id").references(() => doctors.id).notNull(),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  testName: varchar("test_name", { length: 200 }).notNull(),
  testType: varchar("test_type", { length: 100 }).notNull(), // Blood, Urine, X-Ray, etc.
  description: text("description"),
  status: labTestStatusEnum("status").default("pending").notNull(),
  results: text("results"), // JSON or text results
  resultDate: timestamp("result_date"),
  attachments: text("attachments"), // JSON array of file URLs
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// ROOMS / BEDS
// ============================================

export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomNumber: varchar("room_number", { length: 20 }).notNull().unique(),
  roomType: roomTypeEnum("room_type").notNull(),
  departmentId: uuid("department_id").references(() => departments.id),
  floor: integer("floor").notNull(),
  capacity: integer("capacity").default(1).notNull(),
  currentOccupancy: integer("current_occupancy").default(0).notNull(),
  status: roomStatusEnum("status").default("available").notNull(),
  pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }),
  facilities: text("facilities"), // JSON array of facilities
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// ROOM ASSIGNMENTS (Patient admissions)
// ============================================

export const roomAssignments = pgTable("room_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").references(() => rooms.id).notNull(),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  doctorId: uuid("doctor_id").references(() => doctors.id).notNull(),
  admissionDate: timestamp("admission_date").defaultNow().notNull(),
  dischargeDate: timestamp("discharge_date"),
  reason: text("reason"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// BILLING / INVOICES
// ============================================

export const billings = pgTable("billings", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  roomAssignmentId: uuid("room_assignment_id").references(() => roomAssignments.id),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0.00"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0.00"),
  status: billingStatusEnum("status").default("pending").notNull(),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  paymentMethod: varchar("payment_method", { length: 50 }), // Cash, Card, Insurance
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// RELATIONS
// ============================================

export const departmentsRelations = relations(departments, ({ many }) => ({
  doctors: many(doctors),
  rooms: many(rooms),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  department: one(departments, {
    fields: [doctors.departmentId],
    references: [departments.id],
  }),
  appointments: many(appointments),
  medicalRecords: many(medicalRecords),
  prescriptions: many(prescriptions),
  labTests: many(labTests),
  roomAssignments: many(roomAssignments),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
  medicalRecords: many(medicalRecords),
  prescriptions: many(prescriptions),
  labTests: many(labTests),
  roomAssignments: many(roomAssignments),
  billings: many(billings),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
  department: one(departments, {
    fields: [appointments.departmentId],
    references: [departments.id],
  }),
  medicalRecords: many(medicalRecords),
  prescriptions: many(prescriptions),
  labTests: many(labTests),
  billings: many(billings),
}));

export const medicalRecordsRelations = relations(medicalRecords, ({ one, many }) => ({
  patient: one(patients, {
    fields: [medicalRecords.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [medicalRecords.doctorId],
    references: [doctors.id],
  }),
  appointment: one(appointments, {
    fields: [medicalRecords.appointmentId],
    references: [appointments.id],
  }),
  prescriptions: many(prescriptions),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  patient: one(patients, {
    fields: [prescriptions.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [prescriptions.doctorId],
    references: [doctors.id],
  }),
  appointment: one(appointments, {
    fields: [prescriptions.appointmentId],
    references: [appointments.id],
  }),
  medicalRecord: one(medicalRecords, {
    fields: [prescriptions.medicalRecordId],
    references: [medicalRecords.id],
  }),
}));

export const labTestsRelations = relations(labTests, ({ one }) => ({
  patient: one(patients, {
    fields: [labTests.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [labTests.doctorId],
    references: [doctors.id],
  }),
  appointment: one(appointments, {
    fields: [labTests.appointmentId],
    references: [appointments.id],
  }),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  department: one(departments, {
    fields: [rooms.departmentId],
    references: [departments.id],
  }),
  roomAssignments: many(roomAssignments),
}));

export const roomAssignmentsRelations = relations(roomAssignments, ({ one, many }) => ({
  room: one(rooms, {
    fields: [roomAssignments.roomId],
    references: [rooms.id],
  }),
  patient: one(patients, {
    fields: [roomAssignments.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [roomAssignments.doctorId],
    references: [doctors.id],
  }),
  billings: many(billings),
}));

export const billingsRelations = relations(billings, ({ one }) => ({
  patient: one(patients, {
    fields: [billings.patientId],
    references: [patients.id],
  }),
  appointment: one(appointments, {
    fields: [billings.appointmentId],
    references: [appointments.id],
  }),
  roomAssignment: one(roomAssignments, {
    fields: [billings.roomAssignmentId],
    references: [roomAssignments.id],
  }),
}));