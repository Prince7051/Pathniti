import { createHash } from "crypto";

export interface FileSecurityConfig {
  maxFileSize: number; // in bytes
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  scanForViruses: boolean;
  quarantineDirectory?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileHash?: string;
  sanitizedName?: string;
}

export interface VirusScanResult {
  isClean: boolean;
  threats: string[];
  scanEngine: string;
  scanTime: number;
}

/**
 * Default security configuration for different file types
 */
export const FILE_SECURITY_CONFIGS: Record<string, FileSecurityConfig> = {
  documents: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    allowedExtensions: [
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".doc",
      ".docx",
    ],
    scanForViruses: true,
  },
  images: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
    scanForViruses: true,
  },
  avatars: {
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    scanForViruses: true,
  },
};

/**
 * Validate file security constraints
 */
export async function validateFileUpload(
  file: File,
  config: FileSecurityConfig,
): Promise<FileValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file size
  if (file.size > config.maxFileSize) {
    errors.push(
      `File size ${formatBytes(file.size)} exceeds maximum allowed size ${formatBytes(config.maxFileSize)}`,
    );
  }

  // Check MIME type
  if (!config.allowedMimeTypes.includes(file.type)) {
    errors.push(
      `File type ${file.type} is not allowed. Allowed types: ${config.allowedMimeTypes.join(", ")}`,
    );
  }

  // Check file extension
  const extension = getFileExtension(file.name).toLowerCase();
  if (!config.allowedExtensions.includes(extension)) {
    errors.push(
      `File extension ${extension} is not allowed. Allowed extensions: ${config.allowedExtensions.join(", ")}`,
    );
  }

  // Validate file name
  const sanitizedName = sanitizeFileName(file.name);
  if (sanitizedName !== file.name) {
    warnings.push("File name has been sanitized for security");
  }

  // Generate file hash for integrity checking
  const fileHash = await generateFileHash(file);

  // Check for suspicious file patterns
  const suspiciousPatterns = await checkSuspiciousPatterns(file);
  if (suspiciousPatterns.length > 0) {
    errors.push(
      `Suspicious patterns detected: ${suspiciousPatterns.join(", ")}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileHash,
    sanitizedName,
  };
}

/**
 * Simulate virus scanning (in production, integrate with actual antivirus service)
 */
export async function scanFileForViruses(file: File): Promise<VirusScanResult> {
  const startTime = Date.now();

  // In production, integrate with services like:
  // - ClamAV
  // - VirusTotal API
  // - AWS GuardDuty Malware Protection
  // - Microsoft Defender API

  // For now, implement basic pattern detection
  const threats = await detectMaliciousPatterns(file);

  return {
    isClean: threats.length === 0,
    threats,
    scanEngine: "PathNiti-Basic-Scanner",
    scanTime: Date.now() - startTime,
  };
}

/**
 * Generate SHA-256 hash of file content
 */
async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hash = createHash("sha256");
  hash.update(new Uint8Array(buffer));
  return hash.digest("hex");
}

/**
 * Sanitize file name to prevent path traversal and other attacks
 */
function sanitizeFileName(fileName: string): string {
  // Remove path separators and dangerous characters
  let sanitized = fileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, "");

  // Prevent reserved names on Windows
  const reservedNames = [
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
  ];
  const nameWithoutExt = sanitized.split(".")[0].toUpperCase();
  if (reservedNames.includes(nameWithoutExt)) {
    sanitized = `file_${sanitized}`;
  }

  // Limit length
  if (sanitized.length > 255) {
    const extension = getFileExtension(sanitized);
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf("."));
    sanitized = nameWithoutExt.substring(0, 255 - extension.length) + extension;
  }

  return sanitized || "unnamed_file";
}

/**
 * Get file extension from filename
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot === -1 ? "" : fileName.substring(lastDot);
}

/**
 * Check for suspicious file patterns
 */
async function checkSuspiciousPatterns(file: File): Promise<string[]> {
  const suspicious: string[] = [];

  try {
    // Check file header (magic bytes)
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check for executable file signatures
    const executableSignatures = [
      [0x4d, 0x5a], // PE executable (Windows)
      [0x7f, 0x45, 0x4c, 0x46], // ELF executable (Linux)
      [0xfe, 0xed, 0xfa, 0xce], // Mach-O executable (macOS)
      [0xce, 0xfa, 0xed, 0xfe], // Mach-O executable (macOS, reverse)
    ];

    for (const signature of executableSignatures) {
      if (bytes.length >= signature.length) {
        let matches = true;
        for (let i = 0; i < signature.length; i++) {
          if (bytes[i] !== signature[i]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          suspicious.push("Executable file detected");
          break;
        }
      }
    }

    // Check for script content in non-script files
    if (!file.type.includes("javascript") && !file.type.includes("text")) {
      const text = new TextDecoder().decode(
        bytes.slice(0, Math.min(1024, bytes.length)),
      );
      const scriptPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /eval\(/i,
        /document\.write/i,
      ];

      for (const pattern of scriptPatterns) {
        if (pattern.test(text)) {
          suspicious.push("Script content detected in non-script file");
          break;
        }
      }
    }
  } catch {
    suspicious.push("Unable to analyze file content");
  }

  return suspicious;
}

/**
 * Detect malicious patterns (basic implementation)
 */
async function detectMaliciousPatterns(file: File): Promise<string[]> {
  const threats: string[] = [];

  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check for known malicious signatures (simplified)
    const maliciousSignatures = [
      // EICAR test string (standard antivirus test)
      "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*",
    ];

    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);

    for (const signature of maliciousSignatures) {
      if (text.includes(signature)) {
        threats.push("EICAR-Test-File");
      }
    }

    // Check for suspicious PowerShell commands
    const powershellPatterns = [
      /powershell.*-encodedcommand/i,
      /invoke-expression/i,
      /downloadstring/i,
      /system\.net\.webclient/i,
    ];

    for (const pattern of powershellPatterns) {
      if (pattern.test(text)) {
        threats.push("Suspicious PowerShell command detected");
        break;
      }
    }
  } catch {
    // If we can't decode the file, it might be binary, which is expected for some file types
  }

  return threats;
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Secure file upload handler with comprehensive security checks
 */
export async function secureFileUpload(
  file: File,
  config: FileSecurityConfig,
  options: {
    generateUniqueFileName?: boolean;
    preserveOriginalName?: boolean;
  } = {},
): Promise<{
  success: boolean;
  fileName?: string;
  fileHash?: string;
  errors: string[];
  warnings: string[];
  virusScanResult?: VirusScanResult;
}> {
  // Validate file
  const validation = await validateFileUpload(file, config);

  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  // Scan for viruses if enabled
  let virusScanResult: VirusScanResult | undefined;
  if (config.scanForViruses) {
    virusScanResult = await scanFileForViruses(file);

    if (!virusScanResult.isClean) {
      return {
        success: false,
        errors: [`Virus scan failed: ${virusScanResult.threats.join(", ")}`],
        warnings: validation.warnings,
        virusScanResult,
      };
    }
  }

  // Generate secure file name
  let fileName = validation.sanitizedName || file.name;
  if (options.generateUniqueFileName) {
    const extension = getFileExtension(fileName);
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    fileName = `${timestamp}_${randomString}${extension}`;
  }

  return {
    success: true,
    fileName,
    fileHash: validation.fileHash,
    errors: [],
    warnings: validation.warnings,
    virusScanResult,
  };
}
