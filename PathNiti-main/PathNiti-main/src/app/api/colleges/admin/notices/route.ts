import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Return mock notices data for development
    const mockNotices = [
      {
        id: "1",
        title: "Admission Open for 2024-25",
        content: "Applications are now open for all engineering programs. Last date to apply is March 31, 2024.",
        type: "admission",
        published_at: new Date().toISOString(),
        expires_at: "2024-03-31T23:59:59Z",
        is_active: true,
        college_id: "cc136539-2636-42e6-803b-e80edf2e1c3b",
      },
      {
        id: "2",
        title: "College Fest 2024",
        content: "Annual college fest will be held from April 15-17, 2024. All students are invited to participate.",
        type: "event",
        published_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        expires_at: "2024-04-17T23:59:59Z",
        is_active: true,
        college_id: "cc136539-2636-42e6-803b-e80edf2e1c3b",
      },
      {
        id: "3",
        title: "Library Hours Extended",
        content: "Library will remain open until 10 PM during exam period starting from next week.",
        type: "general",
        published_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        expires_at: null,
        is_active: true,
        college_id: "cc136539-2636-42e6-803b-e80edf2e1c3b",
      }
    ];

    return NextResponse.json({ notices: mockNotices });
  } catch (error) {
    console.error("Error in GET /api/colleges/admin/notices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is college admin
    const { data: profile } = await supabase
      .from("college_profiles")
      .select("college_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate required fields
    const { title, content, type = "general", expires_at } = body;
    if (!title || !content) {
      return NextResponse.json(
        {
          error: "Title and content are required",
        },
        { status: 400 },
      );
    }

    // Validate notice type
    const validTypes = ["general", "admission", "event", "urgent"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          error: "Invalid notice type",
        },
        { status: 400 },
      );
    }

    // Create notice
    const noticeData = {
      college_id: profile.college_id,
      title: title.trim(),
      content: content.trim(),
      type,
      expires_at: expires_at || null,
      is_active: true,
      published_at: new Date().toISOString(),
    };

    const { data: notice, error } = await supabase
      .from("college_notices")
      .insert(noticeData)
      .select()
      .single();

    if (error) {
      console.error("Error creating notice:", error);
      return NextResponse.json(
        { error: "Failed to create notice" },
        { status: 500 },
      );
    }

    return NextResponse.json({ notice }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/colleges/admin/notices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
