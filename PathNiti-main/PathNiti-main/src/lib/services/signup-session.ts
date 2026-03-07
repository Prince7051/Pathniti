/**
 * SignupSessionManager - Manages form data persistence during college signup flow
 * Provides secure session storage with expiration handling
 */

import {
  CollegeSignupFormData,
  SignupSession,
  SessionStorageOptions,
  SignupStep,
} from "../types/signup-session";

export class SignupSessionManager {
  private readonly storageKey: string;
  private readonly expirationMinutes: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: SessionStorageOptions = {}) {
    this.storageKey = options.storageKey || "college_signup_session";
    this.expirationMinutes = options.expirationMinutes || 30; // 30 minutes default

    // Start cleanup interval for browser environment
    if (typeof window !== "undefined") {
      this.startCleanupInterval();
    }
  }

  /**
   * Save form data to session storage with expiration
   */
  saveFormData(data: Partial<CollegeSignupFormData>, step?: SignupStep): void {
    try {
      const now = Date.now();
      const expiresAt = now + this.expirationMinutes * 60 * 1000;

      const existingSession = this.getSession();
      const mergedData = existingSession
        ? { ...existingSession.formData, ...data }
        : (data as CollegeSignupFormData);

      const session: SignupSession = {
        formData: mergedData,
        timestamp: now,
        step: step || existingSession?.step || "college-selection",
        expiresAt,
      };

      // Sanitize sensitive data before storing
      const sanitizedSession = this.sanitizeSessionData(session);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          this.storageKey,
          JSON.stringify(sanitizedSession),
        );
      }
    } catch (error) {
      console.error("Failed to save form data to session:", error);
    }
  }

  /**
   * Retrieve form data from session storage
   */
  getFormData(): CollegeSignupFormData | null {
    const session = this.getSession();
    return session?.formData || null;
  }

  /**
   * Get complete session data
   */
  getSession(): SignupSession | null {
    try {
      if (typeof window === "undefined") {
        return null;
      }

      const sessionData = sessionStorage.getItem(this.storageKey);
      if (!sessionData) {
        return null;
      }

      const session: SignupSession = JSON.parse(sessionData);

      // Check if session has expired
      if (this.isSessionExpired(session)) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error("Failed to retrieve session data:", error);
      this.clearSession(); // Clear corrupted data
      return null;
    }
  }

  /**
   * Clear session data from storage
   */
  clearSession(): void {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(this.storageKey);
      }
    } catch (error) {
      console.error("Failed to clear session data:", error);
    }
  }

  /**
   * Set current step in the signup flow
   */
  setStep(step: SignupStep): void {
    const session = this.getSession();
    if (session) {
      session.step = step;
      session.timestamp = Date.now();

      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(this.storageKey, JSON.stringify(session));
        }
      } catch (error) {
        console.error("Failed to update session step:", error);
      }
    }
  }

  /**
   * Get current step in the signup flow
   */
  getStep(): SignupStep | null {
    const session = this.getSession();
    return session?.step || null;
  }

  /**
   * Check if session exists and is valid
   */
  hasValidSession(): boolean {
    const session = this.getSession();
    return session !== null && !this.isSessionExpired(session);
  }

  /**
   * Get time remaining until session expires (in minutes)
   */
  getTimeUntilExpiration(): number {
    const session = this.getSession();
    if (!session) return 0;

    const now = Date.now();
    const timeRemaining = Math.max(0, session.expiresAt - now);
    return Math.floor(timeRemaining / (60 * 1000)); // Convert to minutes
  }

  /**
   * Extend session expiration time
   */
  extendSession(additionalMinutes: number = 30): void {
    const session = this.getSession();
    if (session) {
      session.expiresAt = Date.now() + additionalMinutes * 60 * 1000;
      session.timestamp = Date.now();

      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(this.storageKey, JSON.stringify(session));
        }
      } catch (error) {
        console.error("Failed to extend session:", error);
      }
    }
  }

  /**
   * Check if session is about to expire (within specified minutes)
   */
  isSessionExpiringSoon(withinMinutes: number = 5): boolean {
    const timeRemaining = this.getTimeUntilExpiration();
    return timeRemaining > 0 && timeRemaining <= withinMinutes;
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    // Clean up expired sessions every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.performCleanup();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Perform cleanup of expired sessions
   */
  private performCleanup(): void {
    try {
      if (typeof window === "undefined") return;

      // Check if current session is expired
      const session = this.getSession();
      if (!session) {
        // Session was already cleaned up by getSession()
        return;
      }

      // Clean up other expired sessions with different keys
      const keysToCheck = [
        "college_signup_session",
        "student_signup_session",
        "admin_signup_session",
      ];

      for (const key of keysToCheck) {
        try {
          const sessionData = sessionStorage.getItem(key);
          if (sessionData) {
            const session = JSON.parse(sessionData);
            if (session.expiresAt && Date.now() > session.expiresAt) {
              sessionStorage.removeItem(key);
            }
          }
        } catch {
          // Remove corrupted session data
          sessionStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error("Error during session cleanup:", error);
    }
  }

  /**
   * Secure session data validation
   */
  private validateSessionData(session: SignupSession): boolean {
    try {
      // Check required fields
      if (!session.formData || !session.timestamp || !session.expiresAt) {
        return false;
      }

      // Check timestamp validity
      if (typeof session.timestamp !== "number" || session.timestamp <= 0) {
        return false;
      }

      // Check expiration validity
      if (typeof session.expiresAt !== "number" || session.expiresAt <= 0) {
        return false;
      }

      // Check if session is from the future (clock skew protection)
      if (session.timestamp > Date.now() + 60000) {
        // Allow 1 minute skew
        return false;
      }

      // Validate form data structure
      if (typeof session.formData !== "object") {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }


  /**
   * Get session recovery information
   */
  getRecoveryInfo(): {
    hasRecoverableData: boolean;
    sessionAge: number;
    timeUntilExpiration: number;
    isExpiringSoon: boolean;
    dataFields: string[];
  } {
    const session = this.getSession();

    if (!session) {
      return {
        hasRecoverableData: false,
        sessionAge: 0,
        timeUntilExpiration: 0,
        isExpiringSoon: false,
        dataFields: [],
      };
    }

    const sessionAge = Math.floor(
      (Date.now() - session.timestamp) / (60 * 1000),
    );
    const timeUntilExpiration = this.getTimeUntilExpiration();
    const isExpiringSoon = this.isSessionExpiringSoon();

    // Check which fields have data
    const dataFields = Object.entries(session.formData)
      .filter(([, value]) => value && value.toString().trim() !== "")
      .map(([key]) => key);

    return {
      hasRecoverableData: dataFields.length > 0,
      sessionAge,
      timeUntilExpiration,
      isExpiringSoon,
      dataFields,
    };
  }

  /**
   * Create a backup of current session data
   */
  createBackup(): string | null {
    const session = this.getSession();
    if (!session) return null;

    try {
      const backup = {
        ...session,
        backupTimestamp: Date.now(),
      };
      return JSON.stringify(backup);
    } catch (error) {
      console.error("Failed to create session backup:", error);
      return null;
    }
  }

  /**
   * Restore session from backup
   */
  restoreFromBackup(backupData: string): boolean {
    try {
      const backup = JSON.parse(backupData);

      // Validate backup structure
      if (!backup.formData || !backup.timestamp) {
        throw new Error("Invalid backup format");
      }

      // Create new session from backup
      const session: SignupSession = {
        formData: backup.formData,
        timestamp: Date.now(),
        step: backup.step || "college-selection",
        expiresAt: Date.now() + this.expirationMinutes * 60 * 1000,
      };

      const sanitizedSession = this.sanitizeSessionData(session);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          this.storageKey,
          JSON.stringify(sanitizedSession),
        );
      }

      return true;
    } catch (error) {
      console.error("Failed to restore from backup:", error);
      return false;
    }
  }

  /**
   * Check if session has expired
   */
  private isSessionExpired(session: SignupSession): boolean {
    return Date.now() > session.expiresAt;
  }

  /**
   * Sanitize session data by removing sensitive information
   */
  private sanitizeSessionData(session: SignupSession): SignupSession {
    const sanitized = { ...session };

    // Never store passwords in session storage
    if (sanitized.formData.password) {
      sanitized.formData = { ...sanitized.formData };
      delete (sanitized.formData as { password?: string }).password;
    }

    if (sanitized.formData.confirmPassword) {
      sanitized.formData = { ...sanitized.formData };
      delete (sanitized.formData as { confirmPassword?: string }).confirmPassword;
    }

    return sanitized;
  }
}

// Export singleton instance for convenience
export const signupSessionManager = new SignupSessionManager();
