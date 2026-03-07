/**
 * Slug Generation Utilities for Dynamic College Profiles
 * Provides functions for generating, validating, and ensuring unique slugs
 */

import { createServiceClient } from "@/lib/supabase/service";
import type { CollegeSlugValidationResult } from "@/lib/types/college-profile";

export interface CollegeSlugService {
  generateSlug(collegeName: string): string;
  ensureUniqueSlug(slug: string, collegeId?: string): Promise<string>;
  validateSlug(slug: string): CollegeSlugValidationResult;
  sanitizeSlug(input: string): string;
}

export interface SlugGenerationOptions {
  maxLength?: number;
  allowNumbers?: boolean;
  separator?: string;
}

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(
  input: string,
  options: SlugGenerationOptions = {},
): string {
  const { maxLength = 50, allowNumbers = true, separator = "-" } = options;

  if (!input || typeof input !== "string") {
    return "college";
  }

  let slug = input
    .toLowerCase()
    .trim()
    // Remove special characters, keep only letters, numbers, and spaces
    .replace(/[^a-z0-9\s]/g, "");

  if (!allowNumbers) {
    slug = slug.replace(/[0-9]/g, "");
  }

  slug = slug
    // Replace multiple spaces with single space
    .replace(/\s+/g, " ")
    .trim()
    // Replace spaces with separator
    .replace(/\s/g, separator)
    // Remove multiple separators
    .replace(new RegExp(`${separator}+`, "g"), separator)
    // Remove leading/trailing separators
    .replace(new RegExp(`^${separator}+|${separator}+$`, "g"), "");

  // Ensure slug is not empty
  if (!slug) {
    slug = "college";
  }

  // Truncate if too long, ensuring we don't break words
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Find the last separator to avoid breaking words
    const lastSeparatorIndex = slug.lastIndexOf(separator);
    if (lastSeparatorIndex > 0) {
      slug = slug.substring(0, lastSeparatorIndex);
    }
    // Remove trailing separators
    slug = slug.replace(new RegExp(`${separator}+$`), "");
  }

  return slug;
}

/**
 * Validate if a slug meets the requirements
 */
export function validateSlug(slug: string): CollegeSlugValidationResult {
  if (!slug || typeof slug !== "string") {
    return {
      isValid: false,
      error: "Slug cannot be empty",
    };
  }

  const trimmedSlug = slug.trim();

  // Check length (minimum 3, maximum 100)
  if (trimmedSlug.length < 3) {
    return {
      isValid: false,
      error: "Slug must be at least 3 characters long",
    };
  }

  if (trimmedSlug.length > 100) {
    return {
      isValid: false,
      error: "Slug cannot exceed 100 characters",
    };
  }

  // Check that it doesn't start or end with hyphen
  if (trimmedSlug.startsWith("-") || trimmedSlug.endsWith("-")) {
    return {
      isValid: false,
      error: "Slug cannot start or end with a hyphen",
    };
  }

  // Check for consecutive hyphens
  if (trimmedSlug.includes("--")) {
    return {
      isValid: false,
      error: "Slug cannot contain consecutive hyphens",
    };
  }

  // Check format: only lowercase letters, numbers, and hyphens
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!slugRegex.test(trimmedSlug)) {
    return {
      isValid: false,
      error: "Slug can only contain lowercase letters, numbers, and hyphens",
    };
  }

  // Check for reserved words
  const reservedWords = [
    "admin",
    "api",
    "www",
    "mail",
    "ftp",
    "localhost",
    "dashboard",
    "profile",
    "settings",
    "login",
    "signup",
    "auth",
    "callback",
    "about",
    "contact",
    "privacy",
    "terms",
    "help",
    "support",
  ];

  if (reservedWords.includes(trimmedSlug)) {
    return {
      isValid: false,
      error: "Slug cannot use reserved words",
    };
  }

  return {
    isValid: true,
    sanitized: trimmedSlug,
  };
}

/**
 * Ensure slug is unique in the database
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  collegeId?: string,
): Promise<string> {
  const client = createServiceClient();

  // Validate base slug first
  const validation = validateSlug(baseSlug);
  if (!validation.isValid) {
    baseSlug = generateSlug(baseSlug);
  }

  let finalSlug = baseSlug;
  let counter = 0;

  while (true) {
    // Check if slug exists
    const { data, error } = await client
      .from("colleges")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle();

    if (error) {
      console.error("Error checking slug uniqueness:", error);
      throw new Error("Failed to validate slug uniqueness");
    }

    // If no existing record, or it's the same college being updated
    if (!data || (collegeId && (data as { id: string }).id === collegeId)) {
      break;
    }

    // Generate new slug with counter
    counter++;
    finalSlug = `${baseSlug}-${counter}`;
  }

  return finalSlug;
}

/**
 * Generate a unique slug for a college
 */
export async function generateUniqueCollegeSlug(
  collegeName: string,
  collegeId?: string,
): Promise<string> {
  const baseSlug = generateSlug(collegeName);
  return ensureUniqueSlug(baseSlug, collegeId);
}

/**
 * Sanitize slug input from user
 */
export function sanitizeSlug(input: string): string {
  if (!input || typeof input !== "string") {
    return "college";
  }

  // Create a basic valid slug
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "") // Keep spaces, underscores, and hyphens
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .substring(0, 100);

  // Ensure minimum length
  if (!slug || slug.length < 3) {
    return "college";
  }

  return slug;
}

/**
 * Legacy function name for backward compatibility
 */
export function sanitizeSlugInput(input: string): string {
  return sanitizeSlug(input);
}

/**
 * Check if a slug is available
 */
export async function isSlugAvailable(
  slug: string,
  collegeId?: string,
): Promise<boolean> {
  const validation = validateSlug(slug);
  if (!validation.isValid) {
    return false;
  }

  const client = createServiceClient();

  const { data, error } = await client
    .from("colleges")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Error checking slug availability:", error);
    return false;
  }

  // Available if no record exists, or it's the same college
  return !data || (collegeId ? (data as { id: string }).id === collegeId : false);
}

/**
 * Get slug suggestions based on college name
 */
export async function getSlugSuggestions(
  collegeName: string,
  count: number = 5,
): Promise<string[]> {
  const baseSlug = generateSlug(collegeName);
  const suggestions: string[] = [];

  // Add base slug if available
  if (await isSlugAvailable(baseSlug)) {
    suggestions.push(baseSlug);
  }

  // Generate variations
  const variations = [
    `${baseSlug}-college`,
    `${baseSlug}-university`,
    `${baseSlug}-institute`,
    `${baseSlug}-academy`,
    `${baseSlug}-school`,
  ];

  for (const variation of variations) {
    if (suggestions.length >= count) break;

    if (await isSlugAvailable(variation)) {
      suggestions.push(variation);
    }
  }

  // Add numbered variations if needed
  let counter = 1;
  while (suggestions.length < count && counter <= 10) {
    const numberedSlug = `${baseSlug}-${counter}`;
    if (await isSlugAvailable(numberedSlug)) {
      suggestions.push(numberedSlug);
    }
    counter++;
  }

  return suggestions.slice(0, count);
}

/**
 * College slug service implementation
 */
export const collegeSlugService: CollegeSlugService = {
  generateSlug,
  ensureUniqueSlug,
  validateSlug,
  sanitizeSlug,
};
