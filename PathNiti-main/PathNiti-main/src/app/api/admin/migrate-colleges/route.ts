import { NextResponse } from "next/server";
import { CollegeMigrationService } from "@/lib/college-migration";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Get current user (admin)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Verify user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Migrate mock colleges to database
    const collegeService = new CollegeMigrationService();
    await collegeService.migrateMockColleges();

    return NextResponse.json({
      success: true,
      message: "College migration completed successfully",
    });
  } catch (error) {
    console.error("Error migrating colleges:", error);
    return NextResponse.json(
      { error: "Failed to migrate colleges" },
      { status: 500 },
    );
  }
}
