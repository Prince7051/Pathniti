"use client";

import { useEffect } from "react";
import { useAuth } from "@/app/providers";

/**
 * Custom hook that provides authentication guard functionality
 * This hook automatically handles authentication checks and redirects
 */
export function useAuthGuard(options?: {
  requireAuth?: boolean;
  requiredRole?: "student" | "admin" | "college";
  redirectTo?: string;
}) {
  const { user, session, profile, loading, requireAuth, requireRole } =
    useAuth();

  const {
    requireAuth: shouldRequireAuth = true,
    requiredRole,
  } = options || {};

  useEffect(() => {
    // Skip checks while loading
    if (loading) return;

    // Apply authentication requirement
    if (shouldRequireAuth) {
      requireAuth();
    }

    // Apply role requirement if specified
    if (requiredRole) {
      requireRole(requiredRole);
    }
  }, [loading, shouldRequireAuth, requiredRole, requireAuth, requireRole]);

  return {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !loading && !!user && !!session,
    hasProfile: !loading && !!profile,
    isReady: !loading && !!user && !!session && !!profile,
  };
}

/**
 * Hook specifically for pages that require authentication
 */
export function useRequireAuth() {
  return useAuthGuard({ requireAuth: true });
}

/**
 * Hook specifically for pages that require a specific role
 */
export function useRequireRole(role: "student" | "admin" | "college") {
  return useAuthGuard({ requireAuth: true, requiredRole: role });
}

/**
 * Hook for admin-only pages
 */
export function useRequireAdmin() {
  return useRequireRole("admin");
}

/**
 * Hook for student-only pages
 */
export function useRequireStudent() {
  return useRequireRole("student");
}

/**
 * Hook for college-only pages
 */
export function useRequireCollege() {
  return useRequireRole("college");
}
