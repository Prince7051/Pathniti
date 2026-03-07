/**
 * File validation utilities for document uploads
 */

export const ALLOWED_FILE_TYPES = {
  DOCUMENTS: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  IMAGES: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
  ALL: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
  ],
} as const;

export const FILE_SIZE_LIMITS = {
  DOCUMENT: 10 * 1024 * 1024, // 10MB for documents
  IMAGE: 5 * 1024 * 1024, // 5MB for images
  PROFILE_IMAGE: 2 * 1024 * 1024, // 2MB for profile images
} as const;

export const FILE_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/jpg": "JPG",
  "image/webp": "WebP",
};

export const MIME_TYPE_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export interface FileValidationOptions {
  allowedTypes?: string[];
  maxSize?: number;
  minSize?: number;
  allowedExtensions?: string[];
  requireSpecificDimensions?: {
    width: number;
    height: number;
    tolerance?: number;
  };
}

/**
 * Validate a file for document upload with enhanced options
 */
export async function validateFile(
  file: File,
  options?: FileValidationOptions,
): Promise<FileValidationResult> {
  const warnings: string[] = [];

  // Use default options if not provided
  const allowedTypes = options?.allowedTypes || ALLOWED_FILE_TYPES.ALL;
  const maxSize =
    options?.maxSize ||
    (isImageFile(file) ? FILE_SIZE_LIMITS.IMAGE : FILE_SIZE_LIMITS.DOCUMENT);
  const minSize = options?.minSize || 1024; // 1KB minimum

  // Check if file is empty
  if (file.size === 0) {
    return {
      isValid: false,
      error: "File cannot be empty",
    };
  }

  // Check minimum file size
  if (file.size < minSize) {
    return {
      isValid: false,
      error: `File size must be at least ${formatFileSize(minSize)}`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type as "application/pdf" | "application/msword" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document" | "image/jpeg" | "image/png" | "image/jpg" | "image/webp")) {
    const allowedTypeLabels = allowedTypes
      .map((type) => FILE_TYPE_LABELS[type] || type)
      .join(", ");
    return {
      isValid: false,
      error: `Only ${allowedTypeLabels} files are allowed`,
    };
  }

  // Check file extension matches MIME type
  const expectedExtension = MIME_TYPE_EXTENSIONS[file.type];
  const actualExtension = getFileExtension(file.name);

  if (expectedExtension && actualExtension !== expectedExtension) {
    warnings.push(
      `File extension "${actualExtension}" doesn't match file type. Expected "${expectedExtension}"`,
    );
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${formatFileSize(maxSize)}`,
    };
  }

  // Check allowed extensions if specified
  if (options?.allowedExtensions) {
    const fileExtension = getFileExtension(file.name);
    if (!options.allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Only files with extensions ${options.allowedExtensions.join(", ")} are allowed`,
      };
    }
  }

  // Additional validation for images
  if (isImageFile(file)) {
    const imageValidation = validateImageFile(file, options);
    if (imageValidation instanceof Promise) {
      // Handle async validation
      const result = await imageValidation;
      if (!result.isValid) {
        return result;
      }
      if (result.warnings) {
        warnings.push(...result.warnings);
      }
    } else {
      // Handle sync validation
      if (!imageValidation.isValid) {
        return imageValidation;
      }
      if (imageValidation.warnings) {
        warnings.push(...imageValidation.warnings);
      }
    }
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate image-specific requirements
 */
function validateImageFile(
  file: File,
  options?: FileValidationOptions,
): FileValidationResult | Promise<FileValidationResult> {
  const warnings: string[] = [];

  // Check if dimensions are required
  if (options?.requireSpecificDimensions) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const {
          width: reqWidth,
          height: reqHeight,
          tolerance = 0,
        } = options.requireSpecificDimensions!;

        const widthDiff = Math.abs(img.width - reqWidth);
        const heightDiff = Math.abs(img.height - reqHeight);

        if (widthDiff > tolerance || heightDiff > tolerance) {
          resolve({
            isValid: false,
            error: `Image dimensions must be ${reqWidth}x${reqHeight}px (±${tolerance}px tolerance). Current: ${img.width}x${img.height}px`,
          });
        } else {
          resolve({ isValid: true, warnings });
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          isValid: false,
          error: "Invalid image file or corrupted data",
        });
      };

      img.src = url;
    });
  }

  return { isValid: true, warnings };
}

/**
 * Validate multiple files
 */
export async function validateFiles(
  files: File[],
  options?: FileValidationOptions,
): Promise<FileValidationResult> {
  const allWarnings: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await validateFile(file, options);

    if (!result.isValid) {
      return {
        isValid: false,
        error: `File ${i + 1} (${file.name}): ${result.error}`,
      };
    }

    if (result.warnings) {
      allWarnings.push(
        ...result.warnings.map((w) => `File ${i + 1} (${file.name}): ${w}`),
      );
    }
  }

  return {
    isValid: true,
    warnings: allWarnings.length > 0 ? allWarnings : undefined,
  };
}

/**
 * Check if file type is a document
 */
export function isDocumentFile(file: File): boolean {
  return ALLOWED_FILE_TYPES.DOCUMENTS.includes(file.type as "application/pdf" | "application/msword" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
}

/**
 * Get appropriate file size limit based on file type
 */
export function getFileSizeLimit(file: File): number {
  if (isImageFile(file)) {
    return FILE_SIZE_LIMITS.IMAGE;
  }
  return FILE_SIZE_LIMITS.DOCUMENT;
}

/**
 * Validate file name for security
 */
export function validateFileName(filename: string): FileValidationResult {
  // Check for dangerous characters
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (dangerousChars.test(filename)) {
    return {
      isValid: false,
      error: "Filename contains invalid characters",
    };
  }

  // Check filename length
  if (filename.length > 255) {
    return {
      isValid: false,
      error: "Filename is too long (maximum 255 characters)",
    };
  }

  // Check for reserved names (Windows)
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
  if (reservedNames.test(filename)) {
    return {
      isValid: false,
      error: "Filename uses a reserved system name",
    };
  }

  return { isValid: true };
}

/**
 * Sanitize filename for safe storage (original implementation)
 */
export function sanitizeFileNameOriginal(filename: string): string {
  // Replace dangerous characters with underscores
  let sanitized = filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");

  // Remove multiple consecutive underscores
  sanitized = sanitized.replace(/_+/g, "_");

  // Remove leading/trailing underscores and dots
  sanitized = sanitized.replace(/^[._]+|[._]+$/g, "");

  // Ensure filename is not empty
  if (!sanitized) {
    sanitized = "file";
  }

  // Truncate if too long
  if (sanitized.length > 255) {
    const extension = getFileExtension(sanitized);
    const baseName = sanitized.substring(0, 255 - extension.length - 1);
    sanitized = `${baseName}.${extension}`;
  }

  return sanitized;
}

/**
 * Check if file appears to be corrupted based on basic checks
 */
export async function validateFileIntegrity(
  file: File,
): Promise<FileValidationResult> {
  try {
    // Basic check: try to read first few bytes
    const chunk = file.slice(0, 1024);
    const buffer = await chunk.arrayBuffer();

    if (buffer.byteLength === 0) {
      return {
        isValid: false,
        error: "File appears to be empty or corrupted",
      };
    }

    // Check for common file signatures
    const uint8Array = new Uint8Array(buffer);
    const signature = Array.from(uint8Array.slice(0, 4))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    // PDF signature check
    if (file.type === "application/pdf") {
      const pdfSignature = Array.from(uint8Array.slice(0, 4))
        .map((byte) => String.fromCharCode(byte))
        .join("");

      if (!pdfSignature.startsWith("%PDF")) {
        return {
          isValid: false,
          error: "File does not appear to be a valid PDF",
        };
      }
    }

    // JPEG signature check
    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      if (
        signature !== "ffd8ffe0" &&
        signature !== "ffd8ffe1" &&
        signature !== "ffd8ffe2"
      ) {
        return {
          isValid: false,
          error: "File does not appear to be a valid JPEG",
        };
      }
    }

    // PNG signature check
    if (file.type === "image/png") {
      if (signature !== "89504e47") {
        return {
          isValid: false,
          error: "File does not appear to be a valid PNG",
        };
      }
    }

    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: "Unable to validate file integrity",
    };
  }
}

/**
 * Comprehensive file validation with all checks
 */
export async function validateFileComprehensive(
  file: File,
  options?: FileValidationOptions,
): Promise<FileValidationResult> {
  // Basic validation
  const basicValidation = await validateFile(file, options);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // Filename validation
  const filenameValidation = validateFileName(file.name);
  if (!filenameValidation.isValid) {
    return filenameValidation;
  }

  // Integrity validation
  const integrityValidation = await validateFileIntegrity(file);
  if (!integrityValidation.isValid) {
    return integrityValidation;
  }

  // Combine all warnings
  const allWarnings = [
    ...(basicValidation.warnings || []),
    ...(filenameValidation.warnings || []),
    ...(integrityValidation.warnings || []),
  ];

  return {
    isValid: true,
    warnings: allWarnings.length > 0 ? allWarnings : undefined,
  };
} /**

 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * Generate a unique filename for upload
 */
export function generateUniqueFilename(originalFilename: string): string {
  const extension = getFileExtension(originalFilename);
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2);
  const baseName = originalFilename.replace(/\.[^/.]+$/, "").substring(0, 50); // Limit base name length

  return `${baseName}-${timestamp}-${randomString}.${extension}`;
}

/**
 * Check if file type is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/**
 * Check if file type is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === "application/pdf";
}

// Additional functions for comprehensive testing
export interface FileUploadValidationOptions {
  allowedTypes: string[];
  maxSize: number;
}

export interface FileUploadValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateFileUpload(
  file: File,
  options: FileUploadValidationOptions,
): FileUploadValidationResult {
  const errors: string[] = [];

  // Check file size
  if (file.size === 0) {
    errors.push("File cannot be empty");
  } else if (file.size > options.maxSize) {
    const maxSizeMB = Math.round(options.maxSize / (1024 * 1024));
    errors.push(`File size exceeds maximum limit of ${maxSizeMB}MB`);
  }

  // Check file type
  if (!options.allowedTypes.includes(file.type)) {
    errors.push(
      `File type not allowed. Allowed types: ${options.allowedTypes.join(", ")}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function sanitizeFileName(filename: string): string {
  // Handle special character mapping first
  const charMap: { [key: string]: string } = {
    é: "e",
    è: "e",
    ê: "e",
    ë: "e",
    à: "a",
    á: "a",
    â: "a",
    ã: "a",
    ä: "a",
    ù: "u",
    ú: "u",
    û: "u",
    ü: "u",
    ì: "i",
    í: "i",
    î: "i",
    ï: "i",
    ò: "o",
    ó: "o",
    ô: "o",
    õ: "o",
    ö: "o",
    ç: "c",
    ñ: "n",
  };

  let sanitized = filename;

  // Replace accented characters first
  for (const [accented, plain] of Object.entries(charMap)) {
    sanitized = sanitized.replace(new RegExp(accented, "g"), plain);
  }

  // Handle Cyrillic characters (basic mapping)
  if (/[а-я]/i.test(sanitized)) {
    const extension = getFileExtension(sanitized);
    sanitized = extension ? `file.${extension}` : "file.pdf";
  }

  // Handle Chinese characters (basic mapping)
  if (/[\u4e00-\u9fff]/.test(sanitized)) {
    const extension = getFileExtension(sanitized);
    sanitized = extension ? `document.${extension}` : "document.pdf";
  }

  // Convert to lowercase
  sanitized = sanitized.toLowerCase();

  // Handle path traversal attempts first
  sanitized = sanitized.replace(/\.\./g, "");

  // Replace spaces and special characters with hyphens, but preserve dots for extensions
  sanitized = sanitized.replace(/[^a-z0-9.-]/g, "-");

  // Remove multiple consecutive hyphens
  sanitized = sanitized.replace(/-+/g, "-");

  // Remove leading/trailing hyphens (but preserve dots for extensions)
  sanitized = sanitized.replace(/^-+/, "");

  // Remove trailing hyphens before file extension
  sanitized = sanitized.replace(/-+(\.[^.]+)$/, "$1");

  // Remove trailing hyphens at the end
  sanitized = sanitized.replace(/-+$/, "");

  // Truncate if too long (keep extension)
  if (sanitized.length > 100) {
    const extension = getFileExtension(sanitized);
    const baseName = sanitized.substring(0, 100 - extension.length - 1);
    sanitized = `${baseName}.${extension}`;
  }

  return sanitized;
}

export function checkFileType(input: string, allowedTypes: string[]): boolean {
  // Check if input is a MIME type
  if (input.includes("/")) {
    return allowedTypes.includes(input);
  }

  // Check if input is a filename with extension
  const extension = getFileExtension(input);
  return allowedTypes.some((type) => {
    if (type.startsWith(".")) {
      return type.substring(1) === extension;
    }
    return false;
  });
}

export function checkFileSize(fileSize: number, maxSize: number): boolean {
  return fileSize > 0 && maxSize > 0 && fileSize <= maxSize;
}
