"use client";

import React, { useCallback } from "react";
import { useAuth } from "@/app/providers";
import {
  hasRole,
  isAuthenticated,
  hasCompleteProfile,
  getDashboardUrl,
  getUserDisplayName,
  getUserInitials,
  AuthErrorType,
  parseAuthError,
  getAuthErrorMessage,
} from "@/lib/auth-utils";

/**
 * Enhanced authentication hook that provides additional helper functions
 * and utilities for common authentication operations
 */
export function useAuthHelpers() {
  const auth = useAuth();
  const { user, session, profile, loading } = auth;

  // Authentication state helpers
  const isAuth = useCallback(() => {
    return isAuthenticated(user, session);
  }, [user, session]);

  const hasProfile = useCallback(() => {
    return hasCompleteProfile(profile);
  }, [profile]);

  const isReady = useCallback(() => {
    return !loading && isAuth() && hasProfile();
  }, [loading, isAuth, hasProfile]);

  // Role helpers
  const checkRole = useCallback(
    (role: "student" | "admin" | "college") => {
      return hasRole(profile, role);
    },
    [profile],
  );

  const isAdmin = useCallback(() => checkRole("admin"), [checkRole]);
  const isStudent = useCallback(() => checkRole("student"), [checkRole]);
  const isCollege = useCallback(() => checkRole("college"), [checkRole]);

  // User information helpers
  const displayName = useCallback(() => {
    return getUserDisplayName(profile);
  }, [profile]);

  const initials = useCallback(() => {
    return getUserInitials(profile);
  }, [profile]);

  const dashboardUrl = useCallback(() => {
    return getDashboardUrl(profile);
  }, [profile]);

  // Navigation helpers
  const goToDashboard = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = dashboardUrl();
    }
  }, [dashboardUrl]);

  const goToLogin = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
  }, []);

  const goToSignup = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/auth/signup";
    }
  }, []);

  const goToCompleteProfile = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.href = "/auth/complete-profile";
    }
  }, []);

  // Error handling helpers
  const handleAuthError = useCallback(
    (error: Error | unknown) => {
      const errorType = parseAuthError(error);
      const message = getAuthErrorMessage(errorType);

      console.error("Authentication error:", error);

      // Handle different error types
      switch (errorType) {
        case AuthErrorType.UNAUTHENTICATED:
        case AuthErrorType.SESSION_EXPIRED:
          goToLogin();
          break;
        case AuthErrorType.PROFILE_INCOMPLETE:
          goToCompleteProfile();
          break;
        case AuthErrorType.INSUFFICIENT_PERMISSIONS:
          goToDashboard();
          break;
        default:
          // For network errors and unknown errors, just log them
          // The UI should handle displaying the error message
          break;
      }

      return { errorType, message };
    },
    [goToLogin, goToCompleteProfile, goToDashboard],
  );

  // Authentication guards
  const requireAuthentication = useCallback(() => {
    if (loading) return false;

    if (!isAuth()) {
      goToLogin();
      return false;
    }

    if (!hasProfile()) {
      goToCompleteProfile();
      return false;
    }

    return true;
  }, [loading, isAuth, hasProfile, goToLogin, goToCompleteProfile]);

  const requireRole = useCallback(
    (role: "student" | "admin" | "college") => {
      if (!requireAuthentication()) return false;

      if (!checkRole(role)) {
        goToDashboard();
        return false;
      }

      return true;
    },
    [requireAuthentication, checkRole, goToDashboard],
  );

  const requireAdmin = useCallback(() => requireRole("admin"), [requireRole]);
  const requireStudent = useCallback(
    () => requireRole("student"),
    [requireRole],
  );
  const requireCollege = useCallback(
    () => requireRole("college"),
    [requireRole],
  );

  return {
    // Original auth context
    ...auth,

    // Authentication state
    isAuthenticated: isAuth,
    hasCompleteProfile: hasProfile,
    isReady,

    // Role checks
    checkRole,
    isAdmin,
    isStudent,
    isCollege,

    // User information
    displayName,
    initials,
    dashboardUrl,

    // Navigation
    goToDashboard,
    goToLogin,
    goToSignup,
    goToCompleteProfile,

    // Error handling
    handleAuthError,

    // Guards
    requireAuthentication,
    requireRole,
    requireAdmin,
    requireStudent,
    requireCollege,
  };
}

/**
 * Hook for components that require authentication
 */
export function useRequireAuth() {
  const { requireAuthentication, ...auth } = useAuthHelpers();

  // Automatically check authentication on mount
  React.useEffect(() => {
    requireAuthentication();
  }, [requireAuthentication]);

  return auth;
}

/**
 * Hook for components that require a specific role
 */
export function useRequireRole(role: "student" | "admin" | "college") {
  const { requireRole, ...auth } = useAuthHelpers();

  // Automatically check role on mount
  React.useEffect(() => {
    requireRole(role);
  }, [requireRole, role]);

  return auth;
}
