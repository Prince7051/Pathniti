import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createClient();
    const body = await request.json();
    const { id: noticeId } = await params;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is college admin and owns this notice
    const { data: profile } = await supabase
      .from("college_profiles")
      .select("college_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if notice exists and belongs to this college
    const { data: existingNotice } = await supabase
      .from("college_notices")
      .select("college_id")
      .eq("id", noticeId)
      .single();

    if (!existingNotice || existingNotice.college_id !== profile.college_id) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    // Validate fields
    const { title, content, type, expires_at, is_active } = body;

    if (title && !title.trim()) {
      return NextResponse.json(
        {
          error: "Title cannot be empty",
        },
        { status: 400 },
      );
    }

    if (content && !content.trim()) {
      return NextResponse.json(
        {
          error: "Content cannot be empty",
        },
        { status: 400 },
      );
    }

    if (type) {
      const validTypes = ["general", "admission", "event", "urgent"];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          {
            error: "Invalid notice type",
          },
          { status: 400 },
        );
      }
    }

    // Prepare update data
    const updateData: {
      title?: string;
      content?: string;
      type?: string;
      priority?: string;
      expires_at?: string;
      is_active?: boolean;
      updated_at: string;
    } = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (type !== undefined) updateData.type = type;
    if (expires_at !== undefined) updateData.expires_at = expires_at;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update notice
    const { data: notice, error } = await supabase
      .from("college_notices")
      .update(updateData)
      .eq("id", noticeId)
      .select()
      .single();

    if (error) {
      console.error("Error updating notice:", error);
      return NextResponse.json(
        { error: "Failed to update notice" },
        { status: 500 },
      );
    }

    return NextResponse.json({ notice });
  } catch (error) {
    console.error("Error in PUT /api/colleges/admin/notices/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createClient();
    const { id: noticeId } = await params;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is college admin and owns this notice
    const { data: profile } = await supabase
      .from("college_profiles")
      .select("college_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if notice exists and belongs to this college
    const { data: existingNotice } = await supabase
      .from("college_notices")
      .select("college_id")
      .eq("id", noticeId)
      .single();

    if (!existingNotice || existingNotice.college_id !== profile.college_id) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    // Delete notice
    const { error } = await supabase
      .from("college_notices")
      .delete()
      .eq("id", noticeId);

    if (error) {
      console.error("Error deleting notice:", error);
      return NextResponse.json(
        { error: "Failed to delete notice" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Notice deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/colleges/admin/notices/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
