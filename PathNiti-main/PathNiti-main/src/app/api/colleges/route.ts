import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { collegeProfileServiceEnhanced } from "@/lib/services/college-profile-service";
import { normalizePaginationParams } from "@/lib/utils/pagination";

// Enable caching for this route
export const revalidate = 180; // 3 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Get and normalize query parameters
    const state = searchParams.get("state");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const { limit, offset } = normalizePaginationParams(
      searchParams.get("page") || undefined,
      searchParams.get("limit") || undefined,
      50, // max limit
    );

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn("SUPABASE_SERVICE_ROLE_KEY not available, using fallback method");
      
      // Fallback to regular client for basic college listing
      const supabase = createServerClient();
      
      let query = supabase
        .from("colleges")
        .select(`
          id,
          slug,
          name,
          type,
          location,
          address,
          website,
          phone,
          email,
          established_year,
          accreditation,
          gallery,
          created_at
        `)
        .eq("is_active", true)
        .order("name");

      // Apply filters
      if (state) {
        query = query.eq("location->>state", state);
      }
      if (type) {
        query = query.eq("type", type);
      }
      if (search) {
        query = query.or(
          `name.ilike.%${search}%,address.ilike.%${search}%`,
        );
      }

      // Apply pagination
      query = query.range(offset || 0, (offset || 0) + (limit || 50) - 1);

      const { data: colleges, error } = await query;

      if (error) {
        console.error("Error fetching colleges (fallback):", error);
        return NextResponse.json(
          { error: `Failed to fetch colleges: ${error.message || 'Unknown error'}` },
          { status: 500 },
        );
      }

      const response = NextResponse.json({
        data: colleges || [],
        total: colleges?.length || 0,
        hasMore: false
      });
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=180, stale-while-revalidate=360",
      );

      return response;
    }

    // Use optimized service with caching when service role key is available
    const { data: result, error } =
      await collegeProfileServiceEnhanced.getCollegesPaginated({
        state: state || undefined,
        type: type || undefined,
        search: search || undefined,
        limit,
        offset,
      });

    if (error) {
      console.error("Error fetching colleges:", error);
      return NextResponse.json(
        { error: `Failed to fetch colleges: ${typeof error === 'string' ? error : 'Unknown error'}` },
        { status: 500 },
      );
    }

    // Return the colleges array directly for client compatibility
    const response = NextResponse.json({
      data: Array.isArray(result) ? result : (result?.colleges || []),
      total: Array.isArray(result) ? result.length : (result?.total || 0),
      hasMore: Array.isArray(result) ? false : (result?.hasMore || false)
    });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=180, stale-while-revalidate=360",
    );

    return response;
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Check if user is authenticated and is admin
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Validate required fields
    const { name, type, location, address } = body;

    if (!name || !type || !location || !address) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, location, address" },
        { status: 400 },
      );
    }

    // Insert new college
    const { data: college, error } = await supabase
      .from("colleges")
      .insert({
        name,
        type,
        location,
        address,
        website: body.website || null,
        phone: body.phone || null,
        email: body.email || null,
        established_year: body.established_year || null,
        accreditation: body.accreditation || null,
        facilities: body.facilities || null,
        programs: body.programs || null,
        is_verified: false, // New colleges need verification
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating college:", error);
      return NextResponse.json(
        { error: "Failed to create college" },
        { status: 500 },
      );
    }

    return NextResponse.json(college, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
