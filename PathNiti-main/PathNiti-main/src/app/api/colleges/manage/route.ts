import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  updateCollegeProfile,
  getCollegeBySlug,
} from "@/lib/utils/college-db-utils";
import type { CollegeProfileUpdateData } from "@/lib/types/college-profile";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Debug: Log cookies
    console.log("[API] Request cookies:", request.cookies.getAll());

    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("[API] Session result:", { session: !!session, error: sessionError });

    // TODO: Re-enable authentication after fixing auth issues
    if (!session) {
      console.log("[API] No session found, but bypassing auth for development");
      // return NextResponse.json(
      //   { error: "Unauthorized - Please log in" },
      //   { status: 401 },
      // );
    }

    // Check if user has college role
    // TODO: Re-enable role check after fixing auth issues
    let profile = null;
    if (session) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      profile = profileData;
    }

    // if (!profile || profile.role !== "college") {
    //   return NextResponse.json(
    //     { error: "Forbidden - College role required" },
    //     { status: 403 },
    //   );
    // }

    // Get college associated with this user's email
    // TODO: Re-enable user-specific college lookup after fixing auth issues
    let college = null;
    let error = null;
    
    if (session?.user?.email) {
      const result = await supabase
        .from("colleges")
        .select(
          `
          *,
          college_courses(*),
          college_notices(*)
        `,
        )
        .eq("email", session.user.email)
        .single();
      college = result.data;
      error = result.error;
    } else {
      // Fallback: get the first college for development
      console.log("[API] No session email, using fallback college for development");
      const result = await supabase
        .from("colleges")
        .select(
          `
          *,
          college_courses(*),
          college_notices(*)
        `,
        )
        .limit(1)
        .single();
      college = result.data;
      error = result.error;
    }

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            error: "College not found",
            details: "No college is registered with this email",
          },
          { status: 404 },
        );
      }
      console.error("Error fetching college:", error);
      return NextResponse.json(
        { error: "Failed to fetch college profile" },
        { status: 500 },
      );
    }

    // Transform the data to match our interface
    const transformedData = {
      ...college,
      slug: college.slug || "",
      courses: college.college_courses || [],
      notices: college.college_notices || [],
      events: [], // Events will be added later when implemented
    };

    return NextResponse.json({ college: transformedData });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 },
      );
    }

    // Check if user has college role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "college") {
      return NextResponse.json(
        { error: "Forbidden - College role required" },
        { status: 403 },
      );
    }

    // Get college associated with this user's email
    const { data: existingCollege } = await supabase
      .from("colleges")
      .select("id, name, slug")
      .eq("email", session.user.email)
      .single();

    if (!existingCollege) {
      return NextResponse.json(
        {
          error: "College not found",
          details: "No college is registered with this email",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    // Validate data if provided
    if (body.type) {
      const validTypes = [
        "government",
        "government_aided",
        "private",
        "deemed",
      ];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          {
            error: "Invalid college type",
            details: `Type must be one of: ${validTypes.join(", ")}`,
          },
          { status: 400 },
        );
      }
    }

    if (
      body.location &&
      (!body.location.city || !body.location.state || !body.location.country)
    ) {
      return NextResponse.json(
        {
          error: "Invalid location data",
          details: "Location must include city, state, and country",
        },
        { status: 400 },
      );
    }

    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    if (body.website && !/^https?:\/\/.+/.test(body.website)) {
      return NextResponse.json(
        {
          error: "Invalid website URL",
          details: "Website must start with http:// or https://",
        },
        { status: 400 },
      );
    }

    if (body.established_year) {
      const year = parseInt(body.established_year);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1800 || year > currentYear) {
        return NextResponse.json(
          {
            error: "Invalid established year",
            details: `Year must be between 1800 and ${currentYear}`,
          },
          { status: 400 },
        );
      }
    }

    // Prepare update data
    const updateData: CollegeProfileUpdateData = {};

    // Only include fields that are provided and different
    if (body.name && body.name.trim() !== existingCollege.name) {
      updateData.name = body.name.trim();
    }
    if (body.type) updateData.type = body.type;
    if (body.location) updateData.location = body.location;
    if (body.address) updateData.address = body.address.trim();
    if (body.website !== undefined)
      updateData.website = body.website?.trim() || null;
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.email !== undefined) updateData.email = body.email?.trim() || null;
    if (body.established_year !== undefined) {
      updateData.established_year = body.established_year
        ? parseInt(body.established_year)
        : undefined;
    }
    if (body.accreditation !== undefined)
      updateData.accreditation = body.accreditation;
    if (body.about !== undefined) updateData.about = body.about?.trim() || null;
    if (body.admission_criteria !== undefined)
      updateData.admission_criteria = body.admission_criteria;
    if (body.scholarships !== undefined)
      updateData.scholarships = body.scholarships;
    if (body.entrance_tests !== undefined)
      updateData.entrance_tests = body.entrance_tests;
    if (body.fee_structure !== undefined)
      updateData.fee_structure = body.fee_structure;
    if (body.gallery !== undefined) updateData.gallery = body.gallery;

    // If no changes, return current data
    if (Object.keys(updateData).length === 0) {
      const { data: currentCollege } = await getCollegeBySlug(
        existingCollege.slug || existingCollege.id,
      );
      return NextResponse.json({
        message: "No changes detected",
        college: currentCollege,
      });
    }

    // Update college profile
    const { data: updatedCollege, error } = await updateCollegeProfile(
      existingCollege.id,
      updateData,
    );

    if (error) {
      console.error("Error updating college profile:", error);
      return NextResponse.json(
        { error: "Failed to update college profile", details: error },
        { status: 500 },
      );
    }

    if (!updatedCollege) {
      return NextResponse.json(
        { error: "Failed to update college profile" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "College profile updated successfully",
      college: updatedCollege,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
