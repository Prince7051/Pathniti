"use client";

import React from "react";
import { useAuth } from "@/app/providers";
import { Badge } from "@/components/ui/badge";

interface AuthStatusIndicatorProps {
  showRole?: boolean;
  showEmail?: boolean;
  className?: string;
}

/**
 * Component that displays the current authentication status
 */
export function AuthStatusIndicator({
  showRole = true,
  showEmail = false,
  className = "",
}: AuthStatusIndicatorProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Badge variant="secondary">Not Authenticated</Badge>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Badge variant="default">Authenticated</Badge>
      {showRole && profile.role && (
        <Badge variant="outline" className="capitalize">
          {profile.role}
        </Badge>
      )}
      {showEmail && user.email && (
        <span className="text-sm text-gray-600">{user.email}</span>
      )}
    </div>
  );
}

/**
 * Simple loading component for authentication states
 */
export function AuthLoadingSpinner({
  size = "default",
}: {
  size?: "sm" | "default" | "lg";
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`animate-spin rounded-full border-b-2 border-gray-900 ${sizeClasses[size]}`}
      ></div>
    </div>
  );
}

/**
 * Full page loading component for authentication
 */
export function AuthPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <AuthLoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Checking authentication...</p>
      </div>
    </div>
  );
}

/**
 * Component that shows different content based on authentication state
 */
interface AuthGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  requireRole?: "student" | "admin" | "college";
}

export function AuthGate({
  children,
  fallback,
  loadingFallback,
  requireRole,
}: AuthGateProps) {
  const { user, profile, loading, hasRole } = useAuth();

  if (loading) {
    return loadingFallback || <AuthLoadingSpinner />;
  }

  if (!user || !profile) {
    return (
      fallback || (
        <div className="text-center py-8">
          <p className="text-gray-600">Please log in to view this content.</p>
        </div>
      )
    );
  }

  if (requireRole && !hasRole(requireRole)) {
    return (
      fallback || (
        <div className="text-center py-8">
          <p className="text-gray-600">
            You don&apos;t have permission to view this content.
          </p>
        </div>
      )
    );
  }

  return <>{children}</>;
}
