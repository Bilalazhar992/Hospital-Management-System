"use client";

import Link from "next/link";
import { signOut, useRole, useUser } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  LogOut,
  Settings,
  Activity,
  Users,
  Calendar,
  FileText,
  Building2,
  Stethoscope,
  UserPlus,
  ClipboardList,
  LayoutDashboard,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Header() {
  const { user, isPending } = useUser();
  const role = useRole();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    router.push("/auth");
    router.refresh();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role?: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-500",
      doctor: "bg-blue-500",
      nurse: "bg-green-500",
      receptionist: "bg-purple-500",
      patient: "bg-orange-500",
    };
    return (role && colors[role]) || "bg-gray-500";
  };

  // Role-based navigation links
  const getNavigationLinks = () => {
    if (!user || !role) return [];

    const navLinks: Record<string, Array<{ href: string; label: string; icon: any }>> = {
      admin: [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/departments", label: "Departments", icon: Building2 },
        { href: "/admin/users", label: "Users", icon: Users },
        { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
        { href: "/admin/rooms", label: "Rooms", icon: Building2 },
        { href: "/admin/analytics", label: "Analytics", icon: Activity },
      ],
      doctor: [
        { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/doctor/appointments", label: "Appointments", icon: Calendar },
        { href: "/doctor/patients", label: "Patients", icon: Users },
        { href: "/doctor/prescriptions", label: "Prescriptions", icon: FileText },
        { href: "/doctor/schedule", label: "Schedule", icon: ClipboardList },
      ],
      nurse: [
        { href: "/nurse/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/nurse/patients", label: "Patients", icon: Users },
        { href: "/nurse/appointments", label: "Appointments", icon: Calendar },
        { href: "/nurse/tasks", label: "Tasks", icon: ClipboardList },
      ],
      receptionist: [
        { href: "/receptionist/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/receptionist/register", label: "Register Patient", icon: UserPlus },
        { href: "/receptionist/appointments", label: "Appointments", icon: Calendar },
        { href: "/receptionist/patients", label: "Patients", icon: Users },
      ],
      patient: [
        { href: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/patient/appointments", label: "My Appointments", icon: Calendar },
        { href: "/patient/records", label: "Medical Records", icon: FileText },
        { href: "/patient/prescriptions", label: "Prescriptions", icon: FileText },
      ],
    };

    return navLinks[role] || [];
  };

  const navigationLinks = getNavigationLinks();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Hospital MS
              </span>
              {user && (
                <p className="text-xs text-muted-foreground capitalize">
                  {role} Portal
                </p>
              )}
            </div>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1">
              {navigationLinks.slice(0, 5).map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "gap-2",
                        isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden lg:inline">{link.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Side */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />

            {isPending ? (
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.image || ""}
                        alt={user.name || "User"}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                        {getInitials(user.name || "User")}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background",
                        getRoleBadgeColor(role)
                      )}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm font-semibold leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            getRoleBadgeColor(role)
                          )}
                        />
                        <span className="text-xs font-medium capitalize">
                          {role}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Mobile Navigation Links */}
                  <div className="md:hidden">
                    {navigationLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <DropdownMenuItem key={link.href} asChild>
                          <Link href={link.href} className="cursor-pointer">
                            <Icon className="mr-2 h-4 w-4" />
                            <span>{link.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                  </div>

                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span>Sign In</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}