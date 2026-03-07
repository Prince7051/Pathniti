/**
 * Example usage of SignupSessionManager
 * This file demonstrates how to use the session management service
 */

import { SignupSessionManager, signupSessionManager } from "./signup-session";
import { CollegeSignupFormData } from "../types/signup-session";

// Example 1: Using the singleton instance
export function saveUserFormData(formData: Partial<CollegeSignupFormData>) {
  // Save form data with current step
  signupSessionManager.saveFormData(formData, "college-selection");

  console.log("Form data saved to session");
}

export function retrieveUserFormData(): CollegeSignupFormData | null {
  // Check if session is valid before retrieving
  if (signupSessionManager.hasValidSession()) {
    return signupSessionManager.getFormData();
  }

  console.log("No valid session found");
  return null;
}

export function handleCollegeRegistrationFlow() {
  // Save current form data before redirecting to college registration
  const currentData = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1234567890",
  };

  signupSessionManager.saveFormData(currentData, "college-registration");

  // User gets redirected to college registration...
  // When they return, restore the data

  const restoredData = signupSessionManager.getFormData();
  if (restoredData) {
    console.log("Restored form data:", restoredData);

    // Update step to account creation
    signupSessionManager.setStep("account-creation");
  }
}

export function checkSessionStatus() {
  const timeRemaining = signupSessionManager.getTimeUntilExpiration();

  if (timeRemaining > 0) {
    console.log(`Session expires in ${timeRemaining} minutes`);

    // Extend session if needed
    if (timeRemaining < 5) {
      signupSessionManager.extendSession(30);
      console.log("Session extended by 30 minutes");
    }
  } else {
    console.log("No active session");
  }
}

export function cleanupOnCompletion() {
  // Clear session after successful account creation
  signupSessionManager.clearSession();
  console.log("Session cleared after successful signup");
}

// Example 2: Using custom configuration
export function createCustomSessionManager() {
  const customManager = new SignupSessionManager({
    storageKey: "my_custom_session",
    expirationMinutes: 60, // 1 hour expiration
  });

  return customManager;
}

// Example 3: Error handling
export function robustSessionHandling(
  formData: Partial<CollegeSignupFormData>,
) {
  try {
    // Always check if session is valid before operations
    if (!signupSessionManager.hasValidSession()) {
      console.log("Starting new session");
    }

    // Save data
    signupSessionManager.saveFormData(formData);

    // Verify data was saved
    const savedData = signupSessionManager.getFormData();
    if (!savedData) {
      throw new Error("Failed to save session data");
    }

    console.log("Session data saved successfully");
  } catch (error) {
    console.error("Session handling error:", error);

    // Fallback: clear potentially corrupted session
    signupSessionManager.clearSession();

    // Could implement alternative storage or user notification here
  }
}
