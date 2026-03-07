import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/lib/supabase/types";
import { handleNewApplicationNotification } from "@/lib/services/application-notification-service";
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

    const { id: applicationId } = await params;
    const body = await request.json();
    const { documents } = body;

    if (!documents || typeof documents !== "object") {
      return NextResponse.json(
        { error: "Invalid documents data" },
        { status: 400 },
      );
    }

    // Verify the application belongs to the current user and get college info
    const { data: existingApplication, error: fetchError } = await supabase
      .from("student_applications")
      .select(
        `
        student_id, 
        status, 
        college_id,
        full_name,
        email,
        colleges!inner (
          id,
          name
        )
      `,
      )
      .eq("id", applicationId)
      .single();

    if (fetchError || !existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    if (existingApplication.student_id !== user.id) {
      return NextResponse.json(
        { error: "Access denied. This application does not belong to you." },
        { status: 403 },
      );
    }

    // Only allow document updates for rejected applications
    if (existingApplication.status !== "rejected") {
      return NextResponse.json(
        { error: "Documents can only be updated for rejected applications" },
        { status: 400 },
      );
    }

    // Update the application with new documents and reset status to pending
    const { data: updatedApplication, error: updateError } = await supabase
      .from("student_applications")
      .update({
        documents,
        status: "pending",
        reviewed_at: null,
        reviewed_by: null,
        feedback: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating application documents:", updateError);
      return NextResponse.json(
        { error: "Failed to update documents" },
        { status: 500 },
      );
    }

    // Send comprehensive notifications to college about document update
    try {
      const college = existingApplication.colleges;
      const notificationResult = await handleNewApplicationNotification({
        collegeId: (college as unknown as { id: string }).id,
        collegeName: (college as unknown as { name: string }).name,
        studentName: existingApplication.full_name,
        studentEmail: existingApplication.email,
        applicationId,
        action: "document_updated",
      });

      if (!notificationResult.success && notificationResult.errors.length > 0) {
        console.warn(
          "Some college notifications failed:",
          notificationResult.errors,
        );
      }
    } catch (notificationError) {
      console.error("Error sending college notifications:", notificationError);
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json({
      success: true,
      data: updatedApplication,
      message:
        "Documents updated successfully. Application status reset to pending.",
    });
  } catch (error) {
    console.error("Unexpected error in update documents API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
