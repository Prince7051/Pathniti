"use client";

import React from "react";
import {
  AlertTriangle,
  LogIn,
  Settings,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthLoading } from "./AuthLoading";
import { useAuth } from "@/app/providers";

interface AuthFallbackProps {
  type?:
    | "loading"
    | "unauthenticated"
    | "profile_incomplete"
    | "network_error"
    | "permission_denied"
    | "session_expired";
  title?: string;
  message?: string;
  showRetry?: boolean;
  showLogin?: boolean;
  onRetry?: () => void;
  className?: string;
}

/**
 * Fallback UI components for different authentication states
 */
export function AuthFallback({
  type = "loading",
  title,
  message,
  showRetry = true,
  showLogin = true,
  onRetry,
  className = "",
}: AuthFallbackProps) {
  const { loading } = useAuth();

  const handleLogin = () => {
    window.location.href = "/auth/login";
  };

  const handleCompleteProfile = () => {
    window.location.href = "/auth/complete-profile";
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  // Loading state
  if (type === "loading" || loading) {
    return (
      <div
        className={`flex items-center justify-center min-h-[400px] ${className}`}
      >
        <AuthLoading
          variant="spinner"
          size="lg"
          message="Loading authentication..."
        />
      </div>
    );
  }

  // Network error state
  if (type === "network_error") {
    return (
      <div
        className={`flex items-center justify-center min-h-[400px] ${className}`}
      >
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <WifiOff className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-xl">
              {title || "Connection Error"}
            </CardTitle>
            <CardDescription>
              {message ||
                "Unable to connect to the server. Please check your internet connection and try again."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              {showRetry && (
                <Button onClick={handleRetry} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session expired state
  if (type === "session_expired") {
    return (
      <div
        className={`flex items-center justify-center min-h-[400px] ${className}`}
      >
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">
              {title || "Session Expired"}
            </CardTitle>
            <CardDescription>
              {message ||
                "Your session has expired. Please sign in again to continue."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Button onClick={handleLogin} className="w-full">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In Again
              </Button>
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Unauthenticated state
  if (type === "unauthenticated") {
    return (
      <div
        className={`flex items-center justify-center min-h-[400px] ${className}`}
      >
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <LogIn className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl">
              {title || "Authentication Required"}
            </CardTitle>
            <CardDescription>
              {message || "You need to sign in to access this page."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              {showLogin && (
                <Button onClick={handleLogin} className="w-full">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
              <Button
                onClick={() => (window.location.href = "/auth/signup")}
                variant="outline"
                className="w-full"
              >
                Create Account
              </Button>
              <Button onClick={handleGoHome} variant="ghost" className="w-full">
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Profile incomplete state
  if (type === "profile_incomplete") {
    return (
      <div
        className={`flex items-center justify-center min-h-[400px] ${className}`}
      >
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Settings className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle className="text-xl">
              {title || "Complete Your Profile"}
            </CardTitle>
            <CardDescription>
              {message ||
                "Please complete your profile setup to access all features."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Button onClick={handleCompleteProfile} className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Complete Profile
              </Button>
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Permission denied state
  if (type === "permission_denied") {
    return (
      <div
        className={`flex items-center justify-center min-h-[400px] ${className}`}
      >
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">
              {title || "Access Denied"}
            </CardTitle>
            <CardDescription>
              {message || "You don't have permission to access this page."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => (window.location.href = "/dashboard")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default fallback
  return (
    <div
      className={`flex items-center justify-center min-h-[400px] ${className}`}
    >
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-gray-600" />
          </div>
          <CardTitle className="text-xl">
            {title || "Something went wrong"}
          </CardTitle>
          <CardDescription>
            {message || "An unexpected error occurred. Please try again."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            {showRetry && (
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button onClick={handleGoHome} variant="outline" className="w-full">
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Specific fallback components for common scenarios
 */
export function LoadingFallback() {
  return <AuthFallback type="loading" />;
}

export function UnauthenticatedFallback() {
  return <AuthFallback type="unauthenticated" />;
}

export function ProfileIncompleteFallback() {
  return <AuthFallback type="profile_incomplete" />;
}

export function NetworkErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return <AuthFallback type="network_error" onRetry={onRetry} />;
}

export function SessionExpiredFallback() {
  return <AuthFallback type="session_expired" />;
}

export function PermissionDeniedFallback() {
  return <AuthFallback type="permission_denied" />;
}

/**
 * Smart fallback component that automatically determines the appropriate fallback based on auth state
 */
export function SmartAuthFallback({ onRetry }: { onRetry?: () => void }) {
  const { user, session, profile, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user || !session) {
    return <UnauthenticatedFallback />;
  }

  if (!profile) {
    return <ProfileIncompleteFallback />;
  }

  // If we get here, there might be a network error or other issue
  return <NetworkErrorFallback onRetry={onRetry} />;
}
