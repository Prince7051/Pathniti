"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthErrorDisplay } from "./AuthErrorDisplay";
import { parseAuthError, logAuthError } from "@/lib/auth-errors";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class AuthErrorBoundary extends Component<Props, State> {
  private retryTimer?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Parse and log the authentication error
    const parsedError = parseAuthError(error);
    logAuthError(parsedError, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      retryCount: this.state.retryCount,
    });

    // Store error info in state
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry for recoverable errors
    if (
      this.props.autoRetry &&
      parsedError.retryable &&
      this.state.retryCount < (this.props.maxRetries || 3)
    ) {
      this.retryTimer = setTimeout(
        () => {
          this.handleRetry();
        },
        2000 * (this.state.retryCount + 1),
      ); // Exponential backoff
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  handleRetry = () => {
    // Clear the retry timer
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    // Increment retry count and reset error state
    this.setState((prevState) => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleGoToLogin = () => {
    // Navigate to login page
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
  };

  handleReload = () => {
    // Reload the page to retry authentication
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Parse the error for better display
      const parsedError = parseAuthError(this.state.error);

      // Use the new AuthErrorDisplay component
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-6">
            <AuthErrorDisplay
              error={parsedError}
              onRetry={parsedError.retryable ? this.handleRetry : undefined}
              showDetails={this.props.showErrorDetails}
              variant="card"
            />

            {/* Additional recovery options */}
            <Card className="p-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Recovery Options
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {parsedError.retryable && (
                    <Button
                      onClick={this.handleRetry}
                      variant="default"
                      className="w-full"
                      disabled={
                        this.state.retryCount >= (this.props.maxRetries || 3)
                      }
                    >
                      Try Again{" "}
                      {this.state.retryCount > 0 &&
                        `(${this.state.retryCount}/${this.props.maxRetries || 3})`}
                    </Button>
                  )}

                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="w-full"
                  >
                    Reload Page
                  </Button>

                  <Button
                    onClick={this.handleGoToLogin}
                    variant="outline"
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                </div>

                {this.props.showErrorDetails && this.state.errorInfo && (
                  <details className="mt-4 text-xs text-gray-500">
                    <summary className="cursor-pointer font-medium">
                      Technical Details
                    </summary>
                    <div className="mt-2 p-3 bg-gray-100 rounded text-left">
                      <div className="space-y-2">
                        <div>
                          <strong>Error:</strong>
                          <pre className="whitespace-pre-wrap">
                            {this.state.error.message}
                          </pre>
                        </div>
                        <div>
                          <strong>Stack:</strong>
                          <pre className="whitespace-pre-wrap text-xs">
                            {this.state.error.stack}
                          </pre>
                        </div>
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="whitespace-pre-wrap text-xs">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </details>
                )}
              </div>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced hook version for functional components
export function useAuthErrorHandler() {
  const handleAuthError = (error: Error, context?: Record<string, unknown>) => {
    const parsedError = parseAuthError(error);

    // Log the error
    logAuthError(parsedError, { ...context, hookUsage: true });

    // Handle different error types
    switch (parsedError.type) {
      case "session_expired":
      case "session_invalid":
      case "token_refresh_failed":
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        break;

      case "profile_not_found":
      case "profile_incomplete":
        if (typeof window !== "undefined") {
          window.location.href = "/auth/complete-profile";
        }
        break;

      case "insufficient_permissions":
      case "access_denied":
        if (typeof window !== "undefined") {
          window.location.href = "/dashboard";
        }
        break;

      default:
        // For other errors, just log them
        console.error("Authentication error:", parsedError);
    }
  };

  const handleAsyncAuthError = async (
    asyncFn: () => Promise<unknown>,
    context?: Record<string, unknown>,
  ) => {
    try {
      return await asyncFn();
    } catch (error) {
      handleAuthError(error as Error, context);
      throw error;
    }
  };

  return {
    handleAuthError,
    handleAsyncAuthError,
  };
}

/**
 * Specialized error boundary for authentication pages
 */
export function AuthPageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <AuthErrorBoundary
      showErrorDetails={process.env.NODE_ENV === "development"}
      autoRetry={true}
      maxRetries={2}
    >
      {children}
    </AuthErrorBoundary>
  );
}

/**
 * Specialized error boundary for protected routes
 */
export function ProtectedRouteErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthErrorBoundary
      showErrorDetails={false}
      autoRetry={false}
      onError={(error) => {
        const parsedError = parseAuthError(error);

        // Redirect immediately for session-related errors
        if (
          parsedError.type === "session_expired" ||
          parsedError.type === "session_invalid"
        ) {
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 1000);
        }
      }}
    >
      {children}
    </AuthErrorBoundary>
  );
}
