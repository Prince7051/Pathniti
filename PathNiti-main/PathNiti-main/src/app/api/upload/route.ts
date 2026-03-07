import { NextRequest, NextResponse } from "next/server";
import {
  createServerDocumentStorageService,
  type StorageBucket,
  type DocumentType,
} from "@/lib/services/document-storage-service";
import {
  validateFileComprehensive,
  sanitizeFileName,
} from "@/lib/utils/file-validation";

export async function POST(request: NextRequest) {
  try {
    const serverDocumentStorageService = createServerDocumentStorageService();
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bucket = formData.get("bucket") as string;
    const folder = formData.get("folder") as string;
    const documentType = formData.get("documentType") as string;
    const applicationId = formData.get("applicationId") as string;
    const collegeId = formData.get("collegeId") as string;
    const replaceExisting = formData.get("replaceExisting") === "true";

    if (!file) {
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
      return NextResponse.json(
        { error: "Invalid bucket. Must be one of: " + validBuckets.join(", ") },
        { status: 400 },
      );
    }

    // Sanitize filename
    const sanitizedFile = new File([file], sanitizeFileName(file.name), {
      type: file.type,
    });

    // Comprehensive file validation
    const validation = await validateFileComprehensive(sanitizedFile);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Validate upload permissions
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
      return NextResponse.json(
        { error: permissionCheck.error || "Upload not allowed" },
        { status: 403 },
      );
    }

    // Upload file using document storage service
    const result = await serverDocumentStorageService.uploadFile(
      sanitizedFile,
      {
        bucket: bucket as StorageBucket,
        folder,
        documentType: documentType as DocumentType,
        applicationId: applicationId || undefined,
        collegeId: collegeId || undefined,
        replaceExisting,
      },
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Return success response with warnings if any
    const response: { success: boolean; data: unknown; warnings?: string[] } = {
      success: true,
      data: result.data,
    };

    if (validation.warnings && validation.warnings.length > 0) {
      response.warnings = validation.warnings;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error in upload API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const serverDocumentStorageService = createServerDocumentStorageService();
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 },
      );
    }

    const result = await serverDocumentStorageService.deleteFile(documentId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Unexpected error in delete API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const serverDocumentStorageService = createServerDocumentStorageService();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const applicationId = searchParams.get("applicationId");
    const collegeId = searchParams.get("collegeId");
    const documentType = searchParams.get("documentType");
    const isActive = searchParams.get("isActive");

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
    console.error("Unexpected error in documents API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
