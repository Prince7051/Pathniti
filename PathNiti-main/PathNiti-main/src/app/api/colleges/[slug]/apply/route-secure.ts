import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { collegeProfileService } from "@/lib/services/college-profile-service";
import { handleNewApplicationNotification } from "@/lib/services/application-notification-service";
import { APIValidator, ValidationSchemas } from "@/lib/utils/api-validation";
import { APIErrorHandler } from "@/lib/utils/api-error-handling";
import {
  withAuth,
  withRateLimit,
  AuthContext,
} from "@/lib/auth/security-middleware";
import { auditLogger, extractAuditContext } from "@/lib/security/audit-logger";
// import { secureFileUpload, FILE_SECURITY_CONFIGS } from '@/lib/security/file-security'
import type { StudentApplicationInsert } from "@/lib/supabase/types";

async function handleStudentApplication(
  request: NextRequest,
  authContext: AuthContext,
  params?: Record<string, unknown>,
) {
  const supabase = createClient();
  const auditContext = extractAuditContext(request, authContext.user?.id);

  try {
    // Log the application attempt
    await auditLogger.log({
      userId: authContext.user?.id,
      action: "application.submit_attempt",
      tableName: "student_applications",
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      metadata: { collegeSlug: params?.slug },
    });

    // Get college by slug
    const slug = params?.slug as string;
    if (!slug) {
      return APIErrorHandler.createNotFoundErrorResponse("College");
    }

    const { data: college, error: collegeError } =
      await collegeProfileService.getProfileBySlug(slug);

    if (collegeError || !college) {
      await auditLogger.logSecurityEvent("unauthorized_access", auditContext, {
        reason: "Invalid college slug",
        slug: slug,
      });
      return APIErrorHandler.createNotFoundErrorResponse("College");
    }

    // Validate request body
    const validation = await APIValidator.validateRequestBody(
      request,
      ValidationSchemas.studentApplication,
    );

    if (!validation.isValid) {
      await auditLogger.log({
        userId: authContext.user?.id,
        action: "application.validation_failed",
        tableName: "student_applications",
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        metadata: { errors: validation.errors },
      });
      return APIErrorHandler.createValidationErrorResponse(validation.errors);
    }

    const sanitizedData = validation.sanitizedData;

    // Check if user already has a pending or approved application for this college
    const { data: existingApplication, error: checkError } = await supabase
      .from("student_applications")
      .select("id, status")
      .eq("student_id", authContext.user!.id)
      .eq("college_id", college.id)
      .in("status", ["pending", "approved"])
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      const parsedError = APIErrorHandler.parseSupabaseError(checkError);
      return APIErrorHandler.createErrorResponse(
        parsedError.message,
        parsedError.statusCode,
      );
    }

    if (existingApplication) {
      await auditLogger.log({
        userId: authContext.user?.id,
        action: "application.duplicate_attempt",
        tableName: "student_applications",
        recordId: existingApplication.id,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        metadata: { existingStatus: existingApplication.status },
      });
      return APIErrorHandler.createConflictErrorResponse(
        `You already have a ${existingApplication.status} application for this college`,
      );
    }

    // Validate and secure file uploads if present
    if (sanitizedData.documents) {
      for (const [docType, fileUrl] of Object.entries(
        sanitizedData.documents,
      )) {
        if (typeof fileUrl === "string" && fileUrl) {
          // Log file access for audit
          await auditLogger.logFileOperation("upload", fileUrl, auditContext, {
            documentType: docType,
            applicationContext: "student_application",
          });
        }
      }
    }

    // Create application record
    const applicationData: StudentApplicationInsert = {
      student_id: authContext.user!.id,
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
      await auditLogger.log({
        userId: authContext.user?.id,
        action: "application.submit_failed",
        tableName: "student_applications",
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        metadata: { error: insertError.message },
      });
      const parsedError = APIErrorHandler.parseSupabaseError(insertError);
      return APIErrorHandler.createErrorResponse(
        parsedError.message,
        parsedError.statusCode,
      );
    }

    // Log successful application submission
    await auditLogger.logDataModification(
      "create",
      "student_applications",
      application.id,
      auditContext,
      undefined,
      {
        college_id: college.id,
        college_name: college.name,
        status: "pending",
      },
    );

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
    // Log unexpected errors
    await auditLogger.log({
      userId: authContext.user?.id,
      action: "application.submit_error",
      tableName: "student_applications",
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
        collegeSlug: params?.slug,
      },
    });
    throw error;
  }
}

// Export the wrapped handler with security middleware
export const POST = withAuth(
  withRateLimit(handleStudentApplication, {
    maxRequests: 5, // 5 applications per window
    windowMs: 60 * 60 * 1000, // 1 hour
    keyGenerator: (request, context) =>
      `apply:${context.user?.id || request.headers.get("x-forwarded-for") || "unknown"}`,
  }),
  {
    roles: "student",
    requireAuth: true,
  },
);

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
