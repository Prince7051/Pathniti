import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = request.nextUrl;

    // Get query parameters
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("scholarships")
      .select("*")
      .eq("is_active", true)
      .order("name");

    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,provider.ilike.%${search}%,description.ilike.%${search}%`,
      );
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: scholarships, error, count } = await query;

    if (error) {
      console.error("Error fetching scholarships:", error);
      return NextResponse.json(
        { error: "Failed to fetch scholarships" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      scholarships,
      total: count,
      limit,
      offset,
    });
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
    const { name, provider } = body;

    if (!name || !provider) {
      return NextResponse.json(
        { error: "Missing required fields: name, provider" },
        { status: 400 },
      );
    }

    // Insert new scholarship
    const { data: scholarship, error } = await supabase
      .from("scholarships")
      .insert({
        name,
        provider,
        description: body.description || null,
        amount: body.amount || null,
        eligibility: body.eligibility || null,
        application_deadline: body.application_deadline || null,
        application_process: body.application_process || null,
        documents_required: body.documents_required || null,
        website: body.website || null,
        contact_info: body.contact_info || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating scholarship:", error);
      return NextResponse.json(
        { error: "Failed to create scholarship" },
        { status: 500 },
      );
    }

    return NextResponse.json(scholarship, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
