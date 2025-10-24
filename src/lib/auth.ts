import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/index";

import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";

// Define all hospital roles
export const roles = {
  ADMIN: "admin",
  DOCTOR: "doctor",
  NURSE: "nurse",
  RECEPTIONIST: "receptionist",
  PATIENT: "patient",
} as const;

export type UserRole = typeof roles[keyof typeof roles];

export const auth = betterAuth({
  appName: "Hospital Management System",
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  // Email and Password Authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: false, // User must verify email first
    sendResetPassword: async ({ user, url }) => {
      try {
        await sendPasswordResetEmail(user.email, url);
      } catch (error) {
        console.error("Failed to send password reset email:", error);
        throw error;
      }
    },
  },

  // Email Verification
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24, // 24 hours
    sendVerificationEmail: async ({ user, url }) => {
      try {
        await sendVerificationEmail(user.email, url, user.name);
      } catch (error) {
        console.error("Failed to send verification email:", error);
        throw error;
      }
    },
  },

  // Google OAuth
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      enabled: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
      mapProfileToUser: (profile) => {
        return {
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: true, // Google emails are pre-verified
          role: roles.PATIENT, // Default role for social sign-in
        };
      },
    },
  },

  // Plugins
  plugins: [
    admin({
      adminRoles: [roles.ADMIN],
      defaultRole: roles.PATIENT,
    }),
    nextCookies(),
  ],

  // Session Configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Security Settings
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: false,
    },
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  },

  // Rate Limiting (optional but recommended)
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute window
    max: 10, // 10 requests per minute
  },

  // Trust Host (important for production)
  trustedOrigins: [
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  ],
});

// Export types for use in your app
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
