"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers";
import { useRouter } from "next/navigation";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: "student" | "admin" | "college";
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requiredRole,
  fallback,
}: AuthGuardProps) {
  const { user, session, profile, loading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("AuthGuard: Checking authentication state", {
        loading,
        hasUser: !!user,
        hasSession: !!session,
        hasProfile: !!profile,
        requireAuth,
        requiredRole,
        userEmail: user?.email,
        profileRole: profile?.role
      });

      // Wait for auth state to be fully loaded
      if (loading) {
        console.log("AuthGuard: Still loading, waiting...");
        setIsChecking(true);
        return;
      }

      // If no auth required, render children
      if (!requireAuth) {
        console.log("AuthGuard: No auth required, rendering children");
        setShouldRender(true);
        setIsChecking(false);
        return;
      }

      // Check authentication - be more lenient
      if (!user || !session) {
        console.log("AuthGuard: User not authenticated, redirecting to login");
        // Add a small delay to prevent rapid redirects
        setTimeout(() => {
          router.push("/auth/login");
        }, 100);
        return;
      }

      // Check profile completion - be more lenient
      if (!profile) {
        console.log("AuthGuard: User authenticated but no profile, redirecting to complete profile");
        console.log("AuthGuard: User details:", { userId: user.id, userEmail: user.email });
        console.log("AuthGuard: Profile state:", profile);
        console.log("AuthGuard: Loading state:", loading);
        
        // Check if we're already on the complete profile page to prevent redirect loops
        if (window.location.pathname === "/auth/complete-profile") {
          console.log("AuthGuard: Already on complete profile page, allowing access");
          setShouldRender(true);
          setIsChecking(false);
          return;
        }
        
        // Add a small delay to prevent rapid redirects
        setTimeout(() => {
          router.push("/auth/complete-profile");
        }, 100);
        return;
      }

      // Check role if required
      if (requiredRole && profile.role !== requiredRole) {
        console.log(`AuthGuard: User role '${profile.role}' does not match required role '${requiredRole}'`);
        // Redirect to appropriate dashboard based on user's actual role
        const redirectUrl = (() => {
          switch (profile.role) {
            case "admin":
              return "/dashboard/admin";
            case "college":
              return "/dashboard/college";
            case "student":
            default:
              return "/dashboard/student";
          }
        })();
        
        setTimeout(() => {
          router.push(redirectUrl);
        }, 100);
        return;
      }

      // All checks passed
      console.log("AuthGuard: All checks passed, rendering children");
      setShouldRender(true);
      setIsChecking(false);
    };

    // Add a longer delay to ensure auth state is fully settled
    const timeoutId = setTimeout(checkAuth, 500);
    
    return () => clearTimeout(timeoutId);
  }, [loading, user, session, profile, requireAuth, requiredRole, router]);

  // Show loading state while checking
  if (isChecking || loading) {
    return (
      fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying authentication...</p>
          </div>
        </div>
      )
    );
  }

  // Render children if all checks passed
  if (shouldRender) {
    return <>{children}</>;
  }

  // Don't render anything while redirecting
  return null;
}

// Higher-order component version
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireAuth?: boolean;
    requiredRole?: "student" | "admin" | "college";
  }
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard
        requireAuth={options?.requireAuth}
        requiredRole={options?.requiredRole}
      >
        <Component {...props} />
      </AuthGuard>
    );
  };
}

// Role-specific guard components for convenience
export function AdminGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true} requiredRole="admin" fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

export function StudentGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true} requiredRole="student" fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

export function CollegeGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={true} requiredRole="college" fallback={fallback}>
      {children}
    </AuthGuard>
  );
}