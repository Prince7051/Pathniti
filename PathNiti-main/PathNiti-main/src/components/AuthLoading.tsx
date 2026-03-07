"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthLoadingProps {
  variant?: "spinner" | "skeleton" | "pulse" | "dots";
  size?: "sm" | "md" | "lg" | "full";
  message?: string;
  showMessage?: boolean;
}

/**
 * Comprehensive loading component for authentication states
 */
export function AuthLoading({
  variant = "spinner",
  size = "md",
  message = "Checking authentication...",
  showMessage = true,
}: AuthLoadingProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    full: "min-h-screen",
  };

  const containerClasses =
    size === "full"
      ? "min-h-screen flex items-center justify-center bg-gray-50"
      : "flex items-center justify-center p-4";

  if (variant === "skeleton") {
    return (
      <div className={containerClasses}>
        <Card className="w-full max-w-md">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={containerClasses}>
        <div className="text-center">
          <div
            className={`${sizeClasses[size]} mx-auto mb-4 bg-blue-200 rounded-full animate-pulse`}
          ></div>
          {showMessage && (
            <p className="text-gray-600 animate-pulse">{message}</p>
          )}
        </div>
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={containerClasses}>
        <div className="text-center">
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div
              className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          {showMessage && <p className="text-gray-600">{message}</p>}
        </div>
      </div>
    );
  }

  // Default spinner variant
  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div
          className={`${sizeClasses[size]} mx-auto mb-4 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin`}
        ></div>
        {showMessage && <p className="text-gray-600">{message}</p>}
      </div>
    </div>
  );
}

/**
 * Specific loading components for different authentication states
 */
export function AuthInitialLoading() {
  return (
    <AuthLoading
      variant="spinner"
      size="full"
      message="Initializing authentication..."
    />
  );
}

export function AuthSessionLoading() {
  return (
    <AuthLoading variant="dots" size="md" message="Verifying session..." />
  );
}

export function AuthProfileLoading() {
  return <AuthLoading variant="pulse" size="md" message="Loading profile..." />;
}

export function AuthPageLoading() {
  return <AuthLoading variant="skeleton" size="full" showMessage={false} />;
}

/**
 * Inline loading component for smaller spaces
 */
export function AuthInlineLoading({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
}

/**
 * Button loading state for authentication actions
 */
export function AuthButtonLoading({
  message = "Please wait...",
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      <span>{message}</span>
    </div>
  );
}
