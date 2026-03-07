import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Force this route to be dynamic
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = request.nextUrl;

    // Get query parameters
    const type = searchParams.get("type");
    const stream = searchParams.get("stream");
    const classLevel = searchParams.get("class_level");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("admission_deadlines")
      .select("*")
      .eq("is_active", true)
      .order("deadline_date");

    // Apply filters
    if (type) {
      query = query.eq("deadline_type", type);
    }

    if (stream) {
      query = query.eq("stream", stream);
    }

    if (classLevel) {
      query = query.eq("class_level", classLevel);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: events, error, count } = await query;

    if (error) {
      console.error("Error fetching timeline events:", error);
      return NextResponse.json(
        { error: "Failed to fetch timeline events" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      events,
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
    const { title, deadline_date, deadline_type } = body;

    if (!title || !deadline_date || !deadline_type) {
      return NextResponse.json(
        {
          error: "Missing required fields: title, deadline_date, deadline_type",
        },
        { status: 400 },
      );
    }

    // Insert new timeline event
    const { data: event, error } = await supabase
      .from("admission_deadlines")
      .insert({
        title,
        deadline_date,
        deadline_type,
        description: body.description || null,
        college_id: body.college_id || null,
        program_id: body.program_id || null,
        stream: body.stream || null,
        class_level: body.class_level || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating timeline event:", error);
      return NextResponse.json(
        { error: "Failed to create timeline event" },
        { status: 500 },
      );
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
