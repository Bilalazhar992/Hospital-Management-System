"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { forgetPassword } from "@/lib/auth-client";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await forgetPassword({
        email: values.email,
        redirectTo: "/reset-password",
      });

      if (error) {
        // Even if user doesn't exist, we show success for security
        // (don't reveal if email exists in system)
        console.error("Forget password error:", error);
      }

      // Always show success message for security
      setUserEmail(values.email);
      setEmailSent(true);
      
      toast.success("Check your email", {
        description: "If an account exists, you'll receive a password reset link",
      });
    } catch (e) {
      console.error("Forgot password error:", e);
      toast.error("Something went wrong", {
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Success view after email is sent
  if (emailSent) {
    return (
      <div className="flex justify-center items-center min-h-screen px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Check Your Email
            </h1>
            <p className="text-sm text-muted-foreground">
              Password reset instructions sent
            </p>
          </div>

          {/* Success Card */}
          <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8 space-y-6">
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <Mail className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                Email Sent Successfully
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                We've sent password reset instructions to{" "}
                <span className="font-medium">{userEmail}</span>
              </AlertDescription>
            </Alert>

            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p className="font-medium text-foreground">Next steps:</p>
                <ol className="list-decimal list-inside space-y-1.5 ml-2">
                  <li>Check your email inbox</li>
                  <li>Click the password reset link</li>
                  <li>Create a new password</li>
                  <li>Sign in with your new password</li>
                </ol>
              </div>

              <div className="pt-4 border-t">
                <p className="font-medium text-foreground mb-2">
                  Didn't receive the email?
                </p>
                <ul className="space-y-1.5 ml-2">
                  <li>• Check your spam or junk folder</li>
                  <li>• Make sure you entered the correct email</li>
                  <li>• Wait a few minutes and check again</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                onClick={() => {
                  setEmailSent(false);
                  form.reset();
                }}
                variant="outline"
                className="w-full"
              >
                Try Another Email
              </Button>

              <Link href="/auth" className="block">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>

          {/* Help Section */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Still need help?{" "}
              <a href="#" className="font-medium underline hover:text-foreground">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main forgot password form
  return (
    <div className="flex justify-center items-center min-h-screen px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Forgot Password?</h1>
          <p className="text-sm text-muted-foreground">
            No worries! Enter your email and we'll send you reset instructions
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          className="pl-10"
                          disabled={isLoading}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Info Alert */}
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertTitle>Privacy Notice</AlertTitle>
                <AlertDescription>
                  For security reasons, we'll send instructions even if the email
                  isn't registered in our system.
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  "Send Reset Instructions"
                )}
              </Button>

              {/* Back to Login */}
              <div className="text-center">
                <Link href="/auth">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    disabled={isLoading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </div>

        {/* Help Section */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link
              href="/auth"
              className="font-medium text-primary underline hover:text-primary/90"
            >
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}