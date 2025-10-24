"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import LoginButton from "./google-auth";
import { Separator } from "../ui/separator";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";

function AuthLayout() {
  const [activeTab, setActiveTab] = useState("login");
  

  

  return (
    <div className="flex justify-center items-center min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Hospital Management System
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access your account
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card rounded-xl shadow-lg border p-6 sm:p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6 w-full h-11">
              <TabsTrigger value="login" className="text-sm sm:text-base">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="text-sm sm:text-base">
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <LoginForm ifNotExists={() => setActiveTab("register")}/>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <RegisterForm onSuccess={() => setActiveTab("login")} />
            </TabsContent>
          </Tabs>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <LoginButton />
          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="#" className="underline hover:text-foreground">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline hover:text-foreground">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        {/* Help Section */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <a href="#" className="font-medium underline hover:text-foreground">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;