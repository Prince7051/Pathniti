"use client";

import React, { useEffect, useState } from "react";
import { X, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { useAuthError } from "@/contexts/AuthErrorContext";
// import { AuthErrorDisplay } from './AuthErrorDisplay'
import { AuthErrorType } from "@/lib/auth-errors";

interface AuthErrorNotificationProps {
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
  autoHide?: boolean;
  autoHideDelay?: number;
  showHistory?: boolean;
  maxVisible?: number;
}

/**
 * Global notification system for authentication errors
 */
// Internal component that uses the context
function AuthErrorNotificationInternal({
  position = "top-right",
  autoHide = true,
  autoHideDelay = 5000,
  showHistory = false,
  maxVisible = 3,
}: AuthErrorNotificationProps) {
  const { currentError, errorHistory, clearError, hasError } = useAuthError();
  const [isVisible, setIsVisible] = useState(false);
  const [, setVisibleErrors] = useState<string[]>([]);

  // Show/hide animation
  useEffect(() => {
    if (hasError) {
      setIsVisible(true);

      if (autoHide && currentError) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(clearError, 300); // Wait for animation to complete
        }, autoHideDelay);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [hasError, currentError, autoHide, autoHideDelay, clearError]);

  // Manage visible error history
  useEffect(() => {
    if (showHistory && errorHistory.length > 0) {
      const errorIds = errorHistory
        .slice(0, maxVisible)
        .map((error, index) => `${error.type}-${index}`);
      setVisibleErrors(errorIds);
    }
  }, [errorHistory, showHistory, maxVisible]);

  const getPositionClasses = () => {
    const baseClasses = "fixed z-50 pointer-events-none";

    switch (position) {
      case "top-right":
        return `${baseClasses} top-4 right-4`;
      case "top-left":
        return `${baseClasses} top-4 left-4`;
      case "bottom-right":
        return `${baseClasses} bottom-4 right-4`;
      case "bottom-left":
        return `${baseClasses} bottom-4 left-4`;
      case "top-center":
        return `${baseClasses} top-4 left-1/2 transform -translate-x-1/2`;
      case "bottom-center":
        return `${baseClasses} bottom-4 left-1/2 transform -translate-x-1/2`;
      default:
        return `${baseClasses} top-4 right-4`;
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(clearError, 300);
  };

  const handleRetry = () => {
    // Implement retry logic based on error type
    if (currentError?.retryable) {
      clearError();
      // The retry action will be handled by the component that triggered the error
    }
  };

  if (!hasError && !showHistory) {
    return null;
  }

  return (
    <div className={getPositionClasses()}>
      <div className="space-y-2 max-w-sm w-full">
        {/* Current Error */}
        {currentError && (
          <div
            className={`transform transition-all duration-300 ease-in-out pointer-events-auto ${
              isVisible
                ? "translate-x-0 opacity-100 scale-100"
                : position.includes("right")
                  ? "translate-x-full opacity-0 scale-95"
                  : "-translate-x-full opacity-0 scale-95"
            }`}
          >
            <ErrorNotificationCard
              error={currentError}
              onClose={handleClose}
              onRetry={handleRetry}
              isClosable={true}
            />
          </div>
        )}

        {/* Error History (if enabled) */}
        {showHistory && errorHistory.length > 0 && (
          <div className="space-y-2">
            {errorHistory.slice(0, maxVisible).map((error, index) => (
              <div
                key={`${error.type}-${index}`}
                className="transform transition-all duration-300 ease-in-out pointer-events-auto opacity-75 scale-95"
              >
                <ErrorNotificationCard
                  error={error}
                  onClose={() => {
                    // Remove from history
                    setVisibleErrors((prev) =>
                      prev.filter((id) => id !== `${error.type}-${index}`),
                    );
                  }}
                  isClosable={true}
                  isHistorical={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ErrorNotificationCardProps {
  error: Error | { message: string; type?: string; action?: string; retryable?: boolean };
  onClose?: () => void;
  onRetry?: () => void;
  isClosable?: boolean;
  isHistorical?: boolean;
}

function ErrorNotificationCard({
  error,
  onClose,
  onRetry,
  isClosable = true,
  isHistorical = false,
}: ErrorNotificationCardProps) {
  const getSeverityIcon = () => {
    const errorType = 'type' in error ? error.type : 'unknown';
    switch (errorType) {
      case AuthErrorType.NETWORK_ERROR:
      case AuthErrorType.TIMEOUT_ERROR:
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case AuthErrorType.SESSION_EXPIRED:
      case AuthErrorType.INVALID_CREDENTIALS:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case AuthErrorType.PROFILE_INCOMPLETE:
      case AuthErrorType.EMAIL_NOT_CONFIRMED:
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const getSeverityColors = () => {
    const errorType = 'type' in error ? error.type : 'unknown';
    switch (errorType) {
      case AuthErrorType.NETWORK_ERROR:
      case AuthErrorType.TIMEOUT_ERROR:
        return "bg-orange-50 border-orange-200 text-orange-800";
      case AuthErrorType.SESSION_EXPIRED:
      case AuthErrorType.INVALID_CREDENTIALS:
        return "bg-red-50 border-red-200 text-red-800";
      case AuthErrorType.PROFILE_INCOMPLETE:
      case AuthErrorType.EMAIL_NOT_CONFIRMED:
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-red-50 border-red-200 text-red-800";
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 shadow-lg ${getSeverityColors()} ${isHistorical ? "opacity-75" : ""}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{getSeverityIcon()}</div>

        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {isHistorical ? "Previous Error" : "Authentication Error"}
            </p>
            {isClosable && (
              <button
                onClick={onClose}
                className="ml-2 flex-shrink-0 rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <p className="mt-1 text-sm">{error.message}</p>

          {!isHistorical && onRetry && (
            <div className="mt-3 flex space-x-2">
              {('retryable' in error && error.retryable) && onRetry && (
                <button
                  onClick={onRetry}
                  className="text-xs font-medium underline hover:no-underline"
                >
                  Try Again
                </button>
              )}

              {'action' in error && error.action && error.action !== "retry" && (
                <button
                  onClick={() => {
                    switch (error.action) {
                      case "login":
                        window.location.href = "/auth/login";
                        break;
                      case "signup":
                        window.location.href = "/auth/signup";
                        break;
                      case "complete_profile":
                        window.location.href = "/auth/complete-profile";
                        break;
                      case "contact_support":
                        window.location.href = "/contact";
                        break;
                    }
                  }}
                  className="text-xs font-medium underline hover:no-underline"
                >
                  {error.action === "login"
                    ? "Sign In"
                    : error.action === "signup"
                      ? "Sign Up"
                      : error.action === "complete_profile"
                        ? "Complete Profile"
                        : error.action === "contact_support"
                          ? "Contact Support"
                          : "Take Action"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// SSR-safe wrapper component
export function AuthErrorNotification(props: AuthErrorNotificationProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <AuthErrorNotificationInternal {...props} />;
}

/**
 * Toast-style notification for quick errors
 */
export function AuthErrorToast() {
  return (
    <AuthErrorNotification
      position="top-right"
      autoHide={true}
      autoHideDelay={4000}
      showHistory={false}
    />
  );
}

/**
 * Persistent notification bar for critical errors
 */
// Internal banner component
function AuthErrorBannerInternal() {
  const { currentError, clearError } = useAuthError();

  if (!currentError || currentError.type === AuthErrorType.NETWORK_ERROR) {
    return null;
  }

  // Only show banner for critical errors
  const criticalErrors = [
    AuthErrorType.SESSION_EXPIRED,
    AuthErrorType.INSUFFICIENT_PERMISSIONS,
    AuthErrorType.PROFILE_INCOMPLETE,
  ];

  if (!criticalErrors.includes(currentError.type)) {
    return null;
  }

  return (
    <div className="bg-red-600 text-white">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-red-800">
              <AlertTriangle className="h-6 w-6 text-white" />
            </span>
            <p className="ml-3 font-medium text-white">
              {currentError.userMessage}
            </p>
          </div>

          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            {'action' in currentError && currentError.action && (
              <button
                onClick={() => {
                  switch (currentError.action) {
                    case "login":
                      window.location.href = "/auth/login";
                      break;
                    case "complete_profile":
                      window.location.href = "/auth/complete-profile";
                      break;
                  }
                }}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50"
              >
                {currentError.action === "login"
                  ? "Sign In"
                  : "Complete Profile"}
              </button>
            )}
          </div>

          <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
            <button
              type="button"
              onClick={clearError}
              className="-mr-1 flex p-2 rounded-md hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// SSR-safe wrapper for AuthErrorBanner
export function AuthErrorBanner() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <AuthErrorBannerInternal />;
}
