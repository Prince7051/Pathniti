import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createCollegeCourse,
  getCollegeCourses,
  type CollegeCourseCreateData,
} from "@/lib/utils/college-db-utils";

/**
 * GET /api/colleges/admin/courses
 * Get all courses for the authenticated college
 */
export async function GET() {
  try {
    // Return mock courses data for development
    const mockCourses = [
      {
        id: "1",
        name: "Computer Science Engineering",
        code: "CSE",
        duration: "4 years",
        fees: 150000,
        seats: 60,
        description: "Comprehensive computer science program covering programming, algorithms, and software engineering.",
        eligibility: "10+2 with PCM",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2", 
        name: "Mechanical Engineering",
        code: "ME",
        duration: "4 years",
        fees: 120000,
        seats: 40,
        description: "Mechanical engineering program focusing on design, manufacturing, and automation.",
        eligibility: "10+2 with PCM",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Electronics and Communication Engineering", 
        code: "ECE",
        duration: "4 years",
        fees: 130000,
        seats: 50,
        description: "ECE program covering electronics, communication systems, and embedded systems.",
        eligibility: "10+2 with PCM",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    return NextResponse.json({ courses: mockCourses });
  } catch (error) {
    console.error("Error in GET /api/colleges/admin/courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/colleges/admin/courses
 * Create a new course for the authenticated college
 */
export async function POST(request: NextRequest) {
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
    const { name, description, duration, eligibility, fees, seats } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Course name is required" },
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

    // Create course data
    const courseData: CollegeCourseCreateData = {
      college_id: collegeProfile.college_id,
      name: name.trim(),
      description: description?.trim() || null,
      duration: duration?.trim() || null,
      eligibility: eligibility?.trim() || null,
      fees: fees || null,
      seats: seats || null,
      is_active: true,
    };

    // Create the course
    const { data: course, error } = await createCollegeCourse(courseData);

    if (error) {
      return NextResponse.json(
        { error: "Failed to create course", details: error },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Course created successfully",
        course,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in POST /api/colleges/admin/courses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
