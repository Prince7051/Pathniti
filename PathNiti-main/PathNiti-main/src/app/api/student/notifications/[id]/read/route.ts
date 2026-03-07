import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/lib/supabase/types";
// import type { RouteContext } from "next/dist/server/future/route-modules/route-module"; // Temporarily disabled

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a student
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "student") {
      return NextResponse.json(
        { error: "Access denied. Student role required." },
        { status: 403 },
      );
    }

    const { id: notificationId } = await params;

    // Verify the notification belongs to the current user and mark as read
    const { data: updatedNotification, error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error marking notification as read:", updateError);
      return NextResponse.json(
        { error: "Failed to mark notification as read" },
        { status: 500 },
      );
    }

    if (!updatedNotification) {
      return NextResponse.json(
        { error: "Notification not found or access denied" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedNotification,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Unexpected error in mark notification as read API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
