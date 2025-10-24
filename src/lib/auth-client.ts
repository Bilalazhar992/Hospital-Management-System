"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  plugins: [adminClient()],
});

// Export all auth methods
export const {
  signUp,
  signIn,
  signOut,
  useSession,
  verifyEmail,
  sendVerificationEmail,
  forgetPassword,
  resetPassword,
  $Infer,
} = authClient;

// Get current user
export function useUser() {
  const { data: session, isPending, error } = useSession();
  return {
    user: session?.user,
    isPending,
    error,
  };
}

// Get current user role
export function useRole() {
  const { user } = useUser();
  return user?.role as "admin" | "doctor" | "nurse" | "receptionist" | "patient" | undefined;
}

// Check if user is admin
export function useIsAdmin() {
  const role = useRole();
  return role === "admin";
}

// Check if user is doctor
export function useIsDoctor() {
  const role = useRole();
  return role === "doctor";
}

// Check if user is nurse
export function useIsNurse() {
  const role = useRole();
  return role === "nurse";
}

// Check if user is receptionist
export function useIsReceptionist() {
  const role = useRole();
  return role === "receptionist";
}

// Check if user is patient
export function useIsPatient() {
  const role = useRole();
  return role === "patient";
}

// Check if user is staff (not patient)
export function useIsStaff() {
  const role = useRole();
  return role !== undefined && ["admin", "doctor", "nurse", "receptionist"].includes(role);
}

// Check if user has specific roles
export function useHasRole(allowedRoles: string[]) {
  const role = useRole();
  return role !== undefined && allowedRoles.includes(role);
}