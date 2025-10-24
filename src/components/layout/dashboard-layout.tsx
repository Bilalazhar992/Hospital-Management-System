"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRole } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Building2,
  Stethoscope,
  UserPlus,
  ClipboardList,
  Activity,
  Bed,
  DollarSign,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const role = useRole();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Role-based sidebar navigation
  const getSidebarItems = (): NavItem[] => {
    const sidebarItems: Record<string, NavItem[]> = {
      admin: [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/departments", label: "Departments", icon: Building2 },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
        { href: "/admin/patients", label: "Patients", icon: Users },
        { href: "/admin/rooms", label: "Rooms", icon: Bed },
        { href: "/admin/billing", label: "Billing", icon: DollarSign },
        { href: "/admin/analytics", label: "Analytics", icon: Activity },
        { href: "/admin/settings", label: "Settings", icon: Settings },
      ],
      doctor: [
        { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/doctor/appointments", label: "Appointments", icon: Calendar },
        { href: "/doctor/patients", label: "My Patients", icon: Users },
        { href: "/doctor/prescriptions", label: "Prescriptions", icon: FileText },
        { href: "/doctor/lab-tests", label: "Lab Tests", icon: ClipboardList },
        { href: "/doctor/schedule", label: "My Schedule", icon: Calendar },
        { href: "/doctor/profile", label: "Profile", icon: Settings },
      ],
      nurse: [
        { href: "/nurse/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/nurse/patients", label: "Patients", icon: Users },
        { href: "/nurse/appointments", label: "Appointments", icon: Calendar },
        { href: "/nurse/tasks", label: "My Tasks", icon: ClipboardList },
        { href: "/nurse/rooms", label: "Rooms", icon: Bed },
        { href: "/nurse/profile", label: "Profile", icon: Settings },
      ],
      receptionist: [
        { href: "/receptionist/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/receptionist/register", label: "Register Patient", icon: UserPlus },
        { href: "/receptionist/appointments", label: "Appointments", icon: Calendar },
        { href: "/receptionist/patients", label: "Patients", icon: Users },
        { href: "/receptionist/billing", label: "Billing", icon: DollarSign },
        { href: "/receptionist/profile", label: "Profile", icon: Settings },
      ],
      patient: [
        { href: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/patient/appointments", label: "My Appointments", icon: Calendar },
        { href: "/patient/records", label: "Medical Records", icon: FileText },
        { href: "/patient/prescriptions", label: "Prescriptions", icon: FileText },
        { href: "/patient/lab-results", label: "Lab Results", icon: ClipboardList },
        { href: "/patient/billing", label: "Billing", icon: DollarSign },
        { href: "/patient/profile", label: "Profile", icon: Settings },
      ],
    };

    return role ? sidebarItems[role] || [] : [];
  };

  const sidebarItems = getSidebarItems();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Hospital MS</h2>
            <p className="text-xs text-muted-foreground capitalize">{role} Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-11",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className="p-4">
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <p className="text-xs font-medium">Need Help?</p>
          <p className="text-xs text-muted-foreground">
            Contact support for assistance
          </p>
          <Button size="sm" variant="outline" className="w-full text-xs">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}