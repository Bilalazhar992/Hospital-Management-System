import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";

// Define role-based route access
const roleRoutes: Record<string, string[]> = {
  admin: ["/admin"],
  doctor: ["/doctor"],
  nurse: ["/nurse"],
  receptionist: ["/receptionist"],
  patient: ["/patient"],
};

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
];

// Routes that should redirect to dashboard if already logged in
const authRoutes = ["/auth", "/forgot-password", "/reset-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  try {
    // Get session using Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // No session - redirect to login
    if (!session?.user) {
      const url = new URL("/auth", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    const userRole = session.user.role as string;

    // If user is on auth page but logged in, redirect to their dashboard
    if (authRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(
        new URL(`/${userRole}/dashboard`, request.url)
      );
    }

    // Check role-based access
    const hasAccess = Object.entries(roleRoutes).some(([role, routes]) => {
      if (userRole === role) {
        return routes.some((route) => pathname.startsWith(route));
      }
      return false;
    });

    // If user doesn't have access to this route
    if (!hasAccess) {
      // Redirect to their own dashboard
      return NextResponse.redirect(
        new URL(`/${userRole}/dashboard`, request.url)
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, redirect to login
    return NextResponse.redirect(new URL("/auth", request.url));
  }
}

// Configure which routes to run middleware on
export const config = {
  runtime: 'nodejs', // Add this line
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};