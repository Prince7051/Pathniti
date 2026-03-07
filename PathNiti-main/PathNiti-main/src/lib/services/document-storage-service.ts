/**
 * Document Storage Service
 * Handles secure file uploads, downloads, and management for the application
 */

import { createServiceClient } from "@/lib/supabase/service";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  validateFile,
  generateUniqueFilename,
} from "@/lib/utils/file-validation";

export type StorageBucket =
  | "student-documents"
  | "college-documents"
  | "profile-images";
export type DocumentType =
  | "marksheet_10th"
  | "marksheet_12th"
  | "other"
  | "gallery"
  | "profile"
  | "brochure";

export interface UploadOptions {
  bucket: StorageBucket;
  folder: string;
  documentType?: DocumentType;
  applicationId?: string;
  collegeId?: string;
  replaceExisting?: boolean;
}

export interface UploadResult {
  success: boolean;
  data?: {
    id: string;
    path: string;
    url: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  };
  error?: string;
}

export interface DocumentMetadata {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  bucket_name: string;
  document_type?: string;
  application_id?: string;
  college_id?: string;
  is_active: boolean;
  uploaded_at: string;
  updated_at: string;
}

export class DocumentStorageService {
  private supabase: ReturnType<typeof createServiceClient>;

  constructor(useServerClient = false) {
    if (useServerClient) {
      this.supabase = createServerClient();
    } else {
      this.supabase = createServiceClient();
    }
  }

  /**
   * Upload a file to Supabase Storage with metadata tracking
   */
  async uploadFile(file: File, options: UploadOptions): Promise<UploadResult> {
    try {
      // Validate file
      const validation = await validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return {
          success: false,
          error: "Authentication required",
        };
      }

      // Generate unique filename and path
      const fileName = generateUniqueFilename(file.name);
      const filePath = `${options.folder}/${user.id}/${fileName}`;

      // Check if we should replace existing file
      if (
        options.replaceExisting &&
        options.documentType &&
        options.applicationId
      ) {
        await this.deleteExistingDocument(
          options.documentType,
          options.applicationId,
        );
      }

      // Upload file to storage
      const { data: uploadData, error: uploadError } =
        await this.supabase.storage
          .from(options.bucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return {
          success: false,
          error: uploadError.message,
        };
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = this.supabase.storage
        .from(options.bucket)
        .getPublicUrl(uploadData.path);

      // Save metadata to database
      const { data: metadataData, error: metadataError } = await (this.supabase as any)
        .from("document_metadata")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          file_type: file.type,
          bucket_name: options.bucket,
          document_type: options.documentType,
          application_id: options.applicationId,
          college_id: options.collegeId,
        })
        .select()
        .single();

      if (metadataError) {
        console.error("Metadata save error:", metadataError);
        // Try to clean up uploaded file
        await this.supabase.storage
          .from(options.bucket)
          .remove([uploadData.path]);

        return {
          success: false,
          error: "Failed to save file metadata",
        };
      }

      return {
        success: true,
        data: {
          id: (metadataData as { id: string }).id,
          path: uploadData.path,
          url: publicUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
      };
    } catch (error) {
      console.error("Upload service error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  /**
   * Download a file from storage
   */
  async downloadFile(
    filePath: string,
    bucket: StorageBucket,
  ): Promise<{ data: Blob | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(filePath);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Download failed",
      };
    }
  }

  /**
   * Get signed URL for secure file access
   */
  async getSignedUrl(
    filePath: string,
    bucket: StorageBucket,
    expiresIn = 3600,
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        return { url: null, error: error.message };
      }

      return { url: data.signedUrl, error: null };
    } catch (error) {
      return {
        url: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate signed URL",
      };
    }
  }

  /**
   * Delete a file from storage and remove metadata
   */
  async deleteFile(
    documentId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get document metadata
      const { data: metadata, error: fetchError } = await this.supabase
        .from("document_metadata")
        .select("*")
        .eq("id", documentId)
        .single();

      if (fetchError || !metadata) {
        return { success: false, error: "Document not found" };
      }

      // Delete from storage
      const { error: storageError } = await this.supabase.storage
        .from((metadata as { bucket_name: string }).bucket_name as StorageBucket)
        .remove([(metadata as { file_path: string }).file_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }

      // Mark as inactive in metadata (soft delete)
      const { error: metadataError } = await (this.supabase as any)
        .from("document_metadata")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", documentId);

      if (metadataError) {
        return { success: false, error: "Failed to update document metadata" };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Delete failed",
      };
    }
  }

  /**
   * Get document metadata for a user
   */
  async getUserDocuments(
    userId?: string,
    filters?: {
      documentType?: DocumentType;
      applicationId?: string;
      collegeId?: string;
      isActive?: boolean;
    },
  ): Promise<{ data: DocumentMetadata[] | null; error: string | null }> {
    try {
      let query = this.supabase
        .from("document_metadata")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      if (filters?.documentType) {
        query = query.eq("document_type", filters.documentType);
      }

      if (filters?.applicationId) {
        query = query.eq("application_id", filters.applicationId);
      }

      if (filters?.collegeId) {
        query = query.eq("college_id", filters.collegeId);
      }

      if (filters?.isActive !== undefined) {
        query = query.eq("is_active", filters.isActive);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Failed to fetch documents",
      };
    }
  }

  /**
   * Delete existing document of the same type for replacement
   */
  private async deleteExistingDocument(
    documentType: DocumentType,
    applicationId: string,
  ): Promise<void> {
    try {
      const { data: existingDocs } = await this.supabase
        .from("document_metadata")
        .select("id")
        .eq("document_type", documentType)
        .eq("application_id", applicationId)
        .eq("is_active", true);

      if (existingDocs && existingDocs.length > 0) {
        for (const doc of existingDocs) {
          await this.deleteFile((doc as { id: string }).id);
        }
      }
    } catch (error) {
      console.error("Error deleting existing document:", error);
    }
  }

  /**
   * Validate file upload permissions
   */
  async validateUploadPermissions(
    _bucket: StorageBucket,
    _options: UploadOptions,
  ): Promise<{ allowed: boolean; error?: string }> {
    try {
      const {
        data: { user },
        error: authError,
      } = await this.supabase.auth.getUser();
      if (authError || !user) {
        return { allowed: false, error: "Authentication required" };
      }

      // Additional permission checks can be added here based on business logic
      // For example, checking if user owns the college for college-documents bucket

      return { allowed: true };
    } catch (error) {
      return {
        allowed: false,
        error:
          error instanceof Error ? error.message : "Permission check failed",
      };
    }
  }

  /**
   * Get file preview URL (for images)
   */
  async getPreviewUrl(
    filePath: string,
    bucket: StorageBucket,
    transform?: {
      width?: number;
      height?: number;
      quality?: number;
    },
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      let url = this.supabase.storage.from(bucket).getPublicUrl(filePath)
        .data.publicUrl;

      // Add transformation parameters if provided
      if (transform) {
        const params = new URLSearchParams();
        if (transform.width) params.append("width", transform.width.toString());
        if (transform.height)
          params.append("height", transform.height.toString());
        if (transform.quality)
          params.append("quality", transform.quality.toString());

        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }

      return { url, error: null };
    } catch (error) {
      return {
        url: null,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate preview URL",
      };
    }
  }
}

// Export singleton instances
export const documentStorageService = new DocumentStorageService();
export const createServerDocumentStorageService = () =>
  new DocumentStorageService(true);
