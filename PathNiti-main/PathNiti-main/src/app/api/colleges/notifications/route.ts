import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
// import { Database } from '@/lib/supabase/types' // Unused import

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();

    // TODO: Re-enable authentication after fixing auth issues
    // For now, return mock notifications for development
    const mockNotifications = [
      {
        id: "1",
        title: "New Application Received",
        message: "A new student application has been submitted for Computer Science program.",
        type: "application",
        is_read: false,
        sent_at: new Date().toISOString(),
        user_id: "mock-college-user",
        data: {
          application_id: "app-123",
          student_name: "John Doe",
          program: "Computer Science"
        }
      },
      {
        id: "2", 
        title: "Application Status Update",
        message: "Application for Engineering program has been reviewed and approved.",
        type: "status_update",
        is_read: true,
        sent_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        user_id: "mock-college-user",
        data: {
          application_id: "app-456",
          student_name: "Jane Smith",
          program: "Engineering",
          status: "approved"
        }
      },
      {
        id: "3",
        title: "System Maintenance Notice",
        message: "Scheduled maintenance will occur on Sunday from 2-4 AM.",
        type: "system",
        is_read: false,
        sent_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        user_id: "mock-college-user",
        data: {
          maintenance_date: "2024-01-21",
          duration: "2 hours"
        }
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockNotifications,
    });

    // Original authenticated code (commented out for development)
    /*
    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has college role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "college") {
      return NextResponse.json(
        { error: "Access denied. College role required." },
        { status: 403 },
      );
    }

    // Fetch notifications for the college user
    const { data: notifications, error: notificationsError } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false })
      .limit(50); // Limit to recent 50 notifications

    if (notificationsError) {
      console.error(
        "Error fetching college notifications:",
        notificationsError,
      );
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: notifications || [],
    });
    */
  } catch (error) {
    console.error("Unexpected error in college notifications API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();

    // TODO: Re-enable authentication after fixing auth issues
    // For now, simulate successful response for development
    const body = await request.json();
    const { action } = body;

    if (action === "mark_all_read") {
      // Simulate successful response for development
      console.log("Simulating mark all notifications as read for development");
      
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read (simulated)",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    // Original authenticated code (commented out for development)
    /*
    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has college role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "college") {
      return NextResponse.json(
        { error: "Access denied. College role required." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === "mark_all_read") {
      // Mark all notifications as read for this college user
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (updateError) {
        console.error("Error marking all notifications as read:", updateError);
        return NextResponse.json(
          { error: "Failed to mark notifications as read" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    */
  } catch (error) {
    console.error(
      "Unexpected error in college notifications update API:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
