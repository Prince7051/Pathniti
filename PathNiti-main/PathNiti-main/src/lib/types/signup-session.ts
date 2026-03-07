/**
 * TypeScript interfaces for signup session data structures
 */

export interface CollegeSignupFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;

  // College Association
  collegeId: string;
  collegeName?: string; // For newly registered colleges

  // Role Information
  contactPerson: string;
  designation: string;

  // Flow Management
  isNewCollege?: boolean;
  registrationSource?: "existing" | "new";
}

export interface SignupSession {
  formData: CollegeSignupFormData;
  timestamp: number;
  step: "college-selection" | "college-registration" | "account-creation";
  expiresAt: number;
}

export interface SessionStorageOptions {
  expirationMinutes?: number;
  storageKey?: string;
}

export type SignupStep =
  | "college-selection"
  | "college-registration"
  | "account-creation";
