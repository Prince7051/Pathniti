/**
 * Form validation utilities for college signup flow
 * Provides real-time validation and comprehensive error handling
 */

import { InputSanitizer } from "./input-sanitization";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  sanitized?: string;
}

export interface FormValidationState {
  firstName: ValidationResult;
  lastName: ValidationResult;
  email: ValidationResult;
  password: ValidationResult;
  confirmPassword: ValidationResult;
  phone: ValidationResult;
  collegeId: ValidationResult;
  contactPerson: ValidationResult;
  designation: ValidationResult;
  overall: ValidationResult;
}

export class FormValidator {
  /**
   * Validate first name field
   */
  static validateFirstName(value: string): ValidationResult {
    const sanitized = InputSanitizer.sanitizeName(value);

    if (!sanitized.trim()) {
      return { isValid: false, error: "First name is required" };
    }

    if (sanitized.trim().length < 2) {
      return {
        isValid: false,
        error: "First name must be at least 2 characters",
      };
    }

    if (!/^[a-zA-Z\s'-]+$/.test(sanitized.trim())) {
      return {
        isValid: false,
        error:
          "First name can only contain letters, spaces, hyphens, and apostrophes",
      };
    }

    return { isValid: true, sanitized };
  }

  /**
   * Validate last name field
   */
  static validateLastName(value: string): ValidationResult {
    const sanitized = InputSanitizer.sanitizeName(value);

    if (!sanitized.trim()) {
      return { isValid: false, error: "Last name is required" };
    }

    if (sanitized.trim().length < 2) {
      return {
        isValid: false,
        error: "Last name must be at least 2 characters",
      };
    }

    if (!/^[a-zA-Z\s'-]+$/.test(sanitized.trim())) {
      return {
        isValid: false,
        error:
          "Last name can only contain letters, spaces, hyphens, and apostrophes",
      };
    }

    return { isValid: true, sanitized };
  }

  /**
   * Validate email field
   */
  static validateEmail(value: string): ValidationResult {
    const sanitized = InputSanitizer.sanitizeEmail(value);

    if (!sanitized.trim()) {
      return { isValid: false, error: "Email is required" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized.trim())) {
      return { isValid: false, error: "Please enter a valid email address" };
    }

    // Check for common typos
    const warnings: string[] = [];
    const commonDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
    ];
    const domain = sanitized.split("@")[1]?.toLowerCase();

    if (domain && !commonDomains.includes(domain)) {
      // Check for potential typos in common domains
      const typoChecks = [
        { correct: "gmail.com", typos: ["gmai.com", "gmial.com", "gmail.co"] },
        { correct: "yahoo.com", typos: ["yaho.com", "yahoo.co"] },
        { correct: "hotmail.com", typos: ["hotmai.com", "hotmail.co"] },
        { correct: "outlook.com", typos: ["outlok.com", "outlook.co"] },
      ];

      for (const check of typoChecks) {
        if (check.typos.includes(domain)) {
          warnings.push(`Did you mean ${check.correct}?`);
          break;
        }
      }
    }

    return { isValid: true, warnings, sanitized };
  }

  /**
   * Validate password field
   */
  static validatePassword(value: string): ValidationResult {
    const validation = InputSanitizer.validatePassword(value);

    if (!validation.isValid) {
      return {
        isValid: false,
        error: validation.errors.join(", "),
      };
    }

    return {
      isValid: true,
      sanitized: validation.sanitized,
    };
  }

  /**
   * Validate confirm password field
   */
  static validateConfirmPassword(
    password: string,
    confirmPassword: string,
  ): ValidationResult {
    if (!confirmPassword) {
      return { isValid: false, error: "Please confirm your password" };
    }

    if (password !== confirmPassword) {
      return { isValid: false, error: "Passwords do not match" };
    }

    return { isValid: true };
  }

  /**
   * Validate phone field
   */
  static validatePhone(value: string): ValidationResult {
    const sanitized = InputSanitizer.sanitizePhone(value);

    if (!sanitized.trim()) {
      return { isValid: false, error: "Phone number is required" };
    }

    // Remove all non-digit characters for validation
    const digitsOnly = sanitized.replace(/\D/g, "");

    if (digitsOnly.length < 10) {
      return {
        isValid: false,
        error: "Phone number must be at least 10 digits",
      };
    }

    if (digitsOnly.length > 15) {
      return { isValid: false, error: "Phone number cannot exceed 15 digits" };
    }

    // Basic format validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(digitsOnly)) {
      return { isValid: false, error: "Please enter a valid phone number" };
    }

    return { isValid: true, sanitized };
  }

  /**
   * Validate college selection
   */
  static validateCollegeId(value: string): ValidationResult {
    if (!value.trim()) {
      return {
        isValid: false,
        error: "Please select a college or register a new one",
      };
    }

    return { isValid: true };
  }

  /**
   * Validate contact person field
   */
  static validateContactPerson(value: string): ValidationResult {
    const sanitized = InputSanitizer.sanitizeName(value);

    if (!sanitized.trim()) {
      return { isValid: false, error: "Contact person name is required" };
    }

    if (sanitized.trim().length < 2) {
      return {
        isValid: false,
        error: "Contact person name must be at least 2 characters",
      };
    }

    if (!/^[a-zA-Z\s'-]+$/.test(sanitized.trim())) {
      return {
        isValid: false,
        error:
          "Contact person name can only contain letters, spaces, hyphens, and apostrophes",
      };
    }

    return { isValid: true, sanitized };
  }

  /**
   * Validate designation field (optional but recommended)
   */
  static validateDesignation(value: string): ValidationResult {
    const sanitized = InputSanitizer.sanitizeDesignation(value);

    if (!sanitized.trim()) {
      return {
        isValid: true,
        warnings: ["Adding your designation helps students identify your role"],
        sanitized,
      };
    }

    if (sanitized.trim().length < 2) {
      return {
        isValid: false,
        error: "Designation must be at least 2 characters",
      };
    }

    return { isValid: true, sanitized };
  }

  /**
   * Validate entire form
   */
  static validateForm(formData: Record<string, unknown>): FormValidationState {
    const validation: FormValidationState = {
      firstName: this.validateFirstName((formData.firstName as string) || ""),
      lastName: this.validateLastName((formData.lastName as string) || ""),
      email: this.validateEmail((formData.email as string) || ""),
      password: this.validatePassword((formData.password as string) || ""),
      confirmPassword: this.validateConfirmPassword(
        (formData.password as string) || "",
        (formData.confirmPassword as string) || "",
      ),
      phone: this.validatePhone((formData.phone as string) || ""),
      collegeId: this.validateCollegeId((formData.collegeId as string) || ""),
      contactPerson: this.validateContactPerson((formData.contactPerson as string) || ""),
      designation: this.validateDesignation((formData.designation as string) || ""),
      overall: { isValid: true },
    };

    // Check overall form validity
    const hasErrors = Object.values(validation).some(
      (field) => field !== validation.overall && !field.isValid,
    );

    validation.overall = {
      isValid: !hasErrors,
      error: hasErrors
        ? "Please fix the errors above before submitting"
        : undefined,
    };

    return validation;
  }

  /**
   * Get field-specific error message
   */
  static getFieldError(
    validation: FormValidationState,
    fieldName: keyof FormValidationState,
  ): string | undefined {
    return validation[fieldName]?.error;
  }

  /**
   * Get field-specific warnings
   */
  static getFieldWarnings(
    validation: FormValidationState,
    fieldName: keyof FormValidationState,
  ): string[] {
    return validation[fieldName]?.warnings || [];
  }

  /**
   * Check if field is valid
   */
  static isFieldValid(
    validation: FormValidationState,
    fieldName: keyof FormValidationState,
  ): boolean {
    return validation[fieldName]?.isValid || false;
  }

  /**
   * Sanitize entire form data object
   */
  static sanitizeFormData(formData: Record<string, unknown>): Record<string, unknown> {
    return InputSanitizer.sanitizeFormData(formData);
  }

  /**
   * Get sanitized value from validation result
   */
  static getSanitizedValue(
    validation: ValidationResult,
    originalValue: string,
  ): string {
    return validation.sanitized || originalValue;
  }
}

// Additional validation functions for comprehensive testing
export interface CollegeRegistrationData {
  name: string;
  type: "private" | "government" | "aided";
  location: {
    state: string;
    city: string;
    pincode?: string;
  };
  address: string;
  website?: string;
  phone?: string;
  email?: string;
  established_year?: number;
  about?: string;
}

export interface StudentApplicationData {
  full_name: string;
  email: string;
  phone: string;
  class_stream: string;
  documents: {
    marksheet_10th: string;
    marksheet_12th: string;
    other_documents?: string[];
  };
}

export interface CourseData {
  name: string;
  description?: string;
  duration: string;
  eligibility?: string;
  fees?: {
    tuition?: number;
    hostel?: number;
    other?: number;
  };
  seats: number;
}

export interface NoticeData {
  title: string;
  content: string;
  type: "general" | "admission" | "event" | "urgent";
  expires_at?: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface ComprehensiveValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

export function validateCollegeRegistration(
  data: CollegeRegistrationData,
): ComprehensiveValidationResult {
  const errors: ValidationErrors = {};

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.name = "College name is required";
  } else if (data.name.trim().length < 3) {
    errors.name = "College name must be at least 3 characters long";
  }

  // Validate type
  if (!data.type) {
    errors.type = "College type is required";
  } else if (!["private", "government", "aided"].includes(data.type)) {
    errors.type = "Invalid college type";
  }

  // Validate location
  if (
    !data.location ||
    !data.location.state ||
    data.location.state.trim().length === 0
  ) {
    errors["location.state"] = "State is required";
  }
  if (
    !data.location ||
    !data.location.city ||
    data.location.city.trim().length === 0
  ) {
    errors["location.city"] = "City is required";
  }

  // Validate address
  if (!data.address || data.address.trim().length === 0) {
    errors.address = "Address is required";
  }

  // Validate email if provided
  if (data.email && !isValidEmail(data.email)) {
    errors.email = "Invalid email format";
  }

  // Validate website if provided
  if (data.website && !isValidUrl(data.website)) {
    errors.website = "Invalid website URL";
  }

  // Validate phone if provided
  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = "Invalid phone number format";
  }

  // Validate established year if provided
  if (data.established_year) {
    const currentYear = new Date().getFullYear();
    if (data.established_year < 1850 || data.established_year > currentYear) {
      errors.established_year =
        "Established year must be between 1850 and current year";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateStudentApplication(
  data: StudentApplicationData,
): ComprehensiveValidationResult {
  const errors: ValidationErrors = {};

  // Validate full name
  if (!data.full_name || data.full_name.trim().length === 0) {
    errors.full_name = "Full name is required";
  } else if (data.full_name.trim().length < 2) {
    errors.full_name = "Full name must be at least 2 characters long";
  }

  // Validate email
  if (!data.email || data.email.trim().length === 0) {
    errors.email = "Email is required";
  } else if (!isValidEmail(data.email)) {
    errors.email = "Invalid email format";
  }

  // Validate phone
  if (!data.phone || data.phone.trim().length === 0) {
    errors.phone = "Phone number is required";
  } else if (!isValidIndianPhone(data.phone)) {
    errors.phone = "Phone number must be 10 digits";
  }

  // Validate class stream
  if (!data.class_stream || data.class_stream.trim().length === 0) {
    errors.class_stream = "Class stream is required";
  } else if (!["Science", "Commerce", "Arts"].includes(data.class_stream)) {
    errors.class_stream = "Invalid class stream";
  }

  // Validate documents
  if (!data.documents.marksheet_10th) {
    errors["documents.marksheet_10th"] = "10th marksheet is required";
  }
  if (!data.documents.marksheet_12th) {
    errors["documents.marksheet_12th"] = "12th marksheet is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateCourseData(
  data: CourseData,
): ComprehensiveValidationResult {
  const errors: ValidationErrors = {};

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.name = "Course name is required";
  }

  // Validate duration
  if (!data.duration || data.duration.trim().length === 0) {
    errors.duration = "Course duration is required";
  }

  // Validate seats
  if (!data.seats || data.seats < 1) {
    errors.seats = "Number of seats must be at least 1";
  }

  // Validate fees if provided
  if (data.fees) {
    if (data.fees.tuition !== undefined) {
      if (typeof data.fees.tuition !== "number" || data.fees.tuition < 0) {
        errors["fees.tuition"] = "Tuition fee must be a positive number";
      }
    }
    if (data.fees.hostel !== undefined) {
      if (typeof data.fees.hostel !== "number") {
        errors["fees.hostel"] = "Hostel fee must be a number";
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateNoticeData(
  data: NoticeData,
): ComprehensiveValidationResult {
  const errors: ValidationErrors = {};

  // Validate title
  if (!data.title || data.title.trim().length === 0) {
    errors.title = "Title is required";
  }

  // Validate content
  if (!data.content || data.content.trim().length === 0) {
    errors.content = "Content is required";
  }

  // Validate type
  if (!["general", "admission", "event", "urgent"].includes(data.type)) {
    errors.type = "Invalid notice type";
  }

  // Validate expires_at if provided
  if (data.expires_at && !isValidDate(data.expires_at)) {
    errors.expires_at = "Invalid expiry date format";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidPhone(phone: string): boolean {
  // Allow various phone formats including Indian landlines starting with 0
  const phoneRegex = /^[\+]?[0-9][\d\s\-\(\)]{7,15}$/;
  return phoneRegex.test(phone);
}

function isValidIndianPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly);
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
