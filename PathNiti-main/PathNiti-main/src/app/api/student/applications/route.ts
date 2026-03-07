import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from '@/lib/supabase/types';

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.then(store => store.getAll());
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.then(store => store.set(name, value, options)),
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      },
    );

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a student
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error for user:", user.id, profileError);
      // If profile doesn't exist, return empty applications instead of error
      if (profileError.code === "PGRST116") {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
      return NextResponse.json(
        { error: "Access denied. Student role required." },
        { status: 403 },
      );
    }

    if ((profile as { role?: string })?.role !== "student") {
      return NextResponse.json(
        { error: "Access denied. Student role required." },
        { status: 403 },
      );
    }

    // Fetch student applications with college information
    const { data: applications, error: applicationsError } = await supabase
      .from("student_applications")
      .select(
        `
        *,
        colleges:college_id (
          id,
          name,
          slug,
          type,
          location,
          address,
          website,
          phone,
          email
        )
      `,
      )
      .eq("student_id", user.id)
      .order("submitted_at", { ascending: false });

    if (applicationsError) {
      console.error("Error fetching applications:", applicationsError);
      return NextResponse.json(
        { error: "Failed to fetch applications" },
        { status: 500 },
      );
    }

    // Transform the data to include college information at the top level
    const transformedApplications =
      applications?.map((app: any) => ({
        ...app,
        college_name: app.colleges?.name || "Unknown College",
        college_slug: app.colleges?.slug || "",
        college_type: app.colleges?.type || "private",
        college_location: app.colleges?.location || null,
        college_address: app.colleges?.address || "",
        college_website: app.colleges?.website || null,
        college_phone: app.colleges?.phone || null,
        college_email: app.colleges?.email || null,
      })) || [];

    return NextResponse.json({
      success: true,
      data: transformedApplications,
    });
  } catch (error) {
    console.error("Unexpected error in student applications API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
