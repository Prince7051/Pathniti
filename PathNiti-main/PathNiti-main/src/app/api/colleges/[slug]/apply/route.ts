import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { collegeProfileService } from "@/lib/services/college-profile-service";
import { handleNewApplicationNotification } from "@/lib/services/application-notification-service";
import { APIValidator, ValidationSchemas } from "@/lib/utils/api-validation";
import { APIErrorHandler } from "@/lib/utils/api-error-handling";
import type { StudentApplicationInsert } from "@/lib/supabase/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const errorContext = {
    endpoint: "/api/colleges/[slug]/apply",
    method: "POST",
  };

  try {
    const supabase = createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return APIErrorHandler.createAuthErrorResponse(
      "Please log in to submit an application",
      errorContext,
    );
  }

  // Verify user is a student
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    const parsedError = APIErrorHandler.parseSupabaseError(profileError);
    return APIErrorHandler.createErrorResponse(
      parsedError.message,
      parsedError.statusCode,
      errorContext,
    );
  }

  if (profile?.role !== "student") {
    return APIErrorHandler.createAuthorizationErrorResponse(
      "Student role required to submit applications",
      errorContext,
    );
  }

  // Get college by slug
  const resolvedParams = await params;
  const { data: college, error: collegeError } =
    await collegeProfileService.getProfileBySlug(resolvedParams.slug);

  if (collegeError || !college) {
    return APIErrorHandler.createNotFoundErrorResponse("College", errorContext);
  }

  // Validate request body
  const validation = await APIValidator.validateRequestBody(
    request,
    ValidationSchemas.studentApplication,
  );

  if (!validation.isValid) {
    return APIErrorHandler.createValidationErrorResponse(
      validation.errors,
      errorContext,
    );
  }

  const sanitizedData = validation.sanitizedData;

  // Check if user already has a pending or approved application for this college
  const { data: existingApplication, error: checkError } = await supabase
    .from("student_applications")
    .select("id, status")
    .eq("student_id", user.id)
    .eq("college_id", college.id)
    .in("status", ["pending", "approved"])
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    const parsedError = APIErrorHandler.parseSupabaseError(checkError);
    return APIErrorHandler.createErrorResponse(
      parsedError.message,
      parsedError.statusCode,
      errorContext,
    );
  }

  if (existingApplication) {
    return APIErrorHandler.createConflictErrorResponse(
      `You already have a ${existingApplication.status} application for this college`,
      errorContext,
    );
  }

  // Create application record
  const applicationData: StudentApplicationInsert = {
    student_id: user.id,
    college_id: college.id,
    full_name: sanitizedData.full_name as string,
    email: sanitizedData.email as string,
    phone: sanitizedData.phone as string,
    class_stream: sanitizedData.class_stream as string,
    documents: sanitizedData.documents as { academic_documents: string[]; identity_documents: string[]; other_documents?: string[] },
    status: "pending",
    submitted_at: new Date().toISOString(),
  };

  const { data: application, error: insertError } = await supabase
    .from("student_applications")
    .insert(applicationData)
    .select()
    .single();

  if (insertError) {
    const parsedError = APIErrorHandler.parseSupabaseError(insertError);
    return APIErrorHandler.createErrorResponse(
      parsedError.message,
      parsedError.statusCode,
      errorContext,
    );
  }

  // Send comprehensive notifications to college (in-app and email)
  try {
    const notificationResult = await handleNewApplicationNotification({
      collegeId: college.id,
      collegeName: college.name,
      studentName: sanitizedData.full_name as string,
      studentEmail: sanitizedData.email as string,
      applicationId: application.id,
      action: "new_application",
    });

    if (!notificationResult.success && notificationResult.errors.length > 0) {
      console.warn(
        "Some college notifications failed:",
        notificationResult.errors,
      );
    }
  } catch (notificationError) {
    // Don't fail the application if notification fails
    console.error("Error sending college notifications:", notificationError);
  }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      data: {
        id: application.id,
        status: application.status,
        submitted_at: application.submitted_at,
        college_name: college.name,
        college_slug: college.slug,
      },
    });
  } catch (error) {
    console.error("Error in student application API:", error);
    return APIErrorHandler.createServerErrorResponse(error as Error, errorContext);
  }
}


// Handle unsupported methods
export async function GET() {
  return APIErrorHandler.createErrorResponse("Method not allowed", 405);
}

export async function PUT() {
  return APIErrorHandler.createErrorResponse("Method not allowed", 405);
}

export async function DELETE() {
  return APIErrorHandler.createErrorResponse("Method not allowed", 405);
}
