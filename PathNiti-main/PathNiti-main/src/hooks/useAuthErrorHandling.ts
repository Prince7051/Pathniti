"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthError } from "@/contexts/AuthErrorContext";
import { useAuth } from "@/app/providers";
import {
  AuthErrorType,
  AuthErrorInfo,
  parseAuthError,
  shouldRedirect,
  getRedirectUrl,
} from "@/lib/auth-errors";

interface UseAuthErrorHandlingOptions {
  autoRedirect?: boolean;
  showNotifications?: boolean;
  logErrors?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

interface AuthErrorHandlingResult {
  handleError: (error: Error | unknown, context?: Record<string, unknown>) => void;
  handleAsyncError: <T>(asyncFn: () => Promise<T>, context?: Record<string, unknown>) => Promise<T>;
  wrapWithErrorHandling: <T extends (...args: unknown[]) => unknown>(
    fn: T,
    context?: Record<string, unknown>,
  ) => T;
  clearError: () => void;
  currentError: Error | null;
  hasError: boolean;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
}

/**
 * Comprehensive hook for handling authentication errors in components
 */
export function useAuthErrorHandling(
  options: UseAuthErrorHandlingOptions = {},
): AuthErrorHandlingResult {
  const {
    autoRedirect = true,
    showNotifications = true,
    retryAttempts = 3,
    retryDelay = 1000,
  } = options;

  const { showError, clearError, currentError, hasError } = useAuthError();
  const { user, session, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<AuthErrorInfo | null>(null);

  const canRetry = retryCount < retryAttempts && (lastError?.retryable ?? false);

  const handleError = useCallback(
    (error: Error | unknown, context?: Record<string, unknown>) => {
      const parsedError = parseAuthError(error);
      setLastError(parsedError);

      // Show error through the global error system
      if (showNotifications) {
        showError(error instanceof Error ? error : new Error(String(error)), { ...context, pathname, user: user?.email });
      }

      // Handle automatic redirects
      if (autoRedirect && shouldRedirect(parsedError)) {
        const redirectUrl = getRedirectUrl(parsedError, pathname);

        // Delay redirect for critical errors to show the error message
        const delay =
          parsedError.type === AuthErrorType.SESSION_EXPIRED ? 2000 : 1000;
        setTimeout(() => {
          router.push(redirectUrl);
        }, delay);
      }

      // Handle specific error types
      switch (parsedError.type) {
        case AuthErrorType.SESSION_EXPIRED:
        case AuthErrorType.SESSION_INVALID:
        case AuthErrorType.TOKEN_REFRESH_FAILED:
          // Clear local auth state and redirect to login
          if (autoRedirect) {
            setTimeout(() => {
              window.location.href = "/auth/login";
            }, 1000);
          }
          break;

        case AuthErrorType.PROFILE_NOT_FOUND:
        case AuthErrorType.PROFILE_INCOMPLETE:
          // Redirect to profile completion
          if (autoRedirect) {
            setTimeout(() => {
              router.push("/auth/complete-profile");
            }, 1000);
          }
          break;

        case AuthErrorType.INSUFFICIENT_PERMISSIONS:
        case AuthErrorType.ACCESS_DENIED:
          // Redirect to appropriate dashboard
          if (autoRedirect) {
            const dashboardUrl =
              profile?.role === "admin"
                ? "/admin"
                : profile?.role === "college"
                  ? "/colleges/dashboard"
                  : "/dashboard";
            setTimeout(() => {
              router.push(dashboardUrl);
            }, 1000);
          }
          break;
      }
    },
    [
      showError,
      showNotifications,
      autoRedirect,
      pathname,
      user,
      profile,
      router,
    ],
  );

  const handleAsyncError = useCallback(
    async <T>(asyncFn: () => Promise<T>, context?: Record<string, unknown>): Promise<T> => {
      try {
        setIsRetrying(false);
        const result = await asyncFn();

        // Reset retry count on success
        setRetryCount(0);
        setLastError(null);

        return result;
      } catch (error) {
        handleError(error, context);
        throw error;
      }
    },
    [handleError],
  );

  const wrapWithErrorHandling = useCallback(
    <T extends (...args: unknown[]) => unknown>(fn: T, context?: Record<string, unknown>): T => {
      return ((...args: unknown[]) => {
        try {
          const result = fn(...args);

          // Handle async functions
          if (result && typeof (result as { then: (...args: unknown[]) => unknown }).then === "function") {
            return (result as { catch: (error: Error | unknown) => unknown }).catch((error: Error | unknown) => {
              handleError(error, context);
              throw error;
            });
          }

          return result;
        } catch (error) {
          handleError(error, context);
          throw error;
        }
      }) as T;
    },
    [handleError],
  );

  const retryLastAction = useCallback(
    async (actionFn?: () => Promise<unknown>) => {
      if (!canRetry) return;

      setIsRetrying(true);
      setRetryCount((prev) => prev + 1);

      try {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * retryCount),
        );

        if (actionFn) {
          await actionFn();
        }

        // Clear error on successful retry
        clearError();
        setLastError(null);
        setRetryCount(0);
      } catch (error) {
        handleError(error, { context: "retry_attempt", retryCount });
      } finally {
        setIsRetrying(false);
      }
    },
    [canRetry, retryDelay, retryCount, clearError, handleError],
  );

  // Auto-retry for certain error types
  useEffect(() => {
    if (lastError && lastError.retryable && retryCount < retryAttempts) {
      const shouldAutoRetry = [
        AuthErrorType.NETWORK_ERROR,
        AuthErrorType.TIMEOUT_ERROR,
        AuthErrorType.SERVER_ERROR,
      ].includes(lastError.type);

      if (shouldAutoRetry) {
        const timer = setTimeout(
          () => {
            retryLastAction();
          },
          retryDelay * (retryCount + 1),
        );

        return () => clearTimeout(timer);
      }
    }
  }, [lastError, retryCount, retryAttempts, retryDelay, retryLastAction]);

  // Clear errors when auth state changes successfully
  useEffect(() => {
    if (!loading && user && session && profile) {
      setLastError(null);
      setRetryCount(0);
      clearError();
    }
  }, [loading, user, session, profile, clearError]);

  return {
    handleError,
    handleAsyncError,
    wrapWithErrorHandling,
    clearError,
    currentError: currentError as Error | null,
    hasError,
    isRetrying,
    retryCount,
    canRetry,
  };
}

/**
 * Specialized hook for form error handling
 */
export function useAuthFormErrorHandling() {
  const { handleError, clearError, currentError, hasError } =
    useAuthErrorHandling({
      autoRedirect: false, // Don't auto-redirect on form errors
      showNotifications: false, // Handle notifications manually in forms
    });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleFormError = useCallback(
    (error: Error | unknown, field?: string) => {
      const parsedError = parseAuthError(error);

      if (field) {
        setFieldErrors((prev) => ({
          ...prev,
          [field]: parsedError.userMessage,
        }));
      } else {
        handleError(error, { context: "form_submission" });
      }
    },
    [handleError],
  );

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
    clearError();
  }, [clearError]);

  return {
    handleFormError,
    clearFieldError,
    clearAllErrors,
    fieldErrors,
    generalError: currentError,
    hasError,
  };
}

/**
 * Hook for handling authentication errors in API calls
 */
export function useAuthApiErrorHandling() {
  const { handleAsyncError, wrapWithErrorHandling } = useAuthErrorHandling({
    autoRedirect: true,
    showNotifications: true,
    retryAttempts: 2,
  });

  const handleApiCall = useCallback(
    async <T>(apiCall: () => Promise<T>, endpoint?: string): Promise<T> => {
      return handleAsyncError(apiCall, { context: "api_call", endpoint });
    },
    [handleAsyncError],
  );

  const wrapApiFunction = useCallback(
    <T extends (...args: unknown[]) => Promise<unknown>>(
      apiFn: T,
      endpoint?: string,
    ): T => {
      return wrapWithErrorHandling(apiFn, {
        context: "api_function",
        endpoint,
      });
    },
    [wrapWithErrorHandling],
  );

  return {
    handleApiCall,
    wrapApiFunction,
  };
}
