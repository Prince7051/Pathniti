"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Image,
  AlertTriangle,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Progress,
  Alert,
  AlertDescription,
  Label,
} from "@/components/ui";
import {
  documentStorageService,
  type StorageBucket,
  type DocumentType,
} from "@/lib/services/document-storage-service";
import {
  validateFileComprehensive,
  formatFileSize,
  isImageFile,
  type FileValidationOptions,
} from "@/lib/utils/file-validation";

interface FileUploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  uploaded: boolean;
  error: string | null;
  warnings: string[];
  url: string | null;
  documentId: string | null;
}

interface EnhancedFileUploadProps {
  bucket: StorageBucket;
  folder: string;
  documentType?: DocumentType;
  applicationId?: string;
  collegeId?: string;
  label: string;
  description?: string;
  required?: boolean;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  validationOptions?: FileValidationOptions;
  replaceExisting?: boolean;
  onUploadComplete?: (
    files: { id: string; url: string; fileName: string }[],
  ) => void;
  onUploadError?: (error: string) => void;
  onFilesChange?: (files: FileUploadState[]) => void;
  disabled?: boolean;
  className?: string;
}

export default function EnhancedFileUpload({
  bucket,
  folder,
  documentType,
  applicationId,
  collegeId,
  label,
  description,
  required = false,
  multiple = false,
  accept,
  maxFiles = multiple ? 5 : 1,
  validationOptions,
  replaceExisting = false,
  onUploadComplete,
  onUploadError,
  onFilesChange,
  disabled = false,
  className = "",
}: EnhancedFileUploadProps) {
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update parent when files change
  const updateFiles = useCallback(
    (newFiles: FileUploadState[]) => {
      setFiles(newFiles);
      onFilesChange?.(newFiles);

      // Notify parent of completed uploads
      const completedFiles = newFiles
        .filter((f) => f.uploaded && f.url && f.documentId)
        .map((f) => ({
          id: f.documentId!,
          url: f.url!,
          fileName: f.file!.name,
        }));

      if (completedFiles.length > 0) {
        onUploadComplete?.(completedFiles);
      }
    },
    [onUploadComplete, onFilesChange],
  );

  // Validate and upload a single file
  const validateAndUploadFile = useCallback(async (fileIndex: number) => {
    const currentFiles = [...files];
    const fileState = currentFiles[fileIndex];

    if (!fileState?.file) return;

    try {
      // Update state to show validation in progress
      currentFiles[fileIndex] = {
        ...fileState,
        uploading: true,
        progress: 10,
        error: null,
        warnings: [],
      };
      updateFiles(currentFiles);

      // Validate file
      const validation = await validateFileComprehensive(
        fileState.file,
        validationOptions,
      );

      if (!validation.isValid) {
        currentFiles[fileIndex] = {
          ...fileState,
          uploading: false,
          progress: 0,
          error: validation.error || "File validation failed",
        };
        updateFiles(currentFiles);
        onUploadError?.(validation.error || "File validation failed");
        return;
      }

      // Update with warnings if any
      currentFiles[fileIndex] = {
        ...fileState,
        uploading: true,
        progress: 30,
        warnings: validation.warnings || [],
      };
      updateFiles(currentFiles);

      // Upload file
      const uploadResult = await documentStorageService.uploadFile(
        fileState.file,
        {
          bucket,
          folder,
          documentType,
          applicationId,
          collegeId,
          replaceExisting,
        },
      );

      if (!uploadResult.success) {
        currentFiles[fileIndex] = {
          ...fileState,
          uploading: false,
          progress: 0,
          error: uploadResult.error || "Upload failed",
        };
        updateFiles(currentFiles);
        onUploadError?.(uploadResult.error || "Upload failed");
        return;
      }

      // Success
      currentFiles[fileIndex] = {
        ...fileState,
        uploading: false,
        progress: 100,
        uploaded: true,
        url: uploadResult.data!.url,
        documentId: uploadResult.data!.id,
      };
      updateFiles(currentFiles);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      currentFiles[fileIndex] = {
        ...fileState,
        uploading: false,
        progress: 0,
        error: errorMessage,
      };
      updateFiles(currentFiles);
      onUploadError?.(errorMessage);
    }
  }, [files, validationOptions, updateFiles, onUploadError, bucket, folder, documentType, applicationId, collegeId, replaceExisting]);

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);

    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      onUploadError?.(
        `Maximum ${maxFiles} file${maxFiles > 1 ? "s" : ""} allowed`,
      );
      return;
    }

    // Create initial file states
    const newFileStates: FileUploadState[] = fileArray.map((file) => ({
      file,
      uploading: false,
      progress: 0,
      uploaded: false,
      error: null,
      warnings: [],
      url: null,
      documentId: null,
    }));

    // Add to files array
    const updatedFiles = multiple
      ? [...files, ...newFileStates]
      : newFileStates;
    updateFiles(updatedFiles);

    // Validate and upload each file
    for (let i = 0; i < newFileStates.length; i++) {
      const fileIndex = multiple ? files.length + i : i;
      await validateAndUploadFile(fileIndex);
    }
  }, [files, maxFiles, onUploadError, multiple, updateFiles, validateAndUploadFile]);


  // Remove file
  const removeFile = async (fileIndex: number) => {
    const fileState = files[fileIndex];

    // Delete from storage if uploaded
    if (fileState.documentId) {
      try {
        await documentStorageService.deleteFile(fileState.documentId);
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    }

    // Remove from state
    const updatedFiles = files.filter((_, index) => index !== fileIndex);
    updateFiles(updatedFiles);
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles && droppedFiles.length > 0) {
        handleFileSelect(droppedFiles);
      }
    },
    [disabled, handleFileSelect],
  );

  // File input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (isImageFile(file)) {
      return <Image className="h-4 w-4 text-blue-500" />;
    }
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  // Get status icon
  const getStatusIcon = (fileState: FileUploadState) => {
    if (fileState.uploading) {
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    }
    if (fileState.uploaded) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (fileState.error) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (fileState.warnings.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return null;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>

      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : disabled
              ? "border-gray-200 bg-gray-50"
              : "border-gray-300 hover:border-primary/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-6">
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={accept}
            onChange={handleInputChange}
            disabled={disabled}
            className="hidden"
          />

          <div className="text-center">
            <Upload
              className={`h-8 w-8 mx-auto mb-3 ${disabled ? "text-gray-300" : "text-gray-400"}`}
            />
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || files.length >= maxFiles}
                className="mb-2"
              >
                Choose File{multiple ? "s" : ""}
              </Button>
              <p className="text-sm text-gray-500">
                or drag and drop {multiple ? "files" : "a file"} here
              </p>
              <p className="text-xs text-gray-400">
                {accept
                  ? `Accepted: ${accept}`
                  : "PDF, DOC, DOCX, JPG, PNG up to 10MB"}
                {multiple && ` • Max ${maxFiles} files`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileState, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {fileState.file && getFileIcon(fileState.file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileState.file?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {fileState.file && formatFileSize(fileState.file.size)}
                    </p>
                  </div>
                  {getStatusIcon(fileState)}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={fileState.uploading}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress Bar */}
              {fileState.uploading && (
                <Progress value={fileState.progress} className="mt-2" />
              )}

              {/* Error Message */}
              {fileState.error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {fileState.error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {fileState.warnings.length > 0 && (
                <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {fileState.warnings.join(", ")}
                  </AlertDescription>
                </Alert>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
