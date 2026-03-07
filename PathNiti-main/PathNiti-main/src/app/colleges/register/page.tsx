import { Metadata } from "next";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import CollegeRegistrationForm from "@/components/CollegeRegistrationForm";
import { Suspense } from "react";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
  title: "Register Your College | PathNiti",
  description:
    "Register your college on PathNiti to create a dynamic profile page and manage student applications.",
};

export default async function CollegeRegisterPage({ searchParams }: PageProps) {
  const supabase = createServerClient();
  const resolvedSearchParams = await searchParams;

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login?redirect=/colleges/register");
  }

  // Check if user has college role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", session.user.id)
    .single();

  if (!profile) {
    redirect("/auth/complete-profile?redirect=/colleges/register");
  }

  if (profile.role !== "college") {
    redirect("/dashboard?error=college-role-required");
  }

  // Check if user already has a college registered
  const { data: existingCollege } = await supabase
    .from("colleges")
    .select("id, name, slug")
    .eq("email", session.user.email)
    .single();

  if (existingCollege) {
    redirect(
      `/colleges/${existingCollege.slug || existingCollege.id}?message=already-registered`,
    );
  }

  // Extract URL parameters for signup flow integration
  const source = resolvedSearchParams.source as string;
  const returnTo = resolvedSearchParams.returnTo as string;
  const minimal = resolvedSearchParams.minimal === "true";
  const isFromSignup = source === "signup";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Register Your College
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {isFromSignup
              ? "Register your college to continue with account creation. You'll be redirected back to complete your signup."
              : "Create a dynamic profile page for your college, manage courses, post notices, and handle student applications all in one place."}
          </p>
          {isFromSignup && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                After registering your college, you&apos;ll be automatically
                redirected back to complete your account creation.
              </p>
            </div>
          )}
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <CollegeRegistrationForm
            source={isFromSignup ? "signup" : "direct"}
            returnTo={returnTo}
            minimal={minimal || isFromSignup}
          />
        </Suspense>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {isFromSignup ? (
              <a
                href={returnTo || "/auth/signup/college"}
                className="text-blue-600 hover:underline"
              >
                ← Return to signup
              </a>
            ) : (
              <>
                Already registered?{" "}
                <Link
                  href="/colleges/dashboard"
                  className="text-blue-600 hover:underline"
                >
                  Go to your dashboard
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
