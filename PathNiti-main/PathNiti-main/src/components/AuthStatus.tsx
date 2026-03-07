"use client";

import React from "react";
import { useAuth } from "@/app/providers";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthInlineLoading } from "./AuthLoading";
import { getUserDisplayName, getUserInitials } from "@/lib/auth-utils";

interface AuthStatusProps {
  variant?: "compact" | "detailed" | "card";
  showActions?: boolean;
  className?: string;
}

/**
 * Comprehensive authentication status component
 */
export function AuthStatus({
  variant = "compact",
  showActions = false,
  className = "",
}: AuthStatusProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className={className}>
        <AuthInlineLoading message="Checking status..." />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Authentication Status
            <AuthStatusBadge />
          </CardTitle>
          <CardDescription>
            Current authentication and profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && profile ? (
            <AuthenticatedDetails showActions={showActions} />
          ) : (
            <UnauthenticatedDetails showActions={showActions} />
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center space-x-2">
          <AuthStatusBadge />
          {user && profile && (
            <span className="text-sm font-medium">
              {getUserDisplayName(profile)}
            </span>
          )}
        </div>
        {user && profile ? (
          <AuthenticatedDetails showActions={showActions} />
        ) : (
          <UnauthenticatedDetails showActions={showActions} />
        )}
      </div>
    );
  }

  // Compact variant (default)
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <AuthStatusBadge />
      {user && profile && (
        <div className="flex items-center space-x-2">
          <UserAvatar />
          <span className="text-sm font-medium">
            {getUserDisplayName(profile)}
          </span>
        </div>
      )}
      {showActions && <AuthActions />}
    </div>
  );
}

/**
 * Authentication status badge
 */
function AuthStatusBadge() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <Badge variant="secondary">Checking...</Badge>;
  }

  if (!user) {
    return <Badge variant="destructive">Not Authenticated</Badge>;
  }

  if (!profile) {
    return <Badge variant="outline">Profile Incomplete</Badge>;
  }

  return (
    <div className="flex items-center space-x-1">
      <Badge variant="default">Authenticated</Badge>
      <Badge variant="outline" className="capitalize">
        {profile.role}
      </Badge>
    </div>
  );
}

/**
 * User avatar component
 */
function UserAvatar() {
  const { profile } = useAuth();
  const initials = getUserInitials(profile);

  return (
    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
      {initials}
    </div>
  );
}

/**
 * Details for authenticated users
 */
function AuthenticatedDetails({ showActions }: { showActions: boolean }) {
  const { user, profile } = useAuth();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium text-gray-500">Email:</span>
          <p className="text-gray-900">{user?.email}</p>
        </div>
        <div>
          <span className="font-medium text-gray-500">Role:</span>
          <p className="text-gray-900 capitalize">{profile?.role}</p>
        </div>
        <div>
          <span className="font-medium text-gray-500">Name:</span>
          <p className="text-gray-900">{getUserDisplayName(profile)}</p>
        </div>
        <div>
          <span className="font-medium text-gray-500">Verified:</span>
          <p className="text-gray-900">{profile?.is_verified ? "Yes" : "No"}</p>
        </div>
      </div>
      {showActions && <AuthActions />}
    </div>
  );
}

/**
 * Details for unauthenticated users
 */
function UnauthenticatedDetails({ showActions }: { showActions: boolean }) {
  return (
    <div className="space-y-3">
      <p className="text-gray-600">
        You are not currently authenticated. Please log in to access your
        account.
      </p>
      {showActions && <AuthActions />}
    </div>
  );
}

/**
 * Authentication action buttons
 */
function AuthActions() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleSignIn = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
  };

  const handleDashboard = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
  };

  if (user) {
    return (
      <div className="flex space-x-2">
        <Button size="sm" variant="outline" onClick={handleDashboard}>
          Dashboard
        </Button>
        <Button size="sm" variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex space-x-2">
      <Button size="sm" onClick={handleSignIn}>
        Sign In
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => (window.location.href = "/auth/signup")}
      >
        Sign Up
      </Button>
    </div>
  );
}

/**
 * Simple authentication indicator for headers/navbars
 */
export function AuthIndicator() {
  return <AuthStatus variant="compact" />;
}

/**
 * Detailed authentication panel for settings/profile pages
 */
export function AuthPanel() {
  return <AuthStatus variant="card" showActions={true} />;
}

/**
 * Authentication status for debugging/development
 */
export function AuthDebugStatus() {
  const { user, session, profile, loading } = useAuth();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <Card className="border-dashed border-yellow-300 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-yellow-800">Auth Debug Info</CardTitle>
        <CardDescription className="text-yellow-700">
          Development only - authentication state details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="text-xs text-yellow-800 overflow-auto">
          {JSON.stringify(
            {
              loading,
              hasUser: !!user,
              hasSession: !!session,
              hasProfile: !!profile,
              userEmail: user?.email,
              profileRole: profile?.role,
              sessionExpiry: session?.expires_at,
            },
            null,
            2,
          )}
        </pre>
      </CardContent>
    </Card>
  );
}
