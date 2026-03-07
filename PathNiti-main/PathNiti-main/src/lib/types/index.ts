/**
 * Type definitions index file
 * Re-exports all type definitions for easy importing
 */

// College profile types
export type {
  LocationData,
  AdmissionCriteria,
  ScholarshipInfo,
  EntranceTestInfo,
  FeeStructure,
  Course,
  Notice,
  Event,
  CollegeType,
  CollegeProfileData,
  CollegeProfileCreateData,
  CollegeProfileUpdateData,
  CollegeSlugValidationResult,
} from "./college-profile";

// Signup session types
export type {
  CollegeSignupFormData,
  SignupSession,
  SessionStorageOptions,
  SignupStep,
} from "./signup-session";

// Re-export existing types from the main types file
export * from "../types";
