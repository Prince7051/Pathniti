"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../../providers";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // Don't do anything while auth is still loading
    if (loading) return;

    const handleAuthCallback = async () => {
      try {
        if (user) {
          console.log("User authenticated:", user.id, user.email);

          if (profile) {
            console.log("Profile found, redirecting to dashboard");
            router.push("/");
          } else {
            // Profile doesn't exist, redirect to complete profile
            // The central provider will handle profile creation
            console.log("Profile not found, redirecting to complete profile");
            router.push("/auth/complete-profile");
          }
        } else {
          console.log("No user found, redirecting to login");
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        router.push("/auth/login?error=callback_error");
      }
    };

    handleAuthCallback();
  }, [router, user, profile, loading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Signing you in...
          </h2>
          <p className="text-gray-600">
            Please wait while we complete your authentication.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
