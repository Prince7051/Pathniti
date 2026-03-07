"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import type {
  User,
  Session,
  AuthError,
  AuthChangeEvent,
} from "@supabase/supabase-js";
import { supabase, safeGetUser } from "@/lib/supabase";
import { offlineAuthManager } from "@/lib/offline-auth-manager";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";
import { AuthErrorProvider } from "@/contexts/AuthErrorContext";
import { parseAuthError, logAuthError } from "@/lib/auth-errors";
import {
  authPerformanceMonitor,
  logAuthPerformanceSummary,
} from "@/lib/auth-performance";
import "@/lib/i18n"; // Initialize i18n

// Validate that supabase client is properly imported
if (!supabase) {
  console.error("Supabase client is undefined! Check import paths.");
}

// Global error suppression for React DevTools is now handled in layout.tsx

// Use the centralized performance monitoring system with error handling
const performanceMonitor = authPerformanceMonitor || {
  startTimer: (operation: string) => ({
    end: (success: boolean = true) => {
      console.log(`[Fallback] ${operation}: ${success ? "success" : "error"}`);
      return 0;
    },
  }),
};

// Cache utilities for authentication state
const authCache = {
  set: (key: string, value: unknown, ttl: number = 5 * 60 * 1000) => {
    // 5 minutes default TTL
    if (typeof window !== "undefined") {
      const item = {
        value,
        expiry: Date.now() + ttl,
      };
      try {
        localStorage.setItem(`auth_cache_${key}`, JSON.stringify(item));
      } catch (error) {
        console.warn("Failed to cache auth data:", error);
      }
    }
  },

  get: (key: string) => {
    if (typeof window !== "undefined") {
      try {
        const item = localStorage.getItem(`auth_cache_${key}`);
        if (!item) return null;

        const parsed = JSON.parse(item);
        if (Date.now() > parsed.expiry) {
          localStorage.removeItem(`auth_cache_${key}`);
          return null;
        }

        return parsed.value;
      } catch (error) {
        console.warn("Failed to retrieve cached auth data:", error);
        return null;
      }
    }
    return null;
  },

  clear: (key?: string) => {
    if (typeof window !== "undefined") {
      if (key) {
        localStorage.removeItem(`auth_cache_${key}`);
      } else {
        // Clear all auth cache
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith("auth_cache_")) {
            localStorage.removeItem(k);
          }
        });
      }
    }
  },
};

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "student" | "admin" | "college";
  is_verified: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isOnline: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    data: { user: User | null; session: Session | null } | null;
    error: AuthError | null;
  }>;
  signUpStudent: (
    email: string,
    password: string,
    userData: {
      first_name: string;
      last_name: string;
      phone?: string;
    },
  ) => Promise<{
    data: { user: User | null; session: Session | null } | null;
    error: AuthError | null;
  }>;
  signUpCollege: (
    email: string,
    password: string,
    userData: {
      first_name: string;
      last_name: string;
      phone?: string;
      college_id: string;
      contact_person: string;
      designation?: string;
    },
  ) => Promise<{
    data: { user: User | null; session: Session | null } | null;
    error: AuthError | null;
  }>;
  signUpAdmin: (
    email: string,
    password: string,
    userData: {
      first_name: string;
      last_name: string;
      phone?: string;
    },
  ) => Promise<{
    data: { user: User | null; session: Session | null } | null;
    error: AuthError | null;
  }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (
    provider: "google" | "github",
  ) => Promise<{
    data: { provider: unknown; url: string } | null;
    error: AuthError | null;
  }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  hasRole: (role: "student" | "admin" | "college") => boolean;
  isAdmin: () => boolean;
  isStudent: () => boolean;
  isCollege: () => boolean;
  // New centralized redirect helpers
  requireAuth: () => void;
  requireRole: (role: "student" | "admin" | "college") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Simplified error boundary using existing AuthErrorBoundary

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Keep ref in sync with profile state
  useEffect(() => {
    currentProfileRef.current = profile;
  }, [profile]);
  const [loading, setLoading] = useState(true); // Start with true, set to false after initial load
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();

  // Performance tracking refs
  const profileFetchCount = useRef(0);
  const lastProfileFetch = useRef<string | null>(null);
  const currentProfileRef = useRef<UserProfile | null>(null);

  // Profile state deduplication refs
  const profileOperationLocks = useRef<
    Map<string, Promise<UserProfile | null>>
  >(new Map());
  const profileCreationDebounceTimers = useRef<Map<string, NodeJS.Timeout>>(
    new Map(),
  );
  const profileOperationStates = useRef<
    Map<string, "idle" | "fetching" | "creating" | "error">
  >(new Map());
  
  // Global auth state change handler lock to prevent multiple simultaneous executions
  const authStateChangeLock = useRef<boolean>(false);

  // Ensure component is mounted before any operations
  useEffect(() => {
    try {
      setMounted(true);

      // Set up network status monitoring
      const unsubscribeConnection = offlineAuthManager.addConnectionListener((status) => {
        setIsOnline(status.isOnline);
        console.log("[AuthProvider] Network status changed:", status);
      });

      // Capture ref values to avoid exhaustive deps warning
      const operationStates = profileOperationStates.current;
      const operationLocks = profileOperationLocks.current;
      const debounceTimers = profileCreationDebounceTimers.current;

      // Log performance summary on unmount (development only) and cleanup
      return () => {
        try {
          if (process.env.NODE_ENV === "development") {
            logAuthPerformanceSummary();
          }

          // Clean up all profile operation state and timers
          operationStates.clear();
          operationLocks.clear();
          debounceTimers.forEach((timer) => clearTimeout(timer));
          debounceTimers.clear();
          
          // Clear auth state change lock
          authStateChangeLock.current = false;
          
          // Unsubscribe from network monitoring
          unsubscribeConnection();
        } catch (error) {
          console.warn("Error during cleanup:", error);
        }
      };
    } catch (error) {
      console.error("Error in mount effect:", error);
      setMounted(true); // Ensure we still set mounted even if there's an error
    }
  }, []);

  // Optimized function to fetch user profile with caching, performance monitoring, and deduplication
  const fetchUserProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      const timer = performanceMonitor.startTimer(`fetchUserProfile`);
      profileFetchCount.current += 1;

      try {
        // Validate user ID
        if (!userId || typeof userId !== "string") {
          console.warn("Invalid user ID provided to fetchUserProfile:", userId);
          timer.end();
          return null;
        }

        // Check if there's already an ongoing operation for this user
        const existingOperation = profileOperationLocks.current.get(userId);
        if (existingOperation) {
          console.log("Reusing existing profile operation for user:", userId);
          timer.end();
          return await existingOperation;
        }

        // Check current operation state
        const currentState = profileOperationStates.current.get(userId);
        if (currentState === "fetching" || currentState === "creating") {
          console.log(
            "Profile operation already in progress for user:",
            userId,
            "state:",
            currentState,
          );
          timer.end();
          return null; // Return null instead of profile to avoid dependency
        }

        // Check if we already fetched this profile recently to prevent redundant calls
        if (lastProfileFetch.current === userId && currentProfileRef.current?.id === userId) {
          console.log("Skipping redundant profile fetch for user:", userId);
          timer.end();
          return currentProfileRef.current; // Return current profile from ref
        }

        // Check cache first
        const cachedProfile = authCache.get(`profile_${userId}`);
        if (cachedProfile) {
          console.log("Using cached profile for user:", userId);
          timer.end();
          lastProfileFetch.current = userId;
          profileOperationStates.current.set(userId, "idle");
          return cachedProfile as UserProfile;
        }

        // Set operation state and create lock
        profileOperationStates.current.set(userId, "fetching");

        const fetchOperation = (async (): Promise<UserProfile | null> => {
          try {
            console.log(
              `Fetching profile for user ID: ${userId} (fetch #${profileFetchCount.current})`,
            );

            const { data, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userId)
              .maybeSingle();

            if (error) {
              console.error("Error fetching profile:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                userId,
              });
              profileOperationStates.current.set(userId, "error");
              return null;
            }

            // If no data returned, profile doesn't exist
            if (!data) {
              console.log("Profile not found for user:", userId);
              profileOperationStates.current.set(userId, "idle");
              return null;
            }

            const userProfile = data as UserProfile;
            console.log("Profile fetched successfully:", userProfile);

            // Cache the profile
            authCache.set(`profile_${userId}`, userProfile);
            lastProfileFetch.current = userId;
            profileOperationStates.current.set(userId, "idle");

            return userProfile;
          } catch (error) {
            console.error("Exception fetching profile:", {
              error: error instanceof Error ? error.message : String(error),
              userId,
              stack: error instanceof Error ? error.stack : undefined,
            });
            profileOperationStates.current.set(userId, "error");
            return null;
          }
        })();

        // Store the operation promise
        profileOperationLocks.current.set(userId, fetchOperation);

        const result = await fetchOperation;

        // Clean up the lock
        profileOperationLocks.current.delete(userId);

        timer.end();
        return result;
      } catch (error) {
        console.error("Exception in fetchUserProfile:", error);
        profileOperationStates.current.set(userId, "error");
        profileOperationLocks.current.delete(userId);
        timer.end();
        return null;
      }
    },
    [], // Remove profile dependency to prevent infinite loop
  );

  // Idempotent function to create or get user profile when authenticated with deduplication
  const createUserProfile = useCallback(
    async (user: User): Promise<UserProfile | null> => {
      const timer = performanceMonitor.startTimer("createUserProfile");

      try {
        // Check if there's already an ongoing operation for this user
        const existingOperation = profileOperationLocks.current.get(user.id);
        if (existingOperation) {
          console.log(
            "Reusing existing profile creation operation for user:",
            user.id,
          );
          timer.end();
          return await existingOperation;
        }

        // Check current operation state
        const currentState = profileOperationStates.current.get(user.id);
        if (currentState === "creating" || currentState === "fetching") {
          console.log(
            "Profile operation already in progress for user:",
            user.id,
            "state:",
            currentState,
          );
          timer.end();
          return null; // Return null instead of profile to avoid dependency
        }

        // Set operation state and create lock
        profileOperationStates.current.set(user.id, "creating");

        const createOperation = (async (): Promise<UserProfile | null> => {
          try {
            // First, check if profile already exists
            console.log("Checking if profile exists for user:", user.id);
            const { data: existingProfile, error: fetchError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .maybeSingle();

            if (existingProfile) {
              console.log("Profile already exists for user:", user.id);
              // Cache the existing profile
              authCache.set(`profile_${user.id}`, existingProfile);
              lastProfileFetch.current = user.id;
              profileOperationStates.current.set(user.id, "idle");
              return existingProfile as UserProfile;
            }

            // If there was an error fetching profile, handle it
            if (fetchError) {
              console.error(
                "Error checking profile existence:",
                fetchError,
              );
              profileOperationStates.current.set(user.id, "error");
              return null;
            }

            // Get user metadata from signup
            const userData = user.user_metadata || {};

            // Determine role from metadata or default to student
            const role = userData.role || "student";

            // Create a more complete profile data object
            const profileData = {
              id: user.id,
              email: user.email!,
              first_name: userData.first_name || userData.firstName || "",
              last_name: userData.last_name || userData.lastName || "",
              phone: userData.phone || null,
              role: role as "student" | "admin" | "college",
              is_verified: true, // Email verification disabled in Supabase
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            console.log("Creating profile with data:", profileData);

            console.log(
              "Creating new profile for user:",
              user.id,
              "with role:",
              role,
            );
            console.log("Profile data:", profileData);

            const { data, error } = await (supabase as any)
              .from("profiles")
              .insert([profileData])
              .select()
              .single();

            if (error) {
              // Handle duplicate key constraint violation (PostgreSQL error code 23505)
              if (error.code === "23505") {
                console.log(
                  "Profile creation failed due to duplicate key, fetching existing profile for user:",
                  user.id,
                );

                // Fetch the existing profile that caused the constraint violation
                const { data: existingProfileAfterError, error: refetchError } =
                  await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (refetchError) {
                  console.error(
                    "Error fetching existing profile after duplicate key error:",
                    refetchError,
                  );
                  profileOperationStates.current.set(user.id, "error");
                  return null;
                }

                if (existingProfileAfterError) {
                  console.log(
                    "Successfully retrieved existing profile after duplicate key error:",
                    (existingProfileAfterError as { id: string }).id,
                  );
                  // Cache the existing profile
                  authCache.set(
                    `profile_${user.id}`,
                    existingProfileAfterError,
                  );
                  lastProfileFetch.current = user.id;
                  profileOperationStates.current.set(user.id, "idle");
                  return existingProfileAfterError as UserProfile;
                }
              }

              console.error("Error creating profile:", error);
              console.error("Error details:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
              });
              profileOperationStates.current.set(user.id, "error");
              return null;
            }

            const newProfile = data as UserProfile;
            console.log("Profile created successfully:", newProfile);

            // Cache the newly created profile
            authCache.set(`profile_${user.id}`, newProfile);
            lastProfileFetch.current = user.id;
            profileOperationStates.current.set(user.id, "idle");

            return newProfile;
          } catch (error) {
            // const errorMessage = error instanceof Error ? error.message : String(error)
            console.error("Error in createUserProfile operation:", error);
            console.error("Error type:", typeof error);
            console.error(
              "Error stack:",
              error instanceof Error ? error.stack : "No stack trace",
            );
            profileOperationStates.current.set(user.id, "error");
            return null;
          }
        })();

        // Store the operation promise
        profileOperationLocks.current.set(user.id, createOperation);

        const result = await createOperation;

        // Clean up the lock
        profileOperationLocks.current.delete(user.id);

        timer.end();
        return result;
      } catch (error) {
        console.error("Error in createUserProfile:", error);
        profileOperationStates.current.set(user.id, "error");
        profileOperationLocks.current.delete(user.id);
        timer.end();
        return null;
      }
    },
    [], // Remove profile dependency to prevent infinite loop
  );

  // Debounced profile creation to prevent multiple rapid calls
  const debouncedCreateUserProfile = useCallback(
    async (user: User): Promise<UserProfile | null> => {
      return new Promise((resolve) => {
        // Clear any existing timer for this user
        const existingTimer = profileCreationDebounceTimers.current.get(
          user.id,
        );
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        // Set a new timer
        const timer = setTimeout(async () => {
          try {
            const result = await createUserProfile(user);
            resolve(result);
          } catch (error) {
            console.error("Error in debounced profile creation:", error);
            resolve(null);
          } finally {
            // Clean up the timer
            profileCreationDebounceTimers.current.delete(user.id);
          }
        }, 300); // 300ms debounce delay

        profileCreationDebounceTimers.current.set(user.id, timer);
      });
    },
    [createUserProfile],
  );


  useEffect(() => {
    if (!mounted) return;

    // Add a fallback timeout to ensure loading is always cleared
    const fallbackTimeout = setTimeout(() => {
      console.warn("[AuthProvider] Fallback timeout reached, clearing loading state");
      setLoading(false);
    }, 15000); // 15 seconds fallback

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log("[AuthProvider] Getting initial session...");
        
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 10000)
        );
        
        // Try to get session from Supabase with timeout
        let session: Session | null = null;
        let user: User | null = null;
        let error: any = null;

        try {
          const {
            data: { session: supabaseSession },
            error: sessionError,
          } = await Promise.race([sessionPromise, timeoutPromise]) as any;

          session = supabaseSession;
          user = session?.user ?? null;
          error = sessionError;
        } catch (sessionError) {
          console.warn("[AuthProvider] Supabase session failed, trying offline state:", sessionError);
          
          // If it's a network error or timeout, try to get offline state
          if (await offlineAuthManager.handleAuthError(sessionError)) {
            const offlineState = await offlineAuthManager.getOfflineAuthState();
            if (offlineState) {
              session = offlineState.session;
              user = offlineState.user;
              console.log("[AuthProvider] Using offline auth state");
            }
          } else {
            // For timeout or other errors, just continue without session
            console.warn("[AuthProvider] Session check failed, continuing without session");
            session = null;
            user = null;
            error = sessionError;
          }
        }

        console.log("[AuthProvider] Initial session result:", {
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          error: error?.message,
          isOnline: isOnline,
        });

        if (error && !session) {
          console.error("Error getting session:", error);
          // Critical session errors should be handled by error boundary
          if (
            error.message.includes("Network") ||
            error.message.includes("fetch")
          ) {
            throw error;
          }
        }

        setSession(session);
        setUser(user);

        // Fetch user profile if session exists
        if (session?.user?.id) {
          console.log("Session user found, fetching profile for:", session.user.id);
          
          // Use safe getUser() that checks for session first
          try {
            const {
              data: { user: freshUser },
              error: userError,
            } = await safeGetUser();

            if (userError || !freshUser) {
              console.warn(
                "Safe getUser failed, using session user:",
                userError &&
                  typeof userError === "object" &&
                  userError !== null &&
                  "message" in userError
                  ? (userError as Error).message
                  : "Unknown error",
              );
              // Fall back to session user if getUser() fails
              const userProfile = await fetchUserProfile(session.user.id);
              setProfile(userProfile);
            } else {
              let userProfile = await fetchUserProfile(freshUser.id);

              // If profile doesn't exist, create it using debounced creation
              if (!userProfile) {
                console.log(
                  "Profile not found on initial load, creating new profile for user:",
                  freshUser.id,
                );
                userProfile = await debouncedCreateUserProfile(freshUser);
              }

              setProfile(userProfile);
            }
          } catch (error) {
            console.warn(
              "Safe getUser threw error, using session user instead:",
              error,
            );
            // Critical errors should bubble up to error boundary
            if (
              error instanceof Error &&
              (error.message.includes("Network") ||
                error.message.includes("fetch"))
            ) {
              throw error;
            }
            // Fall back to using session user
            const userProfile = await fetchUserProfile(session.user.id);
            setProfile(userProfile);
          }
        } else {
          console.log("No session user found, setting profile to null");
          setProfile(null);
        }
      } catch (error) {
        console.error("Auth session check failed:", error);

        // Parse and log the error
        const parsedError = parseAuthError(error);
        logAuthError(parsedError, { context: "initial_session_check" });

        // Critical initialization errors should be handled by error boundary
        if (
          error instanceof Error &&
          (error.message.includes("Network") || error.message.includes("fetch"))
        ) {
          throw error;
        }

        setUser(null);
        setSession(null);
        setProfile(null);
      } finally {
        clearTimeout(fallbackTimeout);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    try {
      const {
        data: { subscription },
      } =       supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          // Prevent multiple simultaneous auth state change handlers
          if (authStateChangeLock.current) {
            console.log("Auth state change handler already running, skipping");
            return;
          }
          
          authStateChangeLock.current = true;
          
          try {
            console.log("[AuthProvider] Auth state changed:", {
              event,
              hasSession: !!session,
              userId: session?.user?.id,
              userEmail: session?.user?.email,
              isOnline: isOnline,
            });
            
            // Skip processing for INITIAL_SESSION events to prevent loops
            if (event === 'INITIAL_SESSION') {
              console.log("Skipping INITIAL_SESSION event to prevent auth loop");
              setLoading(false);
              return;
            }
            
            // Handle offline scenarios
            if (!isOnline && event === 'TOKEN_REFRESHED') {
              console.log("Token refresh attempted while offline, skipping");
              setLoading(false);
              return;
            }
            
            // Only update state if it's actually different to prevent loops
            setSession(prevSession => {
              if (prevSession?.access_token === session?.access_token) {
                console.log("Session unchanged, skipping profile fetch");
                return prevSession;
              }
              return session;
            });
            
            setUser(prevUser => {
              if (prevUser?.id === session?.user?.id) {
                console.log("User unchanged, skipping profile fetch");
                return prevUser;
              }
              return session?.user ?? null;
            });

            // Only fetch profile if we have a new session/user
            if (session?.user?.id && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
              console.log(
                "New session detected, fetching profile for:",
                session.user.id,
              );
              
              // Check if we already have this profile to prevent redundant fetches
              if (currentProfileRef.current?.id === session.user.id) {
                console.log("Profile already loaded for user:", session.user.id);
                setLoading(false);
                return;
              }
              
              // Use safe getUser() that checks for session first
              try {
                const {
                  data: { user: freshUser },
                  error: userError,
                } = await safeGetUser();

                if (userError || !freshUser) {
                  console.warn(
                    "Safe getUser failed in auth change, using session user:",
                    userError &&
                      typeof userError === "object" &&
                      userError !== null &&
                      "message" in userError
                      ? (userError as Error).message
                      : "Unknown error",
                  );
                  // Fall back to session user if getUser() fails
                  const userProfile = await fetchUserProfile(session.user.id);
                  setProfile(userProfile);
                } else {
                  let userProfile = await fetchUserProfile(freshUser.id);

                  // If profile doesn't exist, create it (user just verified email) using debounced creation
                  if (!userProfile) {
                    console.log(
                      "Profile not found, creating new profile for user:",
                      freshUser.id,
                    );
                    userProfile = await debouncedCreateUserProfile(freshUser);
                  }

                  setProfile(userProfile);
                }
              } catch (error) {
                console.warn(
                  "Safe getUser threw error in auth change, using session user instead:",
                  error,
                );
                // Fall back to using session user
                try {
                  const userProfile = await fetchUserProfile(session.user.id);
                  setProfile(userProfile);
                } catch (profileError) {
                  console.error(
                    "Failed to fetch profile for session user:",
                    profileError,
                  );
                  setProfile(null);
                }
              }
            } else if (!session) {
              console.log("No session found, clearing profile");
              setProfile(null);
            }

            setLoading(false);
          } finally {
            authStateChangeLock.current = false;
          }
        },
      );

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error("Failed to set up auth listener:", error);
      setLoading(false);
    }
  }, [mounted, debouncedCreateUserProfile, fetchUserProfile, isOnline]); // Include all dependencies

  const signIn = useCallback(async (email: string, password: string) => {
    const timer = performanceMonitor.startTimer("signIn");
    setLoading(true);

    try {
      // Clear any cached data for fresh login
      authCache.clear();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);

        // Parse and log the error
        const parsedError = parseAuthError(error);
        logAuthError(parsedError, { context: "sign_in" });

        // Handle specific authentication errors gracefully
        if (
          error.message.includes("Invalid login credentials") ||
          error.message.includes("Email not confirmed") ||
          error.message.includes("User not found")
        ) {
          timer.end();
          return { data: null, error };
        }

        // Let error boundary handle critical errors
        throw error;
      }

      // Check if user is authenticated and email is confirmed
      if (data.user && data.session) {
        console.log("User signed in successfully:", data.user.email);
        timer.end(true);
        return { data, error: null };
      } else {
        const authError = new Error("Authentication failed");
        throw authError;
      }
    } catch (error) {
      console.error("Sign in error:", error);
      // Critical errors should be handled by error boundary
      if (
        error instanceof Error &&
        (error.message.includes("Network") || error.message.includes("fetch"))
      ) {
        throw error;
      }
      timer.end();
      return { data: null, error: error as AuthError };
    } finally {
      setLoading(false);
    }
  }, []);

  const signUpStudent = useCallback(
    async (
      email: string,
      password: string,
      userData: {
        first_name: string;
        last_name: string;
        phone?: string;
      },
    ) => {
      let timer: { end: () => void } | null;
      try {
        timer = performanceMonitor.startTimer("signUpStudent");
      } catch (timerError) {
        console.warn("Performance timer error:", timerError);
        timer = { end: () => {} }; // Fallback timer
      }

      setLoading(true);
      console.log("signUpStudent called with:", { email, userData });

      try {
        console.log("Calling supabase.auth.signUp...");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              ...userData,
              role: "student",
            },
          },
        });

        console.log("Supabase signUp response:", {
          user_id: data?.user?.id,
          user_email: data?.user?.email,
          session_exists: !!data?.session,
          error: error?.message,
        });

        if (error) {
          console.error("Supabase signup error:", error);
          throw error;
        }

        // Don't create profile immediately - user needs to verify email first
        // Profile will be created when user is authenticated (after email verification)
        console.log(
          "Student signup successful. User needs to verify email before profile creation.",
        );

        try {
          timer.end();
        } catch (timerError) {
          console.warn("Timer end error:", timerError);
        }
        return { data, error: null };
      } catch (error) {
        console.error("Student sign up error:", error);
        try {
          timer.end();
        } catch (timerError) {
          console.warn("Timer end error:", timerError);
        }
        return { data: null, error: error as AuthError };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const signUpCollege = useCallback(
    async (
      email: string,
      password: string,
      userData: {
        first_name: string;
        last_name: string;
        phone?: string;
        college_id: string;
        contact_person: string;
        designation?: string;
      },
    ) => {
      const timer = performanceMonitor.startTimer("signUpCollege");
      setLoading(true);

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              ...userData,
              role: "college",
            },
          },
        });

        if (error) throw error;

        // Don't create profile immediately - user needs to verify email first
        // Profile will be created when user is authenticated (after email verification)
        console.log(
          "College signup successful. User needs to verify email before profile creation.",
        );

        timer.end(true);
        return { data, error: null };
      } catch (error) {
        console.error("College sign up error:", error);
        timer.end();
        return { data: null, error: error as AuthError };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const signUpAdmin = useCallback(
    async (
      email: string,
      password: string,
      userData: {
        first_name: string;
        last_name: string;
        phone?: string;
      },
    ) => {
      const timer = performanceMonitor.startTimer("signUpAdmin");
      setLoading(true);

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              ...userData,
              role: "admin",
            },
          },
        });

        if (error) throw error;

        // Don't create profile immediately - user needs to verify email first
        // Profile will be created when user is authenticated (after email verification)
        console.log(
          "Admin signup successful. User needs to verify email before profile creation.",
        );

        timer.end(true);
        return { data, error: null };
      } catch (error) {
        console.error("Admin sign up error:", error);
        timer.end();
        return { data: null, error: error as AuthError };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    const timer = performanceMonitor.startTimer("signOut");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear all cached data and operation state on sign out
      authCache.clear();
      profileFetchCount.current = 0;
      lastProfileFetch.current = null;

      // Clear all profile operation state
      profileOperationStates.current.clear();
      profileOperationLocks.current.clear();

      // Clear all debounce timers
      profileCreationDebounceTimers.current.forEach((timer) =>
        clearTimeout(timer),
      );
      profileCreationDebounceTimers.current.clear();

      setUser(null);
      setSession(null);
      setProfile(null);

      timer.end(true);
      return { error: null };
    } catch (error) {
      console.error("Sign out error:", error);
      timer.end();
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithOAuth = useCallback(async (provider: "google" | "github") => {
    const timer = performanceMonitor.startTimer(`signInWithOAuth(${provider})`);
    setLoading(true);

    try {
      // Clear any cached data for fresh login
      authCache.clear();

      // Build redirect URL with robust fallbacks
      let redirectTo: string;

      if (typeof window !== "undefined") {
        // Client-side: use current origin
        try {
          redirectTo = `${window.location.origin}/auth/callback`;
        } catch (error) {
          console.warn("Failed to get window.location.origin:", error);
          redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`;
        }
      } else {
        // Server-side: use environment variable
        const appUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (!appUrl) {
          throw new Error(
            "NEXT_PUBLIC_APP_URL environment variable is required for OAuth",
          );
        }
        redirectTo = `${appUrl}/auth/callback`;
      }

      console.log("OAuth redirect URL:", redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) throw error;

      timer.end(true);
      return { data, error: null };
    } catch (error) {
      console.error("OAuth sign in error:", error);
      timer.end();
      return { data: null, error: error as AuthError };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const timer = performanceMonitor.startTimer("resetPassword");

    try {
      // Ensure we're in the browser environment
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/reset-password`
          : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;

      timer.end(true);
      return { error: null };
    } catch (error) {
      console.error("Password reset error:", error);
      timer.end();
      return { error: error as AuthError };
    }
  }, []);

  // Memoized role helper functions
  const hasRole = useCallback(
    (role: "student" | "admin" | "college"): boolean => {
      return profile?.role === role;
    },
    [profile?.role],
  );

  const isAdmin = useCallback((): boolean => {
    return profile?.role === "admin";
  }, [profile?.role]);

  const isStudent = useCallback((): boolean => {
    return profile?.role === "student";
  }, [profile?.role]);

  const isCollege = useCallback((): boolean => {
    return profile?.role === "college";
  }, [profile?.role]);

  // Memoized centralized redirect helpers
  const requireAuth = useCallback((): void => {
    console.log("requireAuth: Called", {
      loading,
      hasUser: !!user,
      hasSession: !!session,
      hasProfile: !!profile,
      userEmail: user?.email,
      profileRole: profile?.role
    });

    // Don't redirect if still loading - this is crucial to prevent race conditions
    if (loading) {
      console.log("requireAuth: Still loading, skipping redirect");
      return;
    }

    // Add a longer delay to ensure auth state is fully settled
    setTimeout(() => {
      // Double-check loading state after delay
      if (loading) {
        console.log("requireAuth: Still loading after delay, skipping redirect");
        return;
      }

      // Redirect to login if no user or session
      if (!user || !session) {
        console.log("requireAuth: User not authenticated, redirecting to login");
        router.push("/auth/login");
        return;
      }

      // Check if user has a profile (completed registration)
      if (!profile) {
        console.log(
          "requireAuth: User authenticated but no profile, redirecting to complete profile",
        );
        console.log("requireAuth: User details:", { userId: user.id, userEmail: user.email });
        router.push("/auth/complete-profile");
        return;
      }

      console.log("requireAuth: All checks passed, user is authenticated");
    }, 200); // Longer delay to ensure auth state is settled
  }, [loading, user, session, profile, router]);

  const requireRole = useCallback(
    (requiredRole: "student" | "admin" | "college"): void => {
      // Don't redirect if still loading
      if (loading) {
        console.log("requireRole: Still loading, skipping redirect");
        return;
      }

      // Add a small delay to ensure auth state is fully settled
      setTimeout(() => {
        // Double-check loading state after delay
        if (loading) return;

        // First ensure user is authenticated
        if (!user || !session) {
          console.log(
            "requireRole: User not authenticated, redirecting to login",
          );
          router.push("/auth/login");
          return;
        }

        // Check if user has a profile
        if (!profile) {
          console.log(
            "requireRole: User authenticated but no profile, redirecting to complete profile",
          );
          router.push("/auth/complete-profile");
          return;
        }

        // Check if user has the required role
        if (profile.role !== requiredRole) {
          console.log(
            `requireRole: User role '${profile.role}' does not match required role '${requiredRole}', redirecting to dashboard`,
          );
          // Redirect to appropriate dashboard based on user's actual role
          switch (profile.role) {
            case "admin":
              router.push("/admin");
              break;
            case "college":
              router.push("/colleges/dashboard");
              break;
            case "student":
            default:
              router.push("/dashboard");
              break;
          }
          return;
        }
      }, 100); // Small delay to ensure auth state is settled
    },
    [loading, user, session, profile, router],
  );

  // Memoize the context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      isOnline,
      signIn,
      signUpStudent,
      signUpCollege,
      signUpAdmin,
      signOut,
      signInWithOAuth,
      resetPassword,
      hasRole,
      isAdmin,
      isStudent,
      isCollege,
      requireAuth,
      requireRole,
    }),
    [
      user,
      session,
      profile,
      loading,
      isOnline,
      signIn,
      signUpStudent,
      signUpCollege,
      signUpAdmin,
      signOut,
      signInWithOAuth,
      resetPassword,
      hasRole,
      isAdmin,
      isStudent,
      isCollege,
      requireAuth,
      requireRole,
    ],
  );

  // Don't render until component is mounted to prevent hydration issues
  if (!mounted) {
    return (
      <AuthErrorProvider>
        <AuthErrorBoundary>
          <AuthContext.Provider
            value={{
              user: null,
              session: null,
              profile: null,
              loading: true,
              isOnline: true,
              signIn: async () => ({ data: null, error: null }),
              signUpStudent: async () => ({ data: null, error: null }),
              signUpCollege: async () => ({ data: null, error: null }),
              signUpAdmin: async () => ({ data: null, error: null }),
              signOut: async () => ({ error: null }),
              signInWithOAuth: async () => ({ data: null, error: null }),
              resetPassword: async () => ({ error: null }),
              hasRole: () => false,
              isAdmin: () => false,
              isStudent: () => false,
              isCollege: () => false,
              requireAuth: () => {},
              requireRole: () => {},
            }}
          >
            {children}
          </AuthContext.Provider>
        </AuthErrorBoundary>
      </AuthErrorProvider>
    );
  }

  // Validate the value object before passing to context
  if (!value) {
    console.error("AuthContext value is undefined!");
    throw new Error("AuthContext value is undefined");
  }

  return (
    <AuthErrorProvider>
      <AuthErrorBoundary>
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
      </AuthErrorBoundary>
    </AuthErrorProvider>
  );
}
