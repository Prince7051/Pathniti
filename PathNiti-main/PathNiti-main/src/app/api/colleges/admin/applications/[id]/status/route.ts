import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApplicationStatusChange } from "@/lib/services/application-notification-service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createClient();
    const resolvedParams = await params;
    const applicationId = resolvedParams.id;

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has college role
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

    // Get college information from college_profiles
    const { data: collegeProfile } = await supabase
      .from("college_profiles")
      .select(
        `
        college_id,
        colleges!inner (
          id,
          name
        )
      `,
      )
      .eq("id", session.user.id)
      .single();

    if (!collegeProfile) {
      return NextResponse.json(
        { error: "College profile not found" },
        { status: 404 },
      );
    }

    const college = {
      id: collegeProfile.college_id,
      name: collegeProfile.colleges?.[0]?.name || "Unknown College",
    };

    // Parse request body
    const body = await request.json();
    const { status, feedback } = body;

    // Validate status
    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be approved, rejected, or pending" },
        { status: 400 },
      );
    }

    // Verify the application belongs to this college
    const { data: existingApplication, error: fetchError } = await supabase
      .from("student_applications")
      .select("college_id, student_id, status")
      .eq("id", applicationId)
      .single();

    if (fetchError || !existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    if (existingApplication.college_id !== college.id) {
      return NextResponse.json(
        { error: "Forbidden - Application does not belong to your college" },
        { status: 403 },
      );
    }

    // Update application status
    const updateData: {
      status: string;
      reviewed_at: string;
      reviewed_by: string;
      updated_at: string;
      feedback?: string;
    } = {
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
      updated_at: new Date().toISOString(),
    };

    if (feedback) {
      updateData.feedback = feedback;
    }

    const { data: updatedApplication, error: updateError } = await supabase
      .from("student_applications")
      .update(updateData)
      .eq("id", applicationId)
      .select(
        `
        *,
        profiles!student_applications_student_id_fkey (
          first_name,
          last_name,
          email
        )
      `,
      )
      .single();

    if (updateError) {
      console.error("Error updating application:", updateError);
      return NextResponse.json(
        { error: "Failed to update application" },
        { status: 500 },
      );
    }

    // Send comprehensive notifications (in-app and email)
    try {
      const studentProfile = updatedApplication.profiles;
      const studentName = `${studentProfile.first_name} ${studentProfile.last_name}`;

      const notificationResult = await handleApplicationStatusChange({
        applicationId,
        studentId: existingApplication.student_id,
        collegeId: college.id,
        collegeName: college.name,
        studentName,
        studentEmail: studentProfile.email,
        oldStatus: existingApplication.status,
        newStatus: status,
        feedback,
        reviewedBy: session.user.id,
      });

      if (!notificationResult.success && notificationResult.errors.length > 0) {
        console.warn("Some notifications failed:", notificationResult.errors);
      }
    } catch (notificationError) {
      // Don't fail the request if notification creation fails
      console.warn("Failed to send notifications:", notificationError);
    }

    return NextResponse.json({
      message: "Application status updated successfully",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Error in application status update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
