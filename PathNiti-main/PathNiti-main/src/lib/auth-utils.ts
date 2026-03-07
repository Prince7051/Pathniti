/**
 * Authentication utility functions for common authentication operations
 */

import { User, Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "student" | "admin" | "college";
  is_verified: boolean;
}

/**
 * Check if a user has a specific role
 */
export function hasRole(
  profile: UserProfile | null,
  role: "student" | "admin" | "college",
): boolean {
  return profile?.role === role;
}

/**
 * Check if a user is authenticated (has both user and session)
 */
export function isAuthenticated(
  user: User | null,
  session: Session | null,
): boolean {
  return !!(user && session);
}

/**
 * Check if a user has completed their profile
 */
export function hasCompleteProfile(profile: UserProfile | null): boolean {
  return !!(profile && profile.first_name && profile.last_name && profile.role);
}

/**
 * Get the appropriate dashboard URL for a user based on their role
 */
export function getDashboardUrl(profile: UserProfile | null): string {
  if (!profile) return "/dashboard";

  switch (profile.role) {
    case "admin":
      return "/dashboard/admin";
    case "college":
      return "/dashboard/college";
    case "student":
      return "/dashboard/student";
    default:
      return "/dashboard";
  }
}

/**
 * Get user display name from profile
 */
export function getUserDisplayName(profile: UserProfile | null): string {
  if (!profile) return "User";

  const firstName = profile.first_name || "";
  const lastName = profile.last_name || "";

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  if (firstName) return firstName;
  if (lastName) return lastName;

  return profile.email || "User";
}

/**
 * Get user initials for avatar display
 */
export function getUserInitials(profile: UserProfile | null): string {
  if (!profile) return "U";

  const firstName = profile.first_name || "";
  const lastName = profile.last_name || "";

  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  if (firstName) return firstName.charAt(0).toUpperCase();
  if (lastName) return lastName.charAt(0).toUpperCase();

  if (profile.email) {
    return profile.email.charAt(0).toUpperCase();
  }

  return "U";
}

/**
 * Check if a route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    "/dashboard",
    "/admin",
    "/colleges/dashboard",
    "/colleges/manage",
    "/profile",
    "/settings",
  ];

  return protectedRoutes.some((route) => pathname.startsWith(route));
}

/**
 * Check if a route requires a specific role
 */
export function getRequiredRole(
  pathname: string,
): "student" | "admin" | "college" | null {
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard/admin")
  ) {
    return "admin";
  }

  if (
    pathname.startsWith("/colleges/dashboard") ||
    pathname.startsWith("/colleges/manage") ||
    pathname.startsWith("/dashboard/college")
  ) {
    return "college";
  }

  if (pathname.startsWith("/dashboard/student")) {
    return "student";
  }

  return null;
}

/**
 * Authentication error types
 */
export enum AuthErrorType {
  UNAUTHENTICATED = "unauthenticated",
  INSUFFICIENT_PERMISSIONS = "insufficient_permissions",
  PROFILE_INCOMPLETE = "profile_incomplete",
  SESSION_EXPIRED = "session_expired",
  NETWORK_ERROR = "network_error",
  UNKNOWN = "unknown",
}

/**
 * Parse authentication errors and return appropriate error type
 */
export function parseAuthError(error: unknown): AuthErrorType {
  if (!error) return AuthErrorType.UNKNOWN;

  const message = (error as { message?: string }).message?.toLowerCase() || "";

  if (message.includes("session") || message.includes("expired")) {
    return AuthErrorType.SESSION_EXPIRED;
  }

  if (
    message.includes("unauthorized") ||
    message.includes("not authenticated")
  ) {
    return AuthErrorType.UNAUTHENTICATED;
  }

  if (message.includes("permission") || message.includes("access denied")) {
    return AuthErrorType.INSUFFICIENT_PERMISSIONS;
  }

  if (message.includes("profile") || message.includes("incomplete")) {
    return AuthErrorType.PROFILE_INCOMPLETE;
  }

  if (message.includes("network") || message.includes("fetch")) {
    return AuthErrorType.NETWORK_ERROR;
  }

  return AuthErrorType.UNKNOWN;
}

/**
 * Get user-friendly error message for authentication errors
 */
export function getAuthErrorMessage(errorType: AuthErrorType): string {
  switch (errorType) {
    case AuthErrorType.UNAUTHENTICATED:
      return "You need to log in to access this page.";
    case AuthErrorType.INSUFFICIENT_PERMISSIONS:
      return "You don't have permission to access this page.";
    case AuthErrorType.PROFILE_INCOMPLETE:
      return "Please complete your profile to continue.";
    case AuthErrorType.SESSION_EXPIRED:
      return "Your session has expired. Please log in again.";
    case AuthErrorType.NETWORK_ERROR:
      return "Network error. Please check your connection and try again.";
    case AuthErrorType.UNKNOWN:
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

/**
 * Validation helpers
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

export function getPasswordStrength(
  password: string,
): "weak" | "medium" | "strong" {
  if (password.length < 6) return "weak";
  if (password.length < 8) return "medium";

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&]/.test(password);

  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(
    Boolean,
  ).length;

  if (score >= 3) return "strong";
  if (score >= 2) return "medium";
  return "weak";
}

/**
 * Re-export error handling utilities for convenience
 */
export {
  getErrorMessage,
  shouldRedirect,
  getRedirectUrl,
  logAuthError,
} from "./auth-errors";
