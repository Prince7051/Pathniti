/**
 * Centralized authentication error handling system
 */

// Define proper types for error objects
interface ErrorWithMessage {
  message?: string;
}

interface ErrorWithCode extends ErrorWithMessage {
  code?: string | number;
  status?: string | number;
}

type AuthError = Error | string | ErrorWithCode;


export enum AuthErrorType {
  // Authentication errors
  INVALID_CREDENTIALS = "invalid_credentials",
  EMAIL_NOT_CONFIRMED = "email_not_confirmed",
  USER_NOT_FOUND = "user_not_found",
  WEAK_PASSWORD = "weak_password",
  EMAIL_ALREADY_EXISTS = "email_already_exists",

  // Session errors
  SESSION_EXPIRED = "session_expired",
  SESSION_INVALID = "session_invalid",
  TOKEN_REFRESH_FAILED = "token_refresh_failed",

  // Profile errors
  PROFILE_NOT_FOUND = "profile_not_found",
  PROFILE_CREATION_FAILED = "profile_creation_failed",
  PROFILE_UPDATE_FAILED = "profile_update_failed",
  PROFILE_INCOMPLETE = "profile_incomplete",

  // Permission errors
  INSUFFICIENT_PERMISSIONS = "insufficient_permissions",
  ROLE_MISMATCH = "role_mismatch",
  ACCESS_DENIED = "access_denied",

  // Network errors
  NETWORK_ERROR = "network_error",
  TIMEOUT_ERROR = "timeout_error",
  SERVER_ERROR = "server_error",

  // Generic errors
  UNKNOWN_ERROR = "unknown_error",
  VALIDATION_ERROR = "validation_error",
}

export interface AuthErrorInfo {
  type: AuthErrorType;
  message: string;
  userMessage: string;
  recoverable: boolean;
  retryable: boolean;
  redirectTo?: string;
  action?:
    | "retry"
    | "login"
    | "signup"
    | "complete_profile"
    | "contact_support";
}

/**
 * Parse Supabase auth errors and return structured error information
 */
export function parseAuthError(error: unknown): AuthErrorInfo {
  if (!error) {
    return {
      type: AuthErrorType.UNKNOWN_ERROR,
      message: "Unknown error occurred",
      userMessage: "An unexpected error occurred. Please try again.",
      recoverable: true,
      retryable: true,
      action: "retry",
    };
  }

  const errorObj = error as AuthError;
  const message =
    (errorObj as ErrorWithMessage).message?.toLowerCase() || error.toString().toLowerCase();
  const code = (errorObj as ErrorWithCode).code || (errorObj as ErrorWithCode).status;

  // Invalid credentials
  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password")
  ) {
    return {
      type: AuthErrorType.INVALID_CREDENTIALS,
      message: (error as ErrorWithMessage).message || error.toString(),
      userMessage:
        "Invalid email or password. Please check your credentials and try again.",
      recoverable: true,
      retryable: true,
      action: "retry",
    };
  }

  // Email not confirmed
  if (
    message.includes("email not confirmed") ||
    message.includes("confirm your email")
  ) {
    return {
      type: AuthErrorType.EMAIL_NOT_CONFIRMED,
      message: (error as ErrorWithMessage).message || error.toString(),
      userMessage:
        "Please check your email and click the confirmation link before signing in.",
      recoverable: true,
      retryable: false,
      action: "login",
    };
  }

  // User not found
  if (message.includes("user not found") || code === "user_not_found") {
    return {
      type: AuthErrorType.USER_NOT_FOUND,
      message: (error as ErrorWithMessage).message || error.toString(),
      userMessage: "No account found with this email address.",
      recoverable: true,
      retryable: false,
      action: "signup",
    };
  }

  // Weak password
  if (
    message.includes("password") &&
    (message.includes("weak") || message.includes("strength"))
  ) {
    return {
      type: AuthErrorType.WEAK_PASSWORD,
      message: (error as ErrorWithMessage).message || error.toString(),
      userMessage:
        "Password is too weak. Please use at least 8 characters with uppercase, lowercase, and numbers.",
      recoverable: true,
      retryable: true,
      action: "retry",
    };
  }

  // Email already exists
  if (
    message.includes("email") &&
    message.includes("already") &&
    message.includes("registered")
  ) {
    return {
      type: AuthErrorType.EMAIL_ALREADY_EXISTS,
      message: (error as ErrorWithMessage).message || error.toString(),
      userMessage:
        "An account with this email already exists. Try signing in instead.",
      recoverable: true,
      retryable: false,
      action: "login",
    };
  }

  // Session expired
  if (
    message.includes("session") &&
    (message.includes("expired") || message.includes("invalid"))
  ) {
    return {
      type: AuthErrorType.SESSION_EXPIRED,
      message: (error as ErrorWithMessage).message || error.toString(),
      userMessage: "Your session has expired. Please sign in again.",
      recoverable: true,
      retryable: false,
      redirectTo: "/auth/login",
      action: "login",
    };
  }

  // Token refresh failed
  if (message.includes("token") && message.includes("refresh")) {
    return {
      type: AuthErrorType.TOKEN_REFRESH_FAILED,
      message: (error as ErrorWithMessage).message || error.toString(),
      userMessage: "Session refresh failed. Please sign in again.",
      recoverable: true,
      retryable: false,
      redirectTo: "/auth/login",
      action: "login",
    };
  }

  // Profile errors
  if (message.includes("profile")) {
    if (message.includes("not found")) {
      return {
        type: AuthErrorType.PROFILE_NOT_FOUND,
        message: (error as ErrorWithMessage).message || error.toString(),
        userMessage: "Profile not found. Please complete your profile setup.",
        recoverable: true,
        retryable: false,
        redirectTo: "/auth/complete-profile",
        action: "complete_profile",
      };
    }

    if (message.includes("incomplete")) {
      return {
        type: AuthErrorType.PROFILE_INCOMPLETE,
        message: (error as ErrorWithMessage).message || error.toString(),
        userMessage: "Please complete your profile to continue.",
        recoverable: true,
        retryable: false,
        redirectTo: "/auth/complete-profile",
        action: "complete_profile",
      };
    }
  }

  // Permission errors
  if (
    message.includes("permission") ||
    message.includes("unauthorized") ||
    message.includes("access denied")
  ) {
    return {
      type: AuthErrorType.INSUFFICIENT_PERMISSIONS,
      message: (error as ErrorWithMessage).message || error.toString(),
      userMessage: "You don't have permission to access this resource.",
      recoverable: false,
      retryable: false,
      redirectTo: "/dashboard",
      action: "login",
    };
  }

  // Network errors
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection")
  ) {
    return {
      type: AuthErrorType.NETWORK_ERROR,
      message: (error as ErrorWithMessage).message || error.toString(),
      userMessage:
        "Network error. Please check your internet connection and try again.",
      recoverable: true,
      retryable: true,
      action: "retry",
    };
  }

  // Timeout errors
  if (message.includes("timeout") || code === "TIMEOUT") {
    return {
      type: AuthErrorType.TIMEOUT_ERROR,
      message: (error as ErrorWithMessage).message || error.toString(),
      userMessage: "Request timed out. Please try again.",
      recoverable: true,
      retryable: true,
      action: "retry",
    };
  }

  // Server errors
  if (
    (code && typeof code === 'number' && code >= 500) ||
    message.includes("server error") ||
    message.includes("internal error")
  ) {
    return {
      type: AuthErrorType.SERVER_ERROR,
      message: (error as ErrorWithMessage).message || error.toString(),
      userMessage: "Server error. Please try again in a few moments.",
      recoverable: true,
      retryable: true,
      action: "retry",
    };
  }

  // Default unknown error
  return {
    type: AuthErrorType.UNKNOWN_ERROR,
    message: (error as ErrorWithMessage).message || "Unknown error",
    userMessage:
      "An unexpected error occurred. Please try again or contact support if the problem persists.",
    recoverable: true,
    retryable: true,
    action: "retry",
  };
}

/**
 * Get user-friendly error messages for different error types
 */
export function getErrorMessage(errorType: AuthErrorType): string {
  const errorMessages: Record<AuthErrorType, string> = {
    [AuthErrorType.INVALID_CREDENTIALS]:
      "Invalid email or password. Please check your credentials and try again.",
    [AuthErrorType.EMAIL_NOT_CONFIRMED]:
      "Please check your email and click the confirmation link before signing in.",
    [AuthErrorType.USER_NOT_FOUND]: "No account found with this email address.",
    [AuthErrorType.WEAK_PASSWORD]:
      "Password is too weak. Please use at least 8 characters with uppercase, lowercase, and numbers.",
    [AuthErrorType.EMAIL_ALREADY_EXISTS]:
      "An account with this email already exists. Try signing in instead.",
    [AuthErrorType.SESSION_EXPIRED]:
      "Your session has expired. Please sign in again.",
    [AuthErrorType.SESSION_INVALID]:
      "Your session is invalid. Please sign in again.",
    [AuthErrorType.TOKEN_REFRESH_FAILED]:
      "Session refresh failed. Please sign in again.",
    [AuthErrorType.PROFILE_NOT_FOUND]:
      "Profile not found. Please complete your profile setup.",
    [AuthErrorType.PROFILE_CREATION_FAILED]:
      "Failed to create profile. Please try again.",
    [AuthErrorType.PROFILE_UPDATE_FAILED]:
      "Failed to update profile. Please try again.",
    [AuthErrorType.PROFILE_INCOMPLETE]:
      "Please complete your profile to continue.",
    [AuthErrorType.INSUFFICIENT_PERMISSIONS]:
      "You don't have permission to access this resource.",
    [AuthErrorType.ROLE_MISMATCH]:
      "Your account role doesn't match the required permissions.",
    [AuthErrorType.ACCESS_DENIED]:
      "Access denied. Please contact support if you believe this is an error.",
    [AuthErrorType.NETWORK_ERROR]:
      "Network error. Please check your internet connection and try again.",
    [AuthErrorType.TIMEOUT_ERROR]: "Request timed out. Please try again.",
    [AuthErrorType.SERVER_ERROR]:
      "Server error. Please try again in a few moments.",
    [AuthErrorType.UNKNOWN_ERROR]:
      "An unexpected error occurred. Please try again or contact support if the problem persists.",
    [AuthErrorType.VALIDATION_ERROR]: "Please check your input and try again.",
  };

  return errorMessages[errorType] || errorMessages[AuthErrorType.UNKNOWN_ERROR];
}

/**
 * Determine if an error should trigger an automatic redirect
 */
export function shouldRedirect(errorInfo: AuthErrorInfo): boolean {
  return !!(errorInfo.redirectTo && !errorInfo.retryable);
}

/**
 * Get the appropriate redirect URL for an error
 */
export function getRedirectUrl(
  errorInfo: AuthErrorInfo,
  currentPath?: string,
): string {
  if (errorInfo.redirectTo) {
    return errorInfo.redirectTo;
  }

  // Default redirects based on error type
  switch (errorInfo.type) {
    case AuthErrorType.SESSION_EXPIRED:
    case AuthErrorType.SESSION_INVALID:
    case AuthErrorType.TOKEN_REFRESH_FAILED:
    case AuthErrorType.INVALID_CREDENTIALS:
      return "/auth/login";

    case AuthErrorType.PROFILE_NOT_FOUND:
    case AuthErrorType.PROFILE_INCOMPLETE:
      return "/auth/complete-profile";

    case AuthErrorType.EMAIL_ALREADY_EXISTS:
      return "/auth/login";

    case AuthErrorType.USER_NOT_FOUND:
      return "/auth/signup";

    case AuthErrorType.INSUFFICIENT_PERMISSIONS:
    case AuthErrorType.ACCESS_DENIED:
      return "/dashboard";

    default:
      return currentPath || "/";
  }
}

/**
 * Log authentication errors for monitoring and debugging
 */
export function logAuthError(errorInfo: AuthErrorInfo, context?: Record<string, unknown>) {
  const logData = {
    timestamp: new Date().toISOString(),
    type: errorInfo.type,
    message: errorInfo.message,
    userMessage: errorInfo.userMessage,
    recoverable: errorInfo.recoverable,
    retryable: errorInfo.retryable,
    context,
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("Auth Error:", logData);
  }

  // In production, you might want to send this to an error tracking service
  // Example: Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === "production") {
    // logToErrorService(logData)
  }
}
