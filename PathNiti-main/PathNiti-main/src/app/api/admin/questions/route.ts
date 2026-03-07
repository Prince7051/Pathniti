import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const grade = searchParams.get("grade");
    const subject = searchParams.get("subject");
    const limit = parseInt(searchParams.get("limit") || "50");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    let query = supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status === "pending") {
      query = query.eq("pending_review", true);
    } else if (status === "approved") {
      query = query.eq("is_active", true);
    } else if (status === "rejected") {
      query = query.eq("is_active", false).eq("pending_review", false);
    }

    if (grade) {
      query = query.eq("grade", parseInt(grade));
    }

    if (subject) {
      query = query.eq("subject", subject);
    }

    const { data: questions, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      questions: questions || [],
      count: questions?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching questions for admin:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { question_id, action, feedback } = await request.json();

    if (!question_id || !action) {
      return NextResponse.json(
        { error: "Question ID and action are required" },
        { status: 400 },
      );
    }

    const validActions = ["approve", "reject", "needs_revision"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be approve, reject, or needs_revision" },
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

    // Update question based on action
    const updateData: {
      pending_review: boolean;
      approved_by: string;
      approved_at: string;
      is_active?: boolean;
      admin_feedback?: string;
    } = {
      pending_review: false,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    };

    if (action === "approve") {
      updateData.is_active = true;
    } else if (action === "reject") {
      updateData.is_active = false;
    } else if (action === "needs_revision") {
      updateData.pending_review = true;
    }

    const { error: updateError } = await supabase
      .from("questions")
      .update(updateData)
      .eq("question_id", question_id);

    if (updateError) {
      throw new Error(`Failed to update question: ${updateError.message}`);
    }

    // Log approval action
    const { error: logError } = await supabase
      .from("question_approvals")
      .insert({
        question_id,
        reviewer_id: user.id,
        status:
          action === "approve"
            ? "approved"
            : action === "reject"
              ? "rejected"
              : "needs_revision",
        feedback,
      });

    if (logError) {
      console.warn("Failed to log approval action:", logError);
    }

    return NextResponse.json({
      success: true,
      message: `Question ${action}d successfully`,
      question_id,
    });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { question_id } = await request.json();

    if (!question_id) {
      return NextResponse.json(
        { error: "Question ID is required" },
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

    // Delete question
    const { error: deleteError } = await supabase
      .from("questions")
      .delete()
      .eq("question_id", question_id);

    if (deleteError) {
      throw new Error(`Failed to delete question: ${deleteError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully",
      question_id,
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 },
    );
  }
}
