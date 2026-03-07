/**
 * Comprehensive API validation utilities
 * Provides server-side validation for all API endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { InputSanitizer } from "./input-sanitization";

export interface ValidationRule {
  required?: boolean;
  type?: "string" | "number" | "email" | "phone" | "url" | "array" | "object";
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
  custom?: (value: unknown) => string | null;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData: Record<string, unknown>;
}

export class APIValidator {
  /**
   * Validate request body against schema
   */
  static async validateRequestBody(
    request: NextRequest,
    schema: ValidationSchema,
  ): Promise<ValidationResult> {
    try {
      const body = await request.json();
      return this.validateData(body, schema);
    } catch {
      return {
        isValid: false,
        errors: { _body: "Invalid JSON in request body" },
        sanitizedData: {},
      };
    }
  }

  /**
   * Validate data against schema
   */
  static validateData(data: unknown, schema: ValidationSchema): ValidationResult {
    const errors: Record<string, string> = {};
    const sanitizedData: Record<string, unknown> = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = (data as { [key: string]: unknown })[field];
      const validationResult = this.validateField(field, value, rules);

      if (validationResult.error) {
        errors[field] = validationResult.error;
      } else {
        sanitizedData[field] = validationResult.sanitizedValue;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData,
    };
  }

  /**
   * Validate individual field
   */
  private static validateField(
    fieldName: string,
    value: unknown,
    rules: ValidationRule,
  ): { error?: string; sanitizedValue: unknown } {
    // Check required
    if (
      rules.required &&
      (value === undefined || value === null || value === "")
    ) {
      return { error: `${fieldName} is required`, sanitizedValue: value };
    }

    // Skip validation if field is not required and empty
    if (
      !rules.required &&
      (value === undefined || value === null || value === "")
    ) {
      return { sanitizedValue: value };
    }

    // Type validation and sanitization
    let sanitizedValue = value;

    switch (rules.type) {
      case "string":
        if (typeof value !== "string") {
          return {
            error: `${fieldName} must be a string`,
            sanitizedValue: value,
          };
        }
        sanitizedValue = InputSanitizer.sanitizeText(value, {
          maxLength: rules.maxLength,
        });
        break;

      case "number":
        const numValue = typeof value === "string" ? parseFloat(value) : (value as number);
        if (isNaN(numValue)) {
          return {
            error: `${fieldName} must be a valid number`,
            sanitizedValue: value,
          };
        }
        sanitizedValue = numValue;
        break;

      case "email":
        if (typeof value !== "string") {
          return {
            error: `${fieldName} must be a string`,
            sanitizedValue: value,
          };
        }
        sanitizedValue = InputSanitizer.sanitizeEmail(value as string);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedValue as string)) {
          return {
            error: `${fieldName} must be a valid email address`,
            sanitizedValue: value,
          };
        }
        break;

      case "phone":
        if (typeof value !== "string") {
          return {
            error: `${fieldName} must be a string`,
            sanitizedValue: value,
          };
        }
        sanitizedValue = InputSanitizer.sanitizePhone(value as string);
        // Basic phone validation (10-15 digits)
        const digitsOnly = (sanitizedValue as string).replace(/\D/g, "");
        if (digitsOnly.length < 10 || digitsOnly.length > 15) {
          return {
            error: `${fieldName} must be a valid phone number`,
            sanitizedValue: value,
          };
        }
        break;

      case "url":
        if (typeof value !== "string") {
          return {
            error: `${fieldName} must be a string`,
            sanitizedValue: value,
          };
        }
        sanitizedValue = InputSanitizer.sanitizeUrl(value as string);
        if (!/^https?:\/\/.+/.test(sanitizedValue as string)) {
          return {
            error: `${fieldName} must be a valid URL starting with http:// or https://`,
            sanitizedValue: value,
          };
        }
        break;

      case "array":
        if (!Array.isArray(value)) {
          return {
            error: `${fieldName} must be an array`,
            sanitizedValue: value,
          };
        }
        sanitizedValue = value;
        break;

      case "object":
        if (
          typeof value !== "object" ||
          Array.isArray(value) ||
          value === null
        ) {
          return {
            error: `${fieldName} must be an object`,
            sanitizedValue: value,
          };
        }
        sanitizedValue = value;
        break;
    }

    // Length validation for strings
    if (rules.type === "string" && typeof sanitizedValue === "string") {
      if (rules.minLength && sanitizedValue.length < rules.minLength) {
        return {
          error: `${fieldName} must be at least ${rules.minLength} characters long`,
          sanitizedValue: value,
        };
      }
      if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
        return {
          error: `${fieldName} must be no more than ${rules.maxLength} characters long`,
          sanitizedValue: value,
        };
      }
    }

    // Numeric range validation
    if (rules.type === "number" && typeof sanitizedValue === "number") {
      if (rules.min !== undefined && sanitizedValue < rules.min) {
        return {
          error: `${fieldName} must be at least ${rules.min}`,
          sanitizedValue: value,
        };
      }
      if (rules.max !== undefined && sanitizedValue > rules.max) {
        return {
          error: `${fieldName} must be no more than ${rules.max}`,
          sanitizedValue: value,
        };
      }
    }

    // Pattern validation
    if (rules.pattern && typeof sanitizedValue === "string") {
      if (!rules.pattern.test(sanitizedValue)) {
        return {
          error: `${fieldName} format is invalid`,
          sanitizedValue: value,
        };
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(sanitizedValue as string)) {
      return {
        error: `${fieldName} must be one of: ${rules.enum.join(", ")}`,
        sanitizedValue: value,
      };
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(sanitizedValue);
      if (customError) {
        return { error: customError, sanitizedValue: value };
      }
    }

    return { sanitizedValue };
  }

  /**
   * Create validation error response
   */
  static createValidationErrorResponse(
    errors: Record<string, string>,
  ): NextResponse {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: errors,
        code: "VALIDATION_ERROR",
      },
      { status: 400 },
    );
  }

  /**
   * Validate query parameters
   */
  static validateQueryParams(
    request: NextRequest,
    schema: ValidationSchema,
  ): ValidationResult {
    const { searchParams } = new URL(request.url);
    const data: Record<string, unknown> = {};

    // Convert URLSearchParams to object
    for (const [key, value] of searchParams.entries()) {
      data[key] = value;
    }

    return this.validateData(data, schema);
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(
    file: File,
    options: {
      maxSize?: number; // in bytes
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {},
  ): { isValid: boolean; error?: string } {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ["application/pdf", "image/jpeg", "image/png"],
      allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"],
    } = options;

    // Check file size
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`,
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
      };
    }

    // Check file extension
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `File extension not allowed. Allowed extensions: ${allowedExtensions.join(", ")}`,
      };
    }

    return { isValid: true };
  }
}

// Common validation schemas
export const ValidationSchemas = {
  collegeRegistration: {
    name: {
      required: true,
      type: "string" as const,
      minLength: 2,
      maxLength: 200,
    },
    type: {
      required: true,
      type: "string" as const,
      enum: ["government", "government_aided", "private", "deemed"],
    },
    location: {
      required: true,
      type: "object" as const,
      custom: (value: unknown) => {
        const location = value as { city?: unknown; state?: unknown; country?: unknown };
        if (!location.city || !location.state || !location.country) {
          return "Location must include city, state, and country";
        }
        return null;
      },
    },
    address: {
      required: true,
      type: "string" as const,
      minLength: 10,
      maxLength: 500,
    },
    email: {
      required: false,
      type: "email" as const,
    },
    website: {
      required: false,
      type: "url" as const,
    },
    phone: {
      required: false,
      type: "phone" as const,
    },
    established_year: {
      required: false,
      type: "number" as const,
      min: 1800,
      max: new Date().getFullYear(),
    },
  },

  studentApplication: {
    full_name: {
      required: true,
      type: "string" as const,
      minLength: 2,
      maxLength: 100,
    },
    email: {
      required: true,
      type: "email" as const,
    },
    phone: {
      required: true,
      type: "phone" as const,
    },
    class_stream: {
      required: true,
      type: "string" as const,
      minLength: 2,
      maxLength: 50,
    },
    documents: {
      required: true,
      type: "object" as const,
      custom: (value: unknown) => {
        const documents = value as { marksheet_10th?: unknown; marksheet_12th?: unknown };
        if (!documents.marksheet_10th || !documents.marksheet_12th) {
          return "Both 10th and 12th marksheets are required";
        }
        return null;
      },
    },
  },

  courseManagement: {
    name: {
      required: true,
      type: "string" as const,
      minLength: 2,
      maxLength: 200,
    },
    description: {
      required: false,
      type: "string" as const,
      maxLength: 1000,
    },
    duration: {
      required: false,
      type: "string" as const,
      maxLength: 50,
    },
    eligibility: {
      required: false,
      type: "string" as const,
      maxLength: 500,
    },
    seats: {
      required: false,
      type: "number" as const,
      min: 1,
      max: 10000,
    },
  },

  noticeManagement: {
    title: {
      required: true,
      type: "string" as const,
      minLength: 5,
      maxLength: 200,
    },
    content: {
      required: true,
      type: "string" as const,
      minLength: 10,
      maxLength: 5000,
    },
    type: {
      required: false,
      type: "string" as const,
      enum: ["general", "admission", "event", "urgent"],
    },
  },
};
