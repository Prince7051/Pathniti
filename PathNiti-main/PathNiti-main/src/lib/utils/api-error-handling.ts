/**
 * Comprehensive API error handling utilities
 * Provides consistent error handling across all API endpoints
 */

import { NextRequest, NextResponse } from "next/server";

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
  timestamp: string;
  path?: string;
  requestId?: string;
}

export interface ErrorContext {
  endpoint?: string;
  method?: string;
  userId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
}

export class APIErrorHandler {
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create standardized error response
   */
  static createErrorResponse(
    error: string | Error | APIError,
    statusCode: number = 500,
    context?: ErrorContext,
  ): NextResponse {
    const requestId = context?.requestId || this.generateRequestId();
    const timestamp = new Date().toISOString();

    let apiError: APIError;

    if (typeof error === "string") {
      apiError = {
        code: this.getErrorCode(statusCode),
        message: error,
        statusCode,
        timestamp,
        requestId,
        path: context?.endpoint,
      };
    } else if (error instanceof Error) {
      apiError = {
        code: this.getErrorCode(statusCode),
        message: error.message,
        statusCode,
        timestamp,
        requestId,
        path: context?.endpoint,
        details:
          process.env.NODE_ENV === "development" ? { stack: error.stack } : undefined,
      };
    } else {
      apiError = {
        ...error,
        timestamp,
        requestId,
        path: context?.endpoint,
      };
    }

    // Log error for monitoring
    this.logError(apiError, context);

    return NextResponse.json(apiError, { status: statusCode });
  }

  /**
   * Handle validation errors
   */
  static createValidationErrorResponse(
    errors: Record<string, string>,
    context?: ErrorContext,
  ): NextResponse {
    return this.createErrorResponse(
      {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: errors,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
      400,
      context,
    );
  }

  /**
   * Handle authentication errors
   */
  static createAuthErrorResponse(
    message: string = "Authentication required",
    context?: ErrorContext,
  ): NextResponse {
    return this.createErrorResponse(
      {
        code: "AUTHENTICATION_ERROR",
        message,
        statusCode: 401,
        timestamp: new Date().toISOString(),
      },
      401,
      context,
    );
  }

  /**
   * Handle authorization errors
   */
  static createAuthorizationErrorResponse(
    message: string = "Insufficient permissions",
    context?: ErrorContext,
  ): NextResponse {
    return this.createErrorResponse(
      {
        code: "AUTHORIZATION_ERROR",
        message,
        statusCode: 403,
        timestamp: new Date().toISOString(),
      },
      403,
      context,
    );
  }

  /**
   * Handle not found errors
   */
  static createNotFoundErrorResponse(
    resource: string = "Resource",
    context?: ErrorContext,
  ): NextResponse {
    return this.createErrorResponse(
      {
        code: "NOT_FOUND",
        message: `${resource} not found`,
        statusCode: 404,
        timestamp: new Date().toISOString(),
      },
      404,
      context,
    );
  }

  /**
   * Handle conflict errors
   */
  static createConflictErrorResponse(
    message: string,
    context?: ErrorContext,
  ): NextResponse {
    return this.createErrorResponse(
      {
        code: "CONFLICT",
        message,
        statusCode: 409,
        timestamp: new Date().toISOString(),
      },
      409,
      context,
    );
  }

  /**
   * Handle rate limit errors
   */
  static createRateLimitErrorResponse(
    retryAfter?: number,
    context?: ErrorContext,
  ): NextResponse {
    const response = this.createErrorResponse(
      {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please try again later.",
        statusCode: 429,
        timestamp: new Date().toISOString(),
        details: retryAfter ? { retryAfter } : undefined,
      },
      429,
      context,
    );

    if (retryAfter) {
      response.headers.set("Retry-After", retryAfter.toString());
    }

    return response;
  }

  /**
   * Handle server errors
   */
  static createServerErrorResponse(
    error?: Error,
    context?: ErrorContext,
  ): NextResponse {
    return this.createErrorResponse(
      {
        code: "INTERNAL_SERVER_ERROR",
        message: "An internal server error occurred",
        statusCode: 500,
        timestamp: new Date().toISOString(),
        details:
          process.env.NODE_ENV === "development" && error
            ? {
                message: error.message,
                stack: error.stack,
              }
            : undefined,
      },
      500,
      context,
    );
  }

  /**
   * Wrap API handler with error handling
   */
  static withErrorHandling(
    handler: (request: NextRequest, context?: Record<string, unknown>) => Promise<NextResponse>,
    endpoint?: string,
  ) {
    return async (
      request: NextRequest,
      context?: Record<string, unknown>,
    ): Promise<NextResponse> => {
      const requestId = this.generateRequestId();
      const startTime = Date.now();

      try {
        const errorContext: ErrorContext = {
          endpoint,
          method: request.method,
          requestId,
          userAgent: request.headers.get("user-agent") || undefined,
          ip:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
        };

        const response = await handler(request, { ...context, errorContext });

        // Log successful requests in development
        if (process.env.NODE_ENV === "development") {
          console.log(
            `${request.method} ${endpoint} - ${response.status} - ${Date.now() - startTime}ms`,
          );
        }

        return response;
      } catch (error) {
        console.error(`API Error in ${endpoint}:`, error);

        const errorContext: ErrorContext = {
          endpoint,
          method: request.method,
          requestId,
          userAgent: request.headers.get("user-agent") || undefined,
          ip:
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown",
        };

        // Handle specific error types
        if (error instanceof Error) {
          if (
            error.message.includes("Unauthorized") ||
            error.message.includes("401")
          ) {
            return this.createAuthErrorResponse(error.message, errorContext);
          }

          if (
            error.message.includes("Forbidden") ||
            error.message.includes("403")
          ) {
            return this.createAuthorizationErrorResponse(
              error.message,
              errorContext,
            );
          }

          if (
            error.message.includes("Not found") ||
            error.message.includes("404")
          ) {
            return this.createNotFoundErrorResponse("Resource", errorContext);
          }

          if (
            error.message.includes("Conflict") ||
            error.message.includes("409")
          ) {
            return this.createConflictErrorResponse(
              error.message,
              errorContext,
            );
          }
        }

        return this.createServerErrorResponse(error as Error, errorContext);
      }
    };
  }

  /**
   * Get error code from status code
   */
  private static getErrorCode(statusCode: number): string {
    const codes: Record<number, string> = {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "UNPROCESSABLE_ENTITY",
      429: "RATE_LIMIT_EXCEEDED",
      500: "INTERNAL_SERVER_ERROR",
      502: "BAD_GATEWAY",
      503: "SERVICE_UNAVAILABLE",
      504: "GATEWAY_TIMEOUT",
    };

    return codes[statusCode] || "UNKNOWN_ERROR";
  }

  /**
   * Log error for monitoring
   */
  private static logError(error: APIError, context?: ErrorContext) {
    const logData = {
      ...error,
      context,
      environment: process.env.NODE_ENV,
    };

    // Console log in development
    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", logData);
    }

    // In production, you might want to send to monitoring service
    // Example: Sentry, DataDog, CloudWatch, etc.
    if (process.env.NODE_ENV === "production") {
      // sendToMonitoringService(logData)
    }
  }

  /**
   * Parse Supabase errors
   */
  static parseSupabaseError(error: unknown): {
    message: string;
    code: string;
    statusCode: number;
  } {
    if (!error) {
      return {
        message: "Unknown database error",
        code: "DATABASE_ERROR",
        statusCode: 500,
      };
    }

    // Handle Supabase auth errors
    if ((error as { message?: string }).message?.includes("JWT")) {
      return {
        message: "Authentication token invalid",
        code: "INVALID_TOKEN",
        statusCode: 401,
      };
    }

    // Handle RLS policy violations
    if ((error as { code?: string; message?: string }).code === "42501" || (error as { code?: string; message?: string }).message?.includes("policy")) {
      return {
        message: "Access denied",
        code: "ACCESS_DENIED",
        statusCode: 403,
      };
    }

    // Handle unique constraint violations
    if ((error as { code?: string }).code === "23505") {
      return {
        message: "Resource already exists",
        code: "DUPLICATE_RESOURCE",
        statusCode: 409,
      };
    }

    // Handle foreign key violations
    if ((error as { code?: string }).code === "23503") {
      return {
        message: "Referenced resource not found",
        code: "INVALID_REFERENCE",
        statusCode: 400,
      };
    }

    // Handle not null violations
    if ((error as { code?: string }).code === "23502") {
      return {
        message: "Required field missing",
        code: "MISSING_REQUIRED_FIELD",
        statusCode: 400,
      };
    }

    // Handle no rows returned (PGRST116)
    if ((error as { code?: string }).code === "PGRST116") {
      return {
        message: "Resource not found",
        code: "NOT_FOUND",
        statusCode: 404,
      };
    }

    // Default error
    return {
      message: (error as { message?: string }).message || "Database operation failed",
      code: "DATABASE_ERROR",
      statusCode: 500,
    };
  }

  /**
   * Create user-friendly error messages
   */
  static createUserFriendlyMessage(error: APIError): string {
    const friendlyMessages: Record<string, string> = {
      VALIDATION_ERROR: "Please check your input and try again.",
      AUTHENTICATION_ERROR: "Please log in to continue.",
      AUTHORIZATION_ERROR: "You don't have permission to perform this action.",
      NOT_FOUND: "The requested resource was not found.",
      CONFLICT: "This action conflicts with existing data.",
      RATE_LIMIT_EXCEEDED:
        "Too many requests. Please wait a moment and try again.",
      INTERNAL_SERVER_ERROR:
        "Something went wrong on our end. Please try again later.",
      DUPLICATE_RESOURCE: "This item already exists.",
      INVALID_REFERENCE: "Invalid reference to another resource.",
      MISSING_REQUIRED_FIELD: "Please fill in all required fields.",
      DATABASE_ERROR: "Database operation failed. Please try again.",
    };

    return friendlyMessages[error.code] || error.message;
  }
}

// Middleware for consistent error handling
export function createAPIMiddleware(endpoint: string) {
  return (
    handler: (request: NextRequest, context?: Record<string, unknown>) => Promise<NextResponse>,
  ) => {
    return APIErrorHandler.withErrorHandling(handler, endpoint);
  };
}
