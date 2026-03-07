import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = createServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if profile already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (profileCheckError && profileCheckError.code !== "PGRST116") {
      console.error("Error checking existing profile:", profileCheckError);
      return NextResponse.json(
        { error: "Failed to check existing profile" },
        { status: 500 },
      );
    }

    if (existingProfile) {
      return NextResponse.json({
        message: "Profile already exists",
        profile: existingProfile,
      });
    }

    // Get user metadata from signup
    const userData = user.user_metadata || {};

    // Determine role from metadata or default to student
    const role = userData.role || "student";

    const profileData = {
      id: user.id,
      email: user.email!,
      first_name: userData.first_name || "",
      last_name: userData.last_name || "",
      phone: userData.phone || null,
      role: role,
    };

    console.log("Creating profile for user:", user.id, "with role:", role);
    console.log("Profile data:", profileData);

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert(profileData)
      .select()
      .single();

    if (createError) {
      console.error("Error creating profile:", createError);
      console.error("Error details:", {
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        code: createError.code,
      });
      return NextResponse.json(
        {
          error: "Failed to create profile",
          details: createError.message,
        },
        { status: 500 },
      );
    }

    console.log("Profile created successfully:", newProfile);
    return NextResponse.json({
      message: "Profile created successfully",
      profile: newProfile,
    });
  } catch (error) {
    console.error("Error in create-profile API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
