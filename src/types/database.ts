import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  departments,
  doctors,
  patients,
  appointments,
  medicalRecords,
  prescriptions,
  labTests,
  rooms,
  roomAssignments,
  billings,
} from "@/lib/db/schema";

// Select Types (what you get from database)
export type Department = InferSelectModel<typeof departments>;
export type Doctor = InferSelectModel<typeof doctors>;
export type Patient = InferSelectModel<typeof patients>;
export type Appointment = InferSelectModel<typeof appointments>;
export type MedicalRecord = InferSelectModel<typeof medicalRecords>;
export type Prescription = InferSelectModel<typeof prescriptions>;
export type LabTest = InferSelectModel<typeof labTests>;
export type Room = InferSelectModel<typeof rooms>;
export type RoomAssignment = InferSelectModel<typeof roomAssignments>;
export type Billing = InferSelectModel<typeof billings>;

// Insert Types (what you send to database)
export type NewDepartment = InferInsertModel<typeof departments>;
export type NewDoctor = InferInsertModel<typeof doctors>;
export type NewPatient = InferInsertModel<typeof patients>;
export type NewAppointment = InferInsertModel<typeof appointments>;
export type NewMedicalRecord = InferInsertModel<typeof medicalRecords>;
export type NewPrescription = InferInsertModel<typeof prescriptions>;
export type NewLabTest = InferInsertModel<typeof labTests>;
export type NewRoom = InferInsertModel<typeof rooms>;
export type NewRoomAssignment = InferInsertModel<typeof roomAssignments>;
export type NewBilling = InferInsertModel<typeof billings>;

// Extended types with relations
export type AppointmentWithDetails = Appointment & {
  patient: Patient;
  doctor: Doctor & {
    user: {
      name: string;
      email: string;
    };
  };
  department?: Department;
};

export type DoctorWithDetails = Doctor & {
  user: {
    name: string;
    email: string;
    image?: string;
  };
  department?: Department;
};



export type PatientWithDetails = Patient & {
  user: {
    name: string;
    email: string;
    image?: string;
    banned?: boolean; // <-- ADD THIS LINE
  };
};