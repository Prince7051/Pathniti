/**
 * Error recovery utilities for college signup flow
 * Provides fallback options and recovery mechanisms
 */

import { signupSessionManager } from "../services/signup-session";
import { CollegeSignupFormData } from "../types/signup-session";

export interface ErrorRecoveryOptions {
  showFallbacks?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  type: "primary" | "secondary" | "danger";
  description?: string;
}

export class ErrorRecoveryManager {
  private static retryCount = new Map<string, number>();

  /**
   * Handle form submission errors with recovery options
   */
  static handleSubmissionError(
    error: Error | string,
    formData: Partial<CollegeSignupFormData>,
    _options: ErrorRecoveryOptions = {},
  ): {
    message: string;
    actions: RecoveryAction[];
    canRetry: boolean;
  } {
    const errorMessage = typeof error === "string" ? error : error.message;
    const actions: RecoveryAction[] = [];
    const canRetry = true;

    // Save current form data for recovery
    signupSessionManager.saveFormData(formData, "college-selection");

    // Categorize error types and provide appropriate recovery actions
    if (
      errorMessage.toLowerCase().includes("network") ||
      errorMessage.toLowerCase().includes("connection") ||
      errorMessage.toLowerCase().includes("timeout")
    ) {
      actions.push({
        label: "Retry Submission",
        action: () => window.location.reload(),
        type: "primary",
        description: "Try submitting the form again",
      });

      actions.push({
        label: "Check Connection",
        action: () => {
          if (typeof window !== "undefined" && navigator.onLine) {
            alert(
              "Your internet connection appears to be working. Please try again.",
            );
          } else {
            alert(
              "You appear to be offline. Please check your internet connection and try again.",
            );
          }
        },
        type: "secondary",
        description: "Verify your internet connection",
      });
    } else if (
      errorMessage.toLowerCase().includes("email") &&
      errorMessage.toLowerCase().includes("already")
    ) {
      actions.push({
        label: "Sign In Instead",
        action: () => { window.location.href = "/auth/login"; },
        type: "primary",
        description: "Use your existing account",
      });

      actions.push({
        label: "Reset Password",
        action: () => { window.location.href = "/auth/reset-password"; },
        type: "secondary",
        description: "If you forgot your password",
      });
    } else if (
      errorMessage.toLowerCase().includes("college") &&
      errorMessage.toLowerCase().includes("not found")
    ) {
      actions.push({
        label: "Register New College",
        action: () => {
          const returnUrl = encodeURIComponent(window.location.href);
          window.location.href = `/colleges/register?source=signup&returnTo=${returnUrl}`;
        },
        type: "primary",
        description: "Add your college to our database",
      });

      actions.push({
        label: "Search Again",
        action: () => {
          // Clear college selection to allow re-search
          const currentData = signupSessionManager.getFormData();
          if (currentData) {
            signupSessionManager.saveFormData(
              {
                ...currentData,
                collegeId: "",
              },
              "college-selection",
            );
          }
          window.location.reload();
        },
        type: "secondary",
        description: "Try searching for your college again",
      });
    } else if (
      errorMessage.toLowerCase().includes("validation") ||
      errorMessage.toLowerCase().includes("invalid")
    ) {
      actions.push({
        label: "Review Form",
        action: () => {
          // Scroll to top of form
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
        type: "primary",
        description: "Check all fields for errors",
      });

      actions.push({
        label: "Clear Form",
        action: () => {
          if (confirm("This will clear all form data. Are you sure?")) {
            signupSessionManager.clearSession();
            window.location.reload();
          }
        },
        type: "danger",
        description: "Start over with a fresh form",
      });
    } else {
      // Generic error handling
      actions.push({
        label: "Try Again",
        action: () => window.location.reload(),
        type: "primary",
        description: "Reload the page and try again",
      });

      actions.push({
        label: "Contact Support",
        action: () => {
          const subject = encodeURIComponent("College Signup Error");
          const body = encodeURIComponent(
            `I encountered an error during college signup: ${errorMessage}`,
          );
          window.location.href = `mailto:support@pathniti.com?subject=${subject}&body=${body}`;
        },
        type: "secondary",
        description: "Get help from our support team",
      });
    }

    // Add session recovery option if there's saved data
    const sessionData = signupSessionManager.getFormData();
    if (
      sessionData &&
      Object.values(sessionData).some(
        (value) => value && value.toString().trim() !== "",
      )
    ) {
      actions.push({
        label: "Restore Previous Data",
        action: () => {
          // This would trigger a form reload with saved data
          window.location.reload();
        },
        type: "secondary",
        description: "Restore your previously entered information",
      });
    }

    return {
      message: this.formatErrorMessage(errorMessage),
      actions,
      canRetry,
    };
  }

  /**
   * Handle session recovery scenarios
   */
  static handleSessionRecovery(): {
    hasRecoverableSession: boolean;
    sessionAge: number;
    actions: RecoveryAction[];
  } {
    const session = signupSessionManager.getSession();
    const actions: RecoveryAction[] = [];

    if (!session) {
      return {
        hasRecoverableSession: false,
        sessionAge: 0,
        actions: [],
      };
    }

    const sessionAge = Math.floor(
      (Date.now() - session.timestamp) / (60 * 1000),
    ); // minutes
    const timeUntilExpiration = signupSessionManager.getTimeUntilExpiration();

    // Session is about to expire
    if (timeUntilExpiration <= 5 && timeUntilExpiration > 0) {
      actions.push({
        label: "Extend Session",
        action: () => {
          signupSessionManager.extendSession(30);
          alert("Session extended for 30 more minutes");
        },
        type: "primary",
        description: `Session expires in ${timeUntilExpiration} minutes`,
      });
    }

    // Session has recoverable data
    if (
      session.formData &&
      Object.values(session.formData).some(
        (value) => value && value.toString().trim() !== "",
      )
    ) {
      actions.push({
        label: "Continue Where You Left Off",
        action: () => {
          // This would be handled by the component
          window.location.reload();
        },
        type: "primary",
        description: "Resume your signup process",
      });

      actions.push({
        label: "Start Fresh",
        action: () => {
          if (confirm("This will clear your saved progress. Are you sure?")) {
            signupSessionManager.clearSession();
            window.location.reload();
          }
        },
        type: "secondary",
        description: "Clear saved data and start over",
      });
    }

    return {
      hasRecoverableSession: true,
      sessionAge,
      actions,
    };
  }

  /**
   * Handle college search/selection errors
   */
  static handleCollegeSelectionError(error: string): RecoveryAction[] {
    const actions: RecoveryAction[] = [];

    if (
      error.toLowerCase().includes("not found") ||
      error.toLowerCase().includes("no colleges")
    ) {
      actions.push({
        label: "Register New College",
        action: () => {
          const returnUrl = encodeURIComponent(window.location.href);
          window.location.href = `/colleges/register?source=signup&returnTo=${returnUrl}`;
        },
        type: "primary",
        description: "Add your college to our database",
      });

      actions.push({
        label: "Try Different Search",
        action: () => {
          // This would be handled by the component to clear search
        },
        type: "secondary",
        description: "Search with different keywords",
      });
    }

    if (
      error.toLowerCase().includes("loading") ||
      error.toLowerCase().includes("failed to load")
    ) {
      actions.push({
        label: "Reload Colleges",
        action: () => {
          window.location.reload();
        },
        type: "primary",
        description: "Refresh the college list",
      });
    }

    return actions;
  }

  /**
   * Format error messages for better user experience
   */
  private static formatErrorMessage(error: string): string {
    // Common error message improvements
    const errorMappings: Record<string, string> = {
      "Network Error":
        "Connection problem. Please check your internet and try again.",
      "Failed to fetch": "Unable to connect to our servers. Please try again.",
      "Invalid email": "Please enter a valid email address.",
      "Password too weak":
        "Please choose a stronger password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.",
      "User already exists":
        "An account with this email already exists. Try signing in instead.",
      "College not found":
        "We couldn't find your college in our database. You can register it as a new college.",
      "Validation failed":
        "Please check all fields and fix any errors before submitting.",
    };

    // Check for exact matches first
    if (errorMappings[error]) {
      return errorMappings[error];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(errorMappings)) {
      if (error.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    // Return original error if no mapping found, but make it more user-friendly
    return (
      error.charAt(0).toUpperCase() +
      error.slice(1) +
      (error.endsWith(".") ? "" : ".")
    );
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: string): boolean {
    const retryableErrors = [
      "network",
      "connection",
      "timeout",
      "failed to fetch",
      "server error",
      "500",
      "502",
      "503",
      "504",
    ];

    return retryableErrors.some((retryable) =>
      error.toLowerCase().includes(retryable),
    );
  }

  /**
   * Implement exponential backoff for retries
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}
