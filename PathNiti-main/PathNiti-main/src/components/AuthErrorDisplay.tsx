"use client";

import React from "react";
import {
  AlertTriangle,
  RefreshCw,
  LogIn,
  UserPlus,
  Settings,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthErrorInfo, AuthErrorType } from "@/lib/auth-errors";

interface AuthErrorDisplayProps {
  error: AuthErrorInfo;
  onRetry?: () => void;
  onAction?: (action: string) => void;
  variant?: "card" | "inline" | "toast" | "banner";
  showDetails?: boolean;
  className?: string;
}

/**
 * Comprehensive error display component for authentication errors
 */
export function AuthErrorDisplay({
  error,
  onRetry,
  onAction,
  variant = "card",
  showDetails = false,
  className = "",
}: AuthErrorDisplayProps) {
  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action);
    } else {
      // Default actions
      switch (action) {
        case "login":
          window.location.href = "/auth/login";
          break;
        case "signup":
          window.location.href = "/auth/signup";
          break;
        case "complete_profile":
          window.location.href = "/auth/complete-profile";
          break;
        case "retry":
          if (onRetry) onRetry();
          break;
        case "contact_support":
          window.location.href = "/contact";
          break;
        default:
          if (onRetry) onRetry();
      }
    }
  };

  const getErrorIcon = () => {
    switch (error.type) {
      case AuthErrorType.NETWORK_ERROR:
      case AuthErrorType.TIMEOUT_ERROR:
        return <RefreshCw className="h-5 w-5 text-orange-500" />;
      case AuthErrorType.INVALID_CREDENTIALS:
      case AuthErrorType.SESSION_EXPIRED:
        return <LogIn className="h-5 w-5 text-red-500" />;
      case AuthErrorType.PROFILE_NOT_FOUND:
      case AuthErrorType.PROFILE_INCOMPLETE:
        return <Settings className="h-5 w-5 text-blue-500" />;
      case AuthErrorType.USER_NOT_FOUND:
        return <UserPlus className="h-5 w-5 text-green-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const getErrorSeverity = (): "error" | "warning" | "info" => {
    switch (error.type) {
      case AuthErrorType.NETWORK_ERROR:
      case AuthErrorType.TIMEOUT_ERROR:
      case AuthErrorType.PROFILE_INCOMPLETE:
        return "warning";
      case AuthErrorType.USER_NOT_FOUND:
      case AuthErrorType.EMAIL_NOT_CONFIRMED:
        return "info";
      default:
        return "error";
    }
  };

  const getActionButton = () => {
    if (!error.action) return null;

    const actionConfig = {
      retry: {
        label: "Try Again",
        icon: RefreshCw,
        variant: "default" as const,
      },
      login: { label: "Sign In", icon: LogIn, variant: "default" as const },
      signup: { label: "Sign Up", icon: UserPlus, variant: "default" as const },
      complete_profile: {
        label: "Complete Profile",
        icon: Settings,
        variant: "default" as const,
      },
      contact_support: {
        label: "Contact Support",
        icon: HelpCircle,
        variant: "outline" as const,
      },
    };

    const config = actionConfig[error.action as keyof typeof actionConfig];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <Button
        onClick={() => handleAction(error.action!)}
        variant={config.variant}
        size="sm"
        className="flex items-center space-x-2"
      >
        <Icon className="h-4 w-4" />
        <span>{config.label}</span>
      </Button>
    );
  };

  if (variant === "inline") {
    return (
      <div
        className={`flex items-center space-x-3 p-3 rounded-lg border ${
          getErrorSeverity() === "error"
            ? "border-red-200 bg-red-50"
            : getErrorSeverity() === "warning"
              ? "border-orange-200 bg-orange-50"
              : "border-blue-200 bg-blue-50"
        } ${className}`}
      >
        {getErrorIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {error.userMessage}
          </p>
          {showDetails && (
            <p className="text-xs text-gray-500 mt-1">{error.message}</p>
          )}
        </div>
        {getActionButton()}
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={`border-l-4 p-4 ${
          getErrorSeverity() === "error"
            ? "border-red-400 bg-red-50"
            : getErrorSeverity() === "warning"
              ? "border-orange-400 bg-orange-50"
              : "border-blue-400 bg-blue-50"
        } ${className}`}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">{getErrorIcon()}</div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {error.userMessage}
            </p>
            {showDetails && (
              <p className="text-xs text-gray-500 mt-1">{error.message}</p>
            )}
            <div className="mt-3 flex space-x-2">
              {getActionButton()}
              {error.retryable && onRetry && (
                <Button onClick={onRetry} variant="outline" size="sm">
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "toast") {
    return (
      <div
        className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 ${className}`}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">{getErrorIcon()}</div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Authentication Error
              </p>
              <p className="mt-1 text-sm text-gray-500">{error.userMessage}</p>
              <div className="mt-3 flex space-x-2">{getActionButton()}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          {getErrorIcon()}
          <CardTitle className="text-lg">Authentication Error</CardTitle>
          <Badge
            variant={
              getErrorSeverity() === "error" ? "destructive" : "secondary"
            }
          >
            {error.type
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
          </Badge>
        </div>
        <CardDescription>{error.userMessage}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showDetails && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-mono">{error.message}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Recoverable: {error.recoverable ? "✓" : "✗"}</span>
            <span>Retryable: {error.retryable ? "✓" : "✗"}</span>
          </div>

          <div className="flex space-x-2">
            {error.retryable && onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
            {getActionButton()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Specific error components for common scenarios
 */
export function SessionExpiredError({ onLogin }: { onLogin?: () => void }) {
  const error: AuthErrorInfo = {
    type: AuthErrorType.SESSION_EXPIRED,
    message: "Session expired",
    userMessage: "Your session has expired. Please sign in again to continue.",
    recoverable: true,
    retryable: false,
    action: "login",
  };

  return (
    <AuthErrorDisplay
      error={error}
      onAction={onLogin ? () => onLogin() : undefined}
      variant="banner"
    />
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  const error: AuthErrorInfo = {
    type: AuthErrorType.NETWORK_ERROR,
    message: "Network connection failed",
    userMessage:
      "Unable to connect to the server. Please check your internet connection.",
    recoverable: true,
    retryable: true,
    action: "retry",
  };

  return <AuthErrorDisplay error={error} onRetry={onRetry} variant="inline" />;
}

export function ProfileIncompleteError({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const error: AuthErrorInfo = {
    type: AuthErrorType.PROFILE_INCOMPLETE,
    message: "Profile incomplete",
    userMessage: "Please complete your profile to access all features.",
    recoverable: true,
    retryable: false,
    action: "complete_profile",
  };

  return (
    <AuthErrorDisplay
      error={error}
      onAction={onComplete ? () => onComplete() : undefined}
      variant="card"
    />
  );
}

export function InsufficientPermissionsError() {
  const error: AuthErrorInfo = {
    type: AuthErrorType.INSUFFICIENT_PERMISSIONS,
    message: "Access denied",
    userMessage: "You don't have permission to access this page.",
    recoverable: false,
    retryable: false,
    action: "login",
  };

  return <AuthErrorDisplay error={error} variant="card" />;
}
