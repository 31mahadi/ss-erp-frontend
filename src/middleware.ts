import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for route protection and basic auth checks
 * 
 * Note: Full authentication is handled client-side via zustand store.
 * This middleware provides:
 * - Redirect root "/" to dashboard
 * - Basic cookie-based checks (optional, not blocking)
 * 
 * The client-side PrivateLayout handles actual auth checks and redirects.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for refresh token cookie (set by backend as HTTP-only)
  // Cookie name is "refreshToken" (camelCase) as set by backend
  const hasRefreshToken = request.cookies.has("refreshToken");
  
  // Redirect root to appropriate page
  if (pathname === "/") {
    if (hasRefreshToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // Redirect authenticated users away from login page
  if (pathname === "/login" && hasRefreshToken) {
    // Check for redirect param
    const redirect = request.nextUrl.searchParams.get("redirect");
    const destination = redirect && redirect !== "/login" ? redirect : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Let all other routes pass through
  // Client-side auth will handle protection for private routes
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
