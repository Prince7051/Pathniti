"use client";

import React from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";

interface WithAuthOptions {
  requireAuth?: boolean;
  requiredRole?: "student" | "admin" | "college";
  loadingComponent?: React.ComponentType;
  fallbackComponent?: React.ComponentType;
}

/**
 * Higher-order component that wraps pages with authentication requirements
 *
 * @param WrappedComponent - The component to wrap
 * @param options - Authentication options
 * @returns Enhanced component with authentication guards
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {},
) {
  const {
    requireAuth = true,
    requiredRole,
    loadingComponent: LoadingComponent,
    fallbackComponent: FallbackComponent,
  } = options;

  const AuthenticatedComponent = (props: P) => {
    const { loading, isReady } = useAuthGuard({
      requireAuth,
      requiredRole,
    });

    // Show loading component while authentication is being checked
    if (loading) {
      if (LoadingComponent) {
        return <LoadingComponent />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    // Show fallback component if authentication failed
    if (requireAuth && !isReady) {
      if (FallbackComponent) {
        return <FallbackComponent />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600">Please log in to access this page.</p>
          </div>
        </div>
      );
    }

    // Render the wrapped component
    return <WrappedComponent {...props} />;
  };

  // Set display name for debugging
  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AuthenticatedComponent;
}

/**
 * HOC specifically for admin-only pages
 */
export function withAdminAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<WithAuthOptions, "requiredRole"> = {},
) {
  return withAuth(WrappedComponent, {
    ...options,
    requiredRole: "admin",
  });
}

/**
 * HOC specifically for student-only pages
 */
export function withStudentAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<WithAuthOptions, "requiredRole"> = {},
) {
  return withAuth(WrappedComponent, {
    ...options,
    requiredRole: "student",
  });
}

/**
 * HOC specifically for college-only pages
 */
export function withCollegeAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<WithAuthOptions, "requiredRole"> = {},
) {
  return withAuth(WrappedComponent, {
    ...options,
    requiredRole: "college",
  });
}
