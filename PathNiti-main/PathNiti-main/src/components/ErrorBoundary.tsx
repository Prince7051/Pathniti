/**
 * Enhanced error boundary components for comprehensive error handling
 */

"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Home, ArrowLeft, Bug } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
  context?: string;
  showReportButton?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
  errorId: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimer?: NodeJS.Timeout;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      errorId: this.generateErrorId(),
    };
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Store error info in state
    this.setState({ errorInfo });

    // Log error with context
    this.logError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry for recoverable errors
    if (
      this.props.autoRetry &&
      this.isRetryableError(error) &&
      this.state.retryCount < (this.props.maxRetries || 3)
    ) {
      this.scheduleRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context,
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "unknown",
      url: typeof window !== "undefined" ? window.location.href : "unknown",
    };

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error Boundary caught an error:", errorData);
    }

    // In production, you might want to send this to an error reporting service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === "production") {
      // sendErrorToService(errorData)
    }
  }

  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      "ChunkLoadError",
      "Loading chunk",
      "Cannot read properties of undefined (reading 'call')",
      "Network Error",
      "Failed to fetch",
    ];

    return retryableErrors.some(
      (retryable) =>
        error.message.includes(retryable) || error.name.includes(retryable),
    );
  }

  private scheduleRetry() {
    // Exponential backoff: 2s, 4s, 8s
    const delay = 2000 * Math.pow(2, this.state.retryCount);

    this.retryTimer = setTimeout(() => {
      this.handleRetry();
    }, delay);
  }

  private handleRetry = () => {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }

    this.setState((prevState) => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1,
      errorId: this.generateErrorId(),
    }));
  };

  private handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  private handleGoBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  private handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  private handleReportError = () => {
    if (!this.state.error) return;

    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error.message,
      context: this.props.context,
      timestamp: new Date().toISOString(),
    };

    const subject = encodeURIComponent(`Error Report: ${this.state.errorId}`);
    const body = encodeURIComponent(
      `
Error ID: ${errorReport.errorId}
Context: ${errorReport.context || "Unknown"}
Message: ${errorReport.message}
Timestamp: ${errorReport.timestamp}

Please describe what you were doing when this error occurred:
[Your description here]
    `.trim(),
    );

    window.open(`mailto:support@pathniti.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isRetryable = this.isRetryableError(this.state.error);
      const canRetry =
        isRetryable && this.state.retryCount < (this.props.maxRetries || 3);

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-6">
            <Card className="p-6">
              <div className="text-center space-y-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Something went wrong
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {this.getErrorMessage()}
                  </p>

                  {this.props.context && (
                    <p className="mt-1 text-xs text-gray-400">
                      Context: {this.props.context}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {canRetry && (
                    <Button
                      onClick={this.handleRetry}
                      variant="default"
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again ({this.state.retryCount}/
                      {this.props.maxRetries || 3})
                    </Button>
                  )}

                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={this.handleGoBack}
                      variant="outline"
                      size="sm"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Go Back
                    </Button>

                    <Button
                      onClick={this.handleGoHome}
                      variant="outline"
                      size="sm"
                    >
                      <Home className="h-4 w-4 mr-1" />
                      Home
                    </Button>
                  </div>

                  {this.props.showReportButton && (
                    <Button
                      onClick={this.handleReportError}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500"
                    >
                      <Bug className="h-4 w-4 mr-2" />
                      Report Error
                    </Button>
                  )}
                </div>

                {this.props.showErrorDetails && this.state.errorInfo && (
                  <details className="mt-4 text-xs text-gray-500">
                    <summary className="cursor-pointer font-medium">
                      Technical Details
                    </summary>
                    <div className="mt-2 p-3 bg-gray-100 rounded text-left">
                      <div className="space-y-2">
                        <div>
                          <strong>Error ID:</strong> {this.state.errorId}
                        </div>
                        <div>
                          <strong>Message:</strong>
                          <pre className="whitespace-pre-wrap">
                            {this.state.error.message}
                          </pre>
                        </div>
                        <div>
                          <strong>Stack:</strong>
                          <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-32">
                            {this.state.error.stack}
                          </pre>
                        </div>
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-32">
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

  private getErrorMessage(): string {
    if (!this.state.error) return "An unknown error occurred";

    const message = this.state.error.message;

    // User-friendly error messages
    if (
      message.includes("ChunkLoadError") ||
      message.includes("Loading chunk") ||
      message.includes("Cannot read properties of undefined (reading 'call')")
    ) {
      return "Failed to load application resources. Please refresh the page.";
    }

    if (
      message.includes("Network Error") ||
      message.includes("Failed to fetch")
    ) {
      return "Network connection error. Please check your internet connection and try again.";
    }

    if (message.includes("Unauthorized") || message.includes("401")) {
      return "Your session has expired. Please log in again.";
    }

    if (message.includes("Forbidden") || message.includes("403")) {
      return "You don't have permission to access this resource.";
    }

    return message;
  }
}

// Specialized error boundaries for different contexts

export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      context="page"
      showErrorDetails={process.env.NODE_ENV === "development"}
      autoRetry={true}
      maxRetries={2}
      showReportButton={true}
    >
      {children}
    </ErrorBoundary>
  );
}

export function FormErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      context="form"
      showErrorDetails={false}
      autoRetry={false}
      showReportButton={true}
      fallback={
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <p className="font-medium">Form Error</p>
              <p className="text-sm">
                There was an error with the form. Please refresh the page and
                try again.
              </p>
              <Button
                size="sm"
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Refresh Page
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function APIErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      context="api"
      showErrorDetails={false}
      autoRetry={true}
      maxRetries={3}
      showReportButton={false}
    >
      {children}
    </ErrorBoundary>
  );
}

export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      context="dashboard"
      showErrorDetails={process.env.NODE_ENV === "development"}
      autoRetry={false}
      showReportButton={true}
    >
      {children}
    </ErrorBoundary>
  );
}

// Hook for handling errors in functional components
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    // Log error
    console.error(`Error in ${context || "component"}:`, error);

    // In production, you might want to send to error reporting service
    if (process.env.NODE_ENV === "production") {
      // sendErrorToService({ error, context })
    }

    // You could also trigger a toast notification here
    // toast.error('Something went wrong. Please try again.')
  };

  const handleAsyncError = async (
    asyncFn: () => Promise<unknown>,
    context?: string,
  ) => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error, context);
      throw error;
    }
  };

  return { handleError, handleAsyncError };
}
