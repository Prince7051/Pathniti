"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  AuthErrorInfo,
  AuthErrorType,
  parseAuthError,
  shouldRedirect,
  getRedirectUrl,
  logAuthError,
} from "@/lib/auth-errors";

interface AuthErrorContextType {
  currentError: AuthErrorInfo | null;
  errorHistory: AuthErrorInfo[];
  showError: (error: Error | string, context?: Record<string, unknown>) => void;
  clearError: () => void;
  clearAllErrors: () => void;
  retryLastAction: () => void;
  hasError: boolean;
  isRecoverable: boolean;
}

const AuthErrorContext = createContext<AuthErrorContextType | undefined>(
  undefined,
);

export function useAuthError() {
  const context = useContext(AuthErrorContext);
  if (context === undefined) {
    throw new Error("useAuthError must be used within an AuthErrorProvider");
  }
  return context;
}

interface AuthErrorProviderProps {
  children: React.ReactNode;
  maxErrorHistory?: number;
  autoRedirect?: boolean;
}

export function AuthErrorProvider({
  children,
  maxErrorHistory = 10,
  autoRedirect = true,
}: AuthErrorProviderProps) {
  const [currentError, setCurrentError] = useState<AuthErrorInfo | null>(null);
  const [errorHistory, setErrorHistory] = useState<AuthErrorInfo[]>([]);
  const [lastAction, setLastAction] = useState<(() => void) | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const showError = useCallback(
    (error: Error | string, context?: Record<string, unknown>) => {
      const errorInfo = parseAuthError(error);

      // Log the error
      logAuthError(errorInfo, { ...context, pathname });

      // Update state
      setCurrentError(errorInfo);
      setErrorHistory((prev) => {
        const newHistory = [errorInfo, ...prev].slice(0, maxErrorHistory);
        return newHistory;
      });

      // Handle automatic redirects for critical errors
      if (autoRedirect && shouldRedirect(errorInfo)) {
        const redirectUrl = getRedirectUrl(errorInfo, pathname);

        // Delay redirect slightly to allow error display
        setTimeout(() => {
          router.push(redirectUrl);
        }, 2000);
      }
    },
    [pathname, router, maxErrorHistory, autoRedirect],
  );

  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  const clearAllErrors = useCallback(() => {
    setCurrentError(null);
    setErrorHistory([]);
    setLastAction(null);
  }, []);

  const retryLastAction = useCallback(() => {
    if (lastAction) {
      try {
        lastAction();
        clearError();
      } catch (error) {
        showError(error instanceof Error ? error : new Error(String(error)), { context: "retry_last_action" });
      }
    }
  }, [lastAction, clearError, showError]);

  // Set up global error handlers
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Only handle auth-related errors
      const error = event.reason;
      if (
        error &&
        (error.message?.includes("auth") ||
          error.message?.includes("session") ||
          error.message?.includes("token") ||
          error.message?.includes("unauthorized"))
      ) {
        showError(error, { context: "unhandled_promise_rejection" });
      }
    };

    const handleError = (event: ErrorEvent) => {
      // Only handle auth-related errors
      const error = event.error;
      if (
        error &&
        (error.message?.includes("auth") ||
          error.message?.includes("session") ||
          error.message?.includes("token") ||
          error.message?.includes("unauthorized"))
      ) {
        showError(error, { context: "global_error_handler" });
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
      window.removeEventListener("error", handleError);
    };
  }, [showError]);

  // Clear errors when navigating to a new page (except for critical errors)
  useEffect(() => {
    if (currentError && currentError.type !== AuthErrorType.SESSION_EXPIRED) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000); // Auto-clear non-critical errors after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [currentError, clearError]);

  const value: AuthErrorContextType = {
    currentError,
    errorHistory,
    showError,
    clearError,
    clearAllErrors,
    retryLastAction,
    hasError: !!currentError,
    isRecoverable: currentError?.recoverable ?? false,
  };

  return (
    <AuthErrorContext.Provider value={value}>
      {children}
    </AuthErrorContext.Provider>
  );
}

/**
 * Hook for handling authentication errors in components
 */
export function useAuthErrorHandler() {
  const { showError, clearError } = useAuthError();

  const handleError = useCallback(
    (error: Error | string, context?: Record<string, unknown>) => {
      showError(error, context);
    },
    [showError],
  );

  const handleAsyncError = useCallback(
    async (asyncFn: () => Promise<unknown>, context?: Record<string, unknown>) => {
      try {
        return await asyncFn();
      } catch (error) {
        handleError(error instanceof Error ? error : new Error(String(error)), context);
        throw error; // Re-throw so calling code can handle it too
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
          if (result && typeof result === 'object' && result !== null && 'then' in result && typeof (result as { then: (...args: unknown[]) => unknown }).then === "function") {
            return (result as Promise<unknown>).catch((error: Error) => {
              handleError(error, context);
              throw error;
            });
          }

          return result;
        } catch (error) {
          handleError(error instanceof Error ? error : new Error(String(error)), context);
          throw error;
        }
      }) as T;
    },
    [handleError],
  );

  return {
    handleError,
    handleAsyncError,
    wrapWithErrorHandling,
    clearError,
  };
}

/**
 * Higher-order component for wrapping components with error handling
 */
export function withAuthErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  // errorContext?: string, // Unused parameter
) {
  return function WrappedComponent(props: P) {
    // const { handleError } = useAuthErrorHandler(); // Unused variable

    // Create error boundary-like behavior for the component
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      // Reset error state when component unmounts
      return () => setHasError(false);
    }, []);

    if (hasError) {
      return (
        <div className="p-4 text-center">
          <p className="text-red-600">
            Something went wrong with authentication.
          </p>
          <button
            onClick={() => setHasError(false)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
