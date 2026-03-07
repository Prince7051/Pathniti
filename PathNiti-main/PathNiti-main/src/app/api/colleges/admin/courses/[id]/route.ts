import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/colleges/admin/courses/[id]
 * Get a specific course by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get user profile and verify college role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "college") {
      return NextResponse.json(
        { error: "College role required" },
        { status: 403 },
      );
    }

    // Get college profile to find college_id
    const { data: collegeProfile } = await supabase
      .from("college_profiles")
      .select("college_id")
      .eq("id", session.user.id)
      .single();

    if (!collegeProfile) {
      return NextResponse.json(
        { error: "College profile not found" },
        { status: 404 },
      );
    }

    // Get the course ID from params
    const { id: courseId } = await params;

    // Get the specific course
    const { data: course, error } = await supabase
      .from("college_courses")
      .select("*")
      .eq("id", courseId)
      .eq("college_id", collegeProfile.college_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch course", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Error in GET /api/colleges/admin/courses/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/colleges/admin/courses/[id]
 * Update a specific course
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get user profile and verify college role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "college") {
      return NextResponse.json(
        { error: "College role required" },
        { status: 403 },
      );
    }

    // Get college profile to find college_id
    const { data: collegeProfile } = await supabase
      .from("college_profiles")
      .select("college_id")
      .eq("id", session.user.id)
      .single();

    if (!collegeProfile) {
      return NextResponse.json(
        { error: "College profile not found" },
        { status: 404 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description, duration, eligibility, fees, seats, is_active } =
      body;

    // Validate required fields
    if (name !== undefined && !name?.trim()) {
      return NextResponse.json(
        { error: "Course name cannot be empty" },
        { status: 400 },
      );
    }

    // Validate fees structure if provided
    if (fees && typeof fees === "object") {
      const { tuition, other, total } = fees;
      if (
        tuition !== undefined &&
        (typeof tuition !== "number" || tuition < 0)
      ) {
        return NextResponse.json(
          { error: "Invalid tuition fee amount" },
          { status: 400 },
        );
      }
      if (other !== undefined && (typeof other !== "number" || other < 0)) {
        return NextResponse.json(
          { error: "Invalid other fee amount" },
          { status: 400 },
        );
      }
      if (total !== undefined && (typeof total !== "number" || total < 0)) {
        return NextResponse.json(
          { error: "Invalid total fee amount" },
          { status: 400 },
        );
      }
    }

    // Validate seats if provided
    if (seats !== undefined && (typeof seats !== "number" || seats < 0)) {
      return NextResponse.json(
        { error: "Invalid number of seats" },
        { status: 400 },
      );
    }

    // Prepare update data
    const updateData: { updated_at: string; [key: string]: unknown } = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined)
      updateData.description = description?.trim() || null;
    if (duration !== undefined) updateData.duration = duration?.trim() || null;
    if (eligibility !== undefined)
      updateData.eligibility = eligibility?.trim() || null;
    if (fees !== undefined) updateData.fees = fees;
    if (seats !== undefined) updateData.seats = seats;
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    // Get the course ID from params
    const { id: courseId } = await params;

    // Update the course
    const { data: course, error } = await supabase
      .from("college_courses")
      .update(updateData)
      .eq("id", courseId)
      .eq("college_id", collegeProfile.college_id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Failed to update course", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    console.error("Error in PUT /api/colleges/admin/courses/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/colleges/admin/courses/[id]
 * Delete a specific course (soft delete by setting is_active to false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Get user profile and verify college role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "college") {
      return NextResponse.json(
        { error: "College role required" },
        { status: 403 },
      );
    }

    // Get college profile to find college_id
    const { data: collegeProfile } = await supabase
      .from("college_profiles")
      .select("college_id")
      .eq("id", session.user.id)
      .single();

    if (!collegeProfile) {
      return NextResponse.json(
        { error: "College profile not found" },
        { status: 404 },
      );
    }

    // Get the course ID from params
    const { id: courseId } = await params;

    // Soft delete the course by setting is_active to false
    const { data: course, error } = await supabase
      .from("college_courses")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", courseId)
      .eq("college_id", collegeProfile.college_id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Failed to delete course", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Course deleted successfully",
      course,
    });
  } catch (error) {
    console.error("Error in DELETE /api/colleges/admin/courses/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
