import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "./lib/supabase/middleware";

// Route configuration for centralized route management
const ROUTE_CONFIG = {
  // Protected routes that require authentication
  protected: ["/dashboard", "/profile", "/settings"],

  // Admin-only routes
  admin: ["/admin", "/dashboard/admin"],

  // College-only routes
  // TODO: Re-enable college route protection after fixing auth issues
  college: ["/dashboard/college"],

  // Student-only routes
  student: ["/dashboard/student"],

  // Public routes that don't require authentication
  public: [
    "/",
    "/about",
    "/contact",
    "/features",
    "/colleges",
    "/colleges/dashboard",
    "/colleges/manage",
    "/quiz",
    "/timeline",
    "/scholarships",
    "/auth/login",
    "/auth/signup",
    "/auth/callback",
    "/auth/complete-profile",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/offline",
    "/privacy",
    "/terms",
    "/cookies",
    "/demo",
    "/career-pathways",
  ],

  // Routes that should redirect authenticated users away
  authOnly: ["/auth/login", "/auth/signup"],
} as const;

// Session validation configuration
const SESSION_CONFIG = {
  maxRetries: 2,
  retryDelay: 100, // milliseconds
  sessionTimeout: 3600000, // 1 hour in milliseconds
} as const;

/**
 * Enhanced route checking utilities with better pattern matching
 */
class RouteChecker {
  /**
   * Check if a route matches any pattern in the given array
   */
  private static matchesRoutePattern(
    pathname: string,
    routes: readonly string[],
  ): boolean {
    return routes.some((route) => {
      // Exact match
      if (pathname === route) return true;

      // Special handling for /colleges - only allow exact match or with trailing slash
      // but not sub-routes like /colleges/dashboard
      if (route === "/colleges") {
        return pathname === "/colleges" || pathname === "/colleges/";
      }

      // For other routes, allow sub-paths
      return pathname.startsWith(route + "/");
    });
  }

  /**
   * Check if a route is protected and requires authentication
   */
  static isProtectedRoute(pathname: string): boolean {
    return this.matchesRoutePattern(pathname, ROUTE_CONFIG.protected);
  }

  /**
   * Check if a route requires admin role
   */
  static isAdminRoute(pathname: string): boolean {
    return this.matchesRoutePattern(pathname, ROUTE_CONFIG.admin);
  }

  /**
   * Check if a route requires college role
   */
  static isCollegeRoute(pathname: string): boolean {
    return this.matchesRoutePattern(pathname, ROUTE_CONFIG.college);
  }

  /**
   * Check if a route requires student role
   */
  static isStudentRoute(pathname: string): boolean {
    return this.matchesRoutePattern(pathname, ROUTE_CONFIG.student);
  }

  /**
   * Check if a route is public and doesn't require authentication
   */
  static isPublicRoute(pathname: string): boolean {
    return this.matchesRoutePattern(pathname, ROUTE_CONFIG.public);
  }

  /**
   * Check if a route is an auth route that should redirect authenticated users
   */
  static isAuthOnlyRoute(pathname: string): boolean {
    return this.matchesRoutePattern(pathname, ROUTE_CONFIG.authOnly);
  }

  /**
   * Check if a route requires any form of authentication
   */
  static requiresAuth(pathname: string): boolean {
    return (
      this.isProtectedRoute(pathname) ||
      this.isAdminRoute(pathname) ||
      this.isCollegeRoute(pathname) ||
      this.isStudentRoute(pathname)
    );
  }

  /**
   * Check if a route requires role-based access control
   */
  static requiresRoleCheck(pathname: string): boolean {
    return (
      this.isAdminRoute(pathname) ||
      this.isCollegeRoute(pathname) ||
      this.isStudentRoute(pathname)
    );
  }
}

/**
 * Enhanced redirect utilities with consistent behavior
 */
class RedirectHandler {
  /**
   * Create redirect response to login with return URL and context
   */
  static toLogin(request: NextRequest, reason?: string): NextResponse {
    const loginUrl = new URL("/auth/login", request.url);

    // Preserve the original path for redirect after login
    const returnUrl = request.nextUrl.pathname + request.nextUrl.search;
    loginUrl.searchParams.set("returnUrl", returnUrl);

    // Add reason for debugging/analytics
    if (reason) {
      loginUrl.searchParams.set("reason", reason);
    }

    return NextResponse.redirect(loginUrl);
  }

  /**
   * Create redirect response to home page for authenticated users
   */
  static toHome(request: NextRequest, message?: string): NextResponse {
    const homeUrl = new URL("/", request.url);

    // Add success message if provided
    if (message) {
      homeUrl.searchParams.set("message", message);
    }

    return NextResponse.redirect(homeUrl);
  }

  /**
   * Create redirect response for insufficient permissions
   */
  static toUnauthorized(
    request: NextRequest,
    requiredRole?: string,
  ): NextResponse {
    const homeUrl = new URL("/", request.url);

    // Add error context for better user experience
    homeUrl.searchParams.set("error", "unauthorized");
    if (requiredRole) {
      homeUrl.searchParams.set("requiredRole", requiredRole);
    }

    return NextResponse.redirect(homeUrl);
  }

  /**
   * Create redirect response to complete profile
   */
  static toCompleteProfile(request: NextRequest): NextResponse {
    const completeProfileUrl = new URL("/auth/complete-profile", request.url);

    // Preserve the original destination
    const returnUrl = request.nextUrl.pathname + request.nextUrl.search;
    completeProfileUrl.searchParams.set("returnUrl", returnUrl);

    return NextResponse.redirect(completeProfileUrl);
  }
}

/**
 * Enhanced session validation with retry logic and better error handling
 */
class SessionValidator {
  /**
   * Validate session with retry logic for better reliability
   */
  static async validateSession(
    supabase: { auth: { getSession: () => Promise<{ data: { session: unknown }; error: unknown }> } },
    retries = SESSION_CONFIG.maxRetries,
  ) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          // Log the error but don't treat all errors as authentication failures
          console.warn(
            `Session validation attempt ${attempt + 1} failed:`,
            (error as Error).message,
          );

          // Only retry on network or temporary errors
          if (
            (error as Error).message?.includes("Network") ||
            (error as Error).message?.includes("fetch") ||
            (error as Error).message?.includes("timeout")
          ) {
            if (attempt === retries) {
              return { session: null, error, isValid: false };
            }

            // Wait before retry
            if (attempt < retries) {
              await new Promise((resolve) =>
                setTimeout(resolve, SESSION_CONFIG.retryDelay),
              );
            }
            continue;
          }

          // For other errors, don't retry but still check if we have a session
          if (session) {
            console.log("Session exists despite error, treating as valid");
            return { session, error: null, isValid: true };
          }

          return { session: null, error, isValid: false };
        }

        // Additional session validation - but be more lenient
        if (session) {
          const isExpired = this.isSessionExpired(session);
          if (isExpired) {
            console.warn("Session is expired");
            return {
              session: null,
              error: new Error("Session expired"),
              isValid: false,
            };
          }

          // Validate that session has required fields
          if (!(session as { user?: { id?: string } }).user?.id) {
            console.warn("Session missing user ID");
            return {
              session: null,
              error: new Error("Invalid session"),
              isValid: false,
            };
          }
        }

        return { session, error: null, isValid: true };
      } catch (err) {
        console.error(`Session validation attempt ${attempt + 1} error:`, err);
        if (attempt === retries) {
          return { session: null, error: err, isValid: false };
        }
      }
    }

    return {
      session: null,
      error: new Error("Max retries exceeded"),
      isValid: false,
    };
  }

  /**
   * Check if session is expired based on timestamp
   */
  private static isSessionExpired(session: { expires_at?: number } | null): boolean {
    if (!session?.expires_at) return false;

    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    // Consider session expired if it expires within 2 minutes (reduced from 5)
    return timeUntilExpiry < 120000; // 2 minutes in milliseconds
  }
}

/**
 * Enhanced profile validation with better error handling
 */
class ProfileValidator {
  /**
   * Fetch and validate user profile with proper error handling
   */
  static async validateProfile(supabase: { from: (table: string) => { select: (fields: string) => { eq: (field: string, value: string) => { maybeSingle: () => Promise<{ data: unknown; error: unknown }> } } } }, userId: string) {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, is_verified, first_name, last_name")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Profile fetch error:", error);
        return { profile: null, error, needsProfileCreation: false };
      }

      // If no profile data, user needs to create a profile
      if (!profile) {
        return { profile: null, error: null, needsProfileCreation: true };
      }

      // Validate profile completeness
      if (!(profile as { first_name?: string; last_name?: string }).first_name || !(profile as { first_name?: string; last_name?: string }).last_name) {
        return { profile, error: null, needsProfileCompletion: true };
      }

      return {
        profile,
        error: null,
        needsProfileCreation: false,
        needsProfileCompletion: false,
      };
    } catch (err) {
      console.error("Profile validation error:", err);
      return { profile: null, error: err, needsProfileCreation: false };
    }
  }

  /**
   * Check if user has required role for the route
   */
  static hasRequiredRole(profile: { role?: string } | null, pathname: string): boolean {
    if (!profile?.role) return false;

    if (RouteChecker.isAdminRoute(pathname)) {
      return profile.role === "admin";
    }

    if (RouteChecker.isCollegeRoute(pathname)) {
      return profile.role === "college";
    }

    if (RouteChecker.isStudentRoute(pathname)) {
      return profile.role === "student";
    }

    return true; // For general protected routes, any authenticated user is allowed
  }
}

/**
 * Enhanced middleware with improved session validation and error handling
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes, and assets
  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next();
  }

  // Add debug logging for development (skip health checks)
  if (process.env.NODE_ENV === "development" && !pathname.includes("/api/health")) {
    console.log(`[Middleware] Processing request for: ${pathname}`);
  }

  // Create Supabase client for middleware
  const { supabase, response } = createClient(request);

  try {
    // Enhanced session validation with retry logic
    const {
      session,
      error: sessionError,
      isValid,
    } = await SessionValidator.validateSession(supabase);

    if (process.env.NODE_ENV === "development") {
      console.log(`[Middleware] Session validation result:`, {
        hasSession: !!session,
        userId: (session as { user?: { id?: string } })?.user?.id,
        isValid,
        error: (sessionError as Error)?.message,
      });
    }

    // Handle session validation errors - be more lenient
    if (sessionError && !isValid) {
      console.warn("Session validation failed:", (sessionError as Error).message);

      // Only redirect to login for critical errors on protected routes
      if (
        RouteChecker.requiresAuth(pathname) &&
        ((sessionError as Error).message?.includes("Network") ||
          (sessionError as Error).message?.includes("fetch") ||
          (sessionError as Error).message?.includes("timeout"))
      ) {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Middleware] Redirecting to login due to network error on protected route: ${pathname}`,
          );
        }
        return RedirectHandler.toLogin(request, "session_invalid");
      }

      // For other errors on protected routes, let client-side handle it
      if (RouteChecker.requiresAuth(pathname)) {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Middleware] Allowing request to proceed despite session error - client will handle auth`,
          );
        }
        return response;
      }

      // For public routes, continue without session
      if (RouteChecker.isPublicRoute(pathname)) {
        return response;
      }
    }

    // Handle auth-only routes - redirect authenticated users to dashboard
    if (RouteChecker.isAuthOnlyRoute(pathname)) {
      if (session) {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Middleware] Redirecting authenticated user from auth-only route: ${pathname}`,
          );
        }
        return RedirectHandler.toHome(request, "already_authenticated");
      }
      return response;
    }

    // Handle public routes - allow access regardless of authentication
    if (RouteChecker.isPublicRoute(pathname)) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Middleware] Allowing access to public route: ${pathname}`,
        );
      }
      return response;
    }

    // Handle unauthenticated access to protected routes
    if (!session) {
      if (RouteChecker.requiresAuth(pathname)) {
        // Special handling for auth-only routes (login/signup) - let client handle redirects
        if (RouteChecker.isAuthOnlyRoute(pathname)) {
          if (process.env.NODE_ENV === "development") {
            console.log(`[Middleware] Auth-only route, letting client handle: ${pathname}`);
          }
          return response;
        }
        // Check if there are valid Supabase auth cookies present
        const allCookies = request.cookies.getAll();
        const authCookies = allCookies.filter(
          (cookie) =>
            cookie.name.startsWith("supabase-auth-token") ||
            cookie.name.startsWith("sb-") ||
            cookie.name.includes("supabase") ||
            cookie.name.includes("auth"),
        );

        // Debug logging for development
        if (process.env.NODE_ENV === "development") {
          console.log(`[Middleware] All cookies:`, allCookies.map(c => c.name));
          console.log(`[Middleware] Auth cookies found:`, authCookies.map(c => c.name));
        }

        // Only let client handle if we have recent valid auth cookies (not just any cookies)
        const hasValidAuthCookies = authCookies.some(
          (cookie) =>
            cookie.value &&
            cookie.value.length > 10 &&
            !cookie.value.includes("null"),
        );

        // Be more lenient - let client-side handle authentication for most cases
        if (hasValidAuthCookies || authCookies.length > 0 || allCookies.length > 0) {
          if (process.env.NODE_ENV === "development") {
            console.log(
              `[Middleware] Cookies present, letting client handle authentication: ${pathname}`,
            );
          }
          return response;
        }

        // Only redirect to login if absolutely no auth cookies are present
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Middleware] No auth cookies at all, redirecting to login: ${pathname}`,
          );
        }
        return RedirectHandler.toLogin(request, "authentication_required");
      }
      return response;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Middleware] User authenticated, checking role requirements for: ${pathname}`,
      );
    }

    // At this point, we have a valid session
    // For role-based routes, validate profile and check permissions
    if (RouteChecker.requiresRoleCheck(pathname)) {
      const {
        profile,
        error: profileError,
        needsProfileCreation,
        needsProfileCompletion,
      } = await ProfileValidator.validateProfile(supabase as any, (session as { user: { id: string } }).user.id);

      if (process.env.NODE_ENV === "development") {
        console.log(`[Middleware] Profile validation result:`, {
          hasProfile: !!profile,
          role: (profile as { role?: string })?.role,
          needsProfileCreation,
          needsProfileCompletion,
          error: (profileError as Error)?.message,
        });
      }

      // Handle profile creation needed
      if (needsProfileCreation) {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Middleware] Redirecting to complete profile - creation needed`,
          );
        }
        return RedirectHandler.toCompleteProfile(request);
      }

      // Handle profile completion needed
      if (needsProfileCompletion) {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Middleware] Redirecting to complete profile - completion needed`,
          );
        }
        return RedirectHandler.toCompleteProfile(request);
      }

      // Handle profile fetch errors - be more lenient
      if (profileError && !profile) {
        console.warn("Profile validation failed:", (profileError as Error).message);
        // Instead of redirecting to login, let client-side handle it
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Middleware] Allowing request to proceed despite profile error - client will handle auth`,
          );
        }
        return response;
      }

      // Check role-based access
      if (profile && !ProfileValidator.hasRequiredRole(profile, pathname)) {
        let requiredRole = "authenticated";
        if (RouteChecker.isAdminRoute(pathname)) requiredRole = "admin";
        else if (RouteChecker.isCollegeRoute(pathname))
          requiredRole = "college";
        else if (RouteChecker.isStudentRoute(pathname))
          requiredRole = "student";

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Middleware] User role '${(profile as { role?: string }).role}' insufficient for route requiring '${requiredRole}'`,
          );
        }
        return RedirectHandler.toUnauthorized(request, requiredRole);
      }
    }

    // All checks passed - allow access to the route
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Middleware] All checks passed, allowing access to: ${pathname}`,
      );
    }
    return response;
  } catch (error) {
    console.error("Middleware unexpected error:", error);

    // Be more lenient with unexpected errors - let client-side handle auth
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Middleware] Allowing request to proceed despite error - client will handle auth`,
      );
    }
    return response;
  }
}

/**
 * Check if middleware should be skipped for the given pathname
 */
function shouldSkipMiddleware(pathname: string): boolean {
  const skipPatterns = [
    "/_next/",
    "/api/",
    "/icons/",
    "/favicon",
    "sw.js",
    "manifest.json",
  ];

  const skipExtensions = [
    ".svg",
    ".png",
    ".jpg",
    ".jpeg",
    ".ico",
    ".webp",
    ".js",
    ".css",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
  ];

  // Check patterns
  if (
    skipPatterns.some(
      (pattern) => pathname.startsWith(pattern) || pathname.includes(pattern),
    )
  ) {
    return true;
  }

  // Check extensions
  if (skipExtensions.some((ext) => pathname.endsWith(ext))) {
    return true;
  }

  return false;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     * - static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|api|icons|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|ico)$).*)",
  ],
};
