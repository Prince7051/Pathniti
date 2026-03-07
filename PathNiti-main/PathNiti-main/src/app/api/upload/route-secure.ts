import { NextRequest, NextResponse } from "next/server";
import {
  createServerDocumentStorageService,
  type StorageBucket,
  type DocumentType,
} from "@/lib/services/document-storage-service";
import { validateFileComprehensive } from "@/lib/utils/file-validation";
import {
  withAuth,
  withRateLimit,
  AuthContext,
} from "@/lib/auth/security-middleware";
import { auditLogger, extractAuditContext } from "@/lib/security/audit-logger";
import { secureFileUpload } from '@/lib/security/file-security';
import { SECURITY_CONFIG } from "@/lib/security/config";

async function handleFileUpload(
  request: NextRequest,
  authContext: AuthContext,
) {
  const auditContext = extractAuditContext(request, authContext.user?.id);
  const serverDocumentStorageService = createServerDocumentStorageService();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bucket = formData.get("bucket") as string;
    const folder = formData.get("folder") as string;
    const documentType = formData.get("documentType") as string;
    const applicationId = formData.get("applicationId") as string;
    const collegeId = formData.get("collegeId") as string;
    const replaceExisting = formData.get("replaceExisting") === "true";

    // Log file upload attempt
    await auditLogger.logFileOperation(
      "upload",
      file?.name || "unknown",
      auditContext,
      {
        bucket,
        folder,
        documentType,
        fileSize: file?.size,
        mimeType: file?.type,
      },
    );

    if (!file) {
      await auditLogger.logSecurityEvent("suspicious_activity", auditContext, {
        reason: "File upload without file",
        endpoint: "/api/upload",
      });
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!bucket || !folder) {
      return NextResponse.json(
        { error: "Missing required fields: bucket and folder are required" },
        { status: 400 },
      );
    }

    // Validate bucket type
    const validBuckets: StorageBucket[] = [
      "student-documents",
      "college-documents",
      "profile-images",
    ];
    if (!validBuckets.includes(bucket as StorageBucket)) {
      await auditLogger.logSecurityEvent("suspicious_activity", auditContext, {
        reason: "Invalid bucket specified",
        bucket,
        validBuckets,
      });
      return NextResponse.json(
        { error: "Invalid bucket. Must be one of: " + validBuckets.join(", ") },
        { status: 400 },
      );
    }

    // Determine security config based on document type
    const securityConfig = {
      maxFileSize: SECURITY_CONFIG.fileUpload.maxFileSize,
      allowedMimeTypes: [...SECURITY_CONFIG.fileUpload.allowedMimeTypes],
      allowedExtensions: [...SECURITY_CONFIG.fileUpload.allowedExtensions],
      scanForViruses: SECURITY_CONFIG.fileUpload.scanForViruses,
    };
    // Use the same config for all document types for now
    // if (bucket === "profile-images") {
    //   securityConfig = SECURITY_CONFIG.fileUpload;
    // } else if (
    //   documentType &&
    //   ["photo", "image"].includes(documentType.toLowerCase())
    // ) {
    //   securityConfig = SECURITY_CONFIG.fileUpload;
    // }

    // Enhanced security validation
    const securityResult = await secureFileUpload(file, securityConfig, {
      generateUniqueFileName: true,
      preserveOriginalName: false,
    });

    if (!securityResult.success) {
      await auditLogger.logSecurityEvent("malware_detected", auditContext, {
        fileName: file.name,
        errors: securityResult.errors,
        virusScanResult: securityResult.virusScanResult,
      });
      return NextResponse.json(
        {
          error: "File security validation failed",
          details: securityResult.errors,
          warnings: securityResult.warnings,
        },
        { status: 400 },
      );
    }

    // Create secure file with new name
    const secureFile = new File([file], securityResult.fileName!, {
      type: file.type,
    });

    // Comprehensive file validation (existing validation)
    const validation = await validateFileComprehensive(secureFile);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Validate upload permissions with enhanced checks
    const permissionCheck =
      await serverDocumentStorageService.validateUploadPermissions(
        bucket as StorageBucket,
        {
          bucket: bucket as StorageBucket,
          folder,
          documentType: documentType as DocumentType,
          applicationId,
          collegeId,
          replaceExisting,
        },
      );

    if (!permissionCheck.allowed) {
      await auditLogger.logSecurityEvent("unauthorized_access", auditContext, {
        reason: "Upload permission denied",
        bucket,
        folder,
        documentType,
        error: permissionCheck.error,
      });
      return NextResponse.json(
        { error: permissionCheck.error || "Upload not allowed" },
        { status: 403 },
      );
    }

    // Additional role-based validation
    if (
      bucket === "college-documents" &&
      !authContext.hasRole(["college", "admin"])
    ) {
      await auditLogger.logSecurityEvent("unauthorized_access", auditContext, {
        reason: "Insufficient role for college documents",
        userRole: authContext.user?.role,
        requiredRoles: ["college", "admin"],
      });
      return NextResponse.json(
        { error: "Insufficient permissions for college documents" },
        { status: 403 },
      );
    }

    if (
      bucket === "student-documents" &&
      !authContext.hasRole(["student", "admin"])
    ) {
      await auditLogger.logSecurityEvent("unauthorized_access", auditContext, {
        reason: "Insufficient role for student documents",
        userRole: authContext.user?.role,
        requiredRoles: ["student", "admin"],
      });
      return NextResponse.json(
        { error: "Insufficient permissions for student documents" },
        { status: 403 },
      );
    }

    // Upload file using document storage service
    const result = await serverDocumentStorageService.uploadFile(secureFile, {
      bucket: bucket as StorageBucket,
      folder,
      documentType: documentType as DocumentType,
      applicationId: applicationId || undefined,
      collegeId: collegeId || undefined,
      replaceExisting,
    });

    if (!result.success) {
      await auditLogger.log({
        userId: authContext.user?.id,
        action: "file.upload_failed",
        tableName: "documents",
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        metadata: {
          fileName: secureFile.name,
          error: result.error,
        },
      });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Log successful upload
    await auditLogger.logFileOperation(
      "upload",
      secureFile.name,
      auditContext,
      {
        bucket,
        folder,
        documentType,
        fileSize: file.size,
        fileHash: securityResult.fileHash,
        documentId: result.data?.id,
        virusScanClean: securityResult.virusScanResult?.isClean,
      },
    );

    // Return success response with security info
    const response: {
      success: boolean;
      data: {
        id: string;
        filename: string;
        size: number;
        mimeType: string;
        securityInfo: {
          fileHash: string;
          virusScanClean: boolean;
          scanTimestamp: string;
        };
      };
    } = {
      success: true,
      data: {
        ...result.data,
        id: result.data?.id || "temp-id",
        filename: result.data?.fileName || file.name,
        size: result.data?.fileSize || file.size,
        mimeType: result.data?.fileType || file.type,
        securityInfo: {
          fileHash: securityResult.fileHash || "",
          virusScanClean: securityResult.virusScanResult?.isClean || false,
          scanTimestamp: new Date().toISOString(),
        },
      },
    };

    // if (validation.warnings && validation.warnings.length > 0) {
    //   response.warnings = validation.warnings;
    // }

    // if (securityResult.warnings && securityResult.warnings.length > 0) {
    //   response.securityWarnings = securityResult.warnings;
    // }

    return NextResponse.json(response);
  } catch (error) {
    await auditLogger.log({
      userId: authContext.user?.id,
      action: "file.upload_error",
      tableName: "documents",
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    console.error("Unexpected error in secure upload API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleFileDelete(
  request: NextRequest,
  authContext: AuthContext,
) {
  const auditContext = extractAuditContext(request, authContext.user?.id);
  const serverDocumentStorageService = createServerDocumentStorageService();

  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 },
      );
    }

    // Log delete attempt
    await auditLogger.logFileOperation("delete", documentId, auditContext, {
      documentId,
    });

    const result = await serverDocumentStorageService.deleteFile(documentId);

    if (!result.success) {
      await auditLogger.log({
        userId: authContext.user?.id,
        action: "file.delete_failed",
        tableName: "documents",
        recordId: documentId,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        metadata: { error: result.error },
      });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Log successful deletion
    await auditLogger.logDataModification(
      "delete",
      "documents",
      documentId,
      auditContext,
    );

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    await auditLogger.log({
      userId: authContext.user?.id,
      action: "file.delete_error",
      tableName: "documents",
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      metadata: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    console.error("Unexpected error in secure delete API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleFileList(request: NextRequest, authContext: AuthContext) {
  const auditContext = extractAuditContext(request, authContext.user?.id);
  const serverDocumentStorageService = createServerDocumentStorageService();

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const applicationId = searchParams.get("applicationId");
    const collegeId = searchParams.get("collegeId");
    const documentType = searchParams.get("documentType");
    const isActive = searchParams.get("isActive");

    // Validate access to user documents
    if (
      userId &&
      userId !== authContext.user?.id &&
      !authContext.hasRole(["admin"])
    ) {
      await auditLogger.logSecurityEvent("unauthorized_access", auditContext, {
        reason: "Attempted to access other user documents",
        requestedUserId: userId,
        actualUserId: authContext.user?.id,
      });
      return NextResponse.json(
        { error: "Unauthorized access to user documents" },
        { status: 403 },
      );
    }

    // Log data access
    await auditLogger.logDataAccess("read", "documents", auditContext, {
      userId,
      applicationId,
      collegeId,
      documentType,
    });

    const filters: {
      documentType?: DocumentType;
      applicationId?: string;
      collegeId?: string;
      isActive?: boolean;
    } = {};
    if (documentType) filters.documentType = documentType as DocumentType;
    if (applicationId) filters.applicationId = applicationId;
    if (collegeId) filters.collegeId = collegeId;
    if (isActive !== null) filters.isActive = isActive === "true";

    const result = await serverDocumentStorageService.getUserDocuments(
      userId || undefined,
      filters,
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Unexpected error in secure documents list API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Export secured endpoints with rate limiting
export const POST = withAuth(
  withRateLimit(handleFileUpload, {
    maxRequests: SECURITY_CONFIG.rateLimiting.api.upload.maxRequests,
    windowMs: SECURITY_CONFIG.rateLimiting.api.upload.windowMs,
    keyGenerator: (request, context) =>
      `upload:${context.user?.id || request.headers.get('x-forwarded-for') || 'unknown'}`,
  }),
  { requireAuth: true },
);

export const DELETE = withAuth(
  withRateLimit(handleFileDelete, {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 20 deletes per hour
    keyGenerator: (request, context) =>
      `delete:${context.user?.id || request.headers.get('x-forwarded-for') || 'unknown'}`,
  }),
  { requireAuth: true },
);

export const GET = withAuth(
  withRateLimit(handleFileList, {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 100 requests per 15 minutes
    keyGenerator: (request, context) =>
      `list:${context.user?.id || request.headers.get('x-forwarded-for') || 'unknown'}`,
  }),
  { requireAuth: true },
);
