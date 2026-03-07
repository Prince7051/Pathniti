import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const limit = parseInt(searchParams.get("limit") || "50");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    let query = supabase
      .from("colleges_enhanced")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status === "pending") {
      query = query.eq("verified", false);
    } else if (status === "verified") {
      query = query.eq("verified", true);
    }

    const { data: colleges, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      colleges: colleges || [],
      count: colleges?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching colleges for admin:", error);
    return NextResponse.json(
      { error: "Failed to fetch colleges" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { college_id, action, feedback } = await request.json();

    if (!college_id || !action) {
      return NextResponse.json(
        { error: "College ID and action are required" },
        { status: 400 },
      );
    }

    const validActions = ["verify", "reject", "needs_info"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be verify, reject, or needs_info" },
        { status: 400 },
      );
    }

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

    // Update college based on action
    const updateData: {
      verified_by: string;
      last_verified_at: string;
      verified?: boolean;
      admin_feedback?: string;
    } = {
      verified_by: user.id,
      last_verified_at: new Date().toISOString(),
    };

    if (action === "verify") {
      updateData.verified = true;
    } else if (action === "reject") {
      updateData.verified = false;
    }

    const { error: updateError } = await supabase
      .from("colleges_enhanced")
      .update(updateData)
      .eq("college_id", college_id);

    if (updateError) {
      throw new Error(`Failed to update college: ${updateError.message}`);
    }

    // Log verification action
    const { error: logError } = await supabase
      .from("college_verifications")
      .insert({
        college_id,
        verifier_id: user.id,
        status:
          action === "verify"
            ? "verified"
            : action === "reject"
              ? "rejected"
              : "needs_info",
        feedback,
      });

    if (logError) {
      console.warn("Failed to log verification action:", logError);
    }

    return NextResponse.json({
      success: true,
      message: `College ${action}d successfully`,
      college_id,
    });
  } catch (error) {
    console.error("Error updating college:", error);
    return NextResponse.json(
      { error: "Failed to update college" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const collegeData = await request.json();

    const requiredFields = ["name", "address", "streams_offered"];
    for (const field of requiredFields) {
      if (!collegeData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 },
        );
      }
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Get current user
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

    // Verify user is admin or college_admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !["admin", "college_admin"].includes(profile?.role)) {
      return NextResponse.json(
        { error: "Admin or college admin access required" },
        { status: 403 },
      );
    }

    // Create college
    const { data: college, error: insertError } = await supabase
      .from("colleges_enhanced")
      .insert([
        {
          ...collegeData,
          verified: profile.role === "admin", // Auto-verify if created by admin
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create college: ${insertError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: "College created successfully",
      college,
    });
  } catch (error) {
    console.error("Error creating college:", error);
    return NextResponse.json(
      { error: "Failed to create college" },
      { status: 500 },
    );
  }
}
