/**
 * Security configuration for the PathNiti application
 */

export const SECURITY_CONFIG = {
  // Authentication settings
  auth: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    passwordMinLength: 8,
    requireStrongPasswords: true,
    enableTwoFactor: false, // Future enhancement
  },

  // Rate limiting settings
  rateLimiting: {
    // API endpoints
    api: {
      default: { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
      auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 10 auth requests per 15 minutes
      upload: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 uploads per hour
      application: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 applications per hour
    },
    // By user role
    byRole: {
      student: { maxRequests: 200, windowMs: 15 * 60 * 1000 },
      college: { maxRequests: 500, windowMs: 15 * 60 * 1000 },
      admin: { maxRequests: 1000, windowMs: 15 * 60 * 1000 },
    },
  },

  // File upload security
  fileUpload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB default
    maxFilesPerRequest: 5,
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
    quarantineDirectory: "quarantine/",
    virusScanTimeout: 30000, // 30 seconds
  },

  // Input validation
  validation: {
    maxStringLength: 1000,
    maxArrayLength: 100,
    sanitizeHtml: true,
    allowedHtmlTags: [], // No HTML allowed by default
    maxRequestBodySize: 50 * 1024 * 1024, // 50MB
  },

  // Audit logging
  audit: {
    enableLogging: true,
    logLevel: "info", // 'debug', 'info', 'warn', 'error'
    retentionDays: 90,
    logSensitiveData: false,
    logRequestBodies: false,
    logResponseBodies: false,
    sensitiveFields: [
      "password",
      "token",
      "secret",
      "key",
      "authorization",
      "cookie",
      "session",
    ],
  },

  // CORS settings
  cors: {
    allowedOrigins: [
      "https://pathneethi.vercel.app",
      "https://pathneeti.com",
      ...(process.env.NODE_ENV === "development"
        ? ["http://localhost:3000"]
        : []),
    ],
    allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    maxAge: 86400, // 24 hours
  },

  // Content Security Policy
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for Next.js
      "'unsafe-eval'", // Required for development
      "https://vercel.live",
      "https://va.vercel-scripts.com",
    ],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: process.env.NODE_ENV === "production",
  },

  // Security headers
  headers: {
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    xXssProtection: "1; mode=block",
    referrerPolicy: "strict-origin-when-cross-origin",
    permissionsPolicy: "camera=(), microphone=(), geolocation=()",
    strictTransportSecurity: "max-age=31536000; includeSubDomains; preload",
  },

  // Database security
  database: {
    enableRLS: true,
    logQueries: process.env.NODE_ENV === "development",
    maxConnections: 20,
    connectionTimeout: 30000,
    queryTimeout: 60000,
  },

  // Encryption settings
  encryption: {
    algorithm: "aes-256-gcm",
    keyRotationDays: 90,
    encryptSensitiveFields: true,
    sensitiveFields: ["phone", "address", "documents", "personal_details"],
  },

  // Monitoring and alerting
  monitoring: {
    enableMetrics: true,
    alertThresholds: {
      errorRate: 0.05, // 5% error rate
      responseTime: 5000, // 5 seconds
      failedLogins: 10, // per minute
      suspiciousActivity: 5, // per minute
    },
    webhookUrl: process.env.SECURITY_WEBHOOK_URL,
  },

  // Feature flags for security features
  features: {
    enableAuditLogging: true,
    enableRateLimiting: true,
    enableFileScanning: true,
    enableInputSanitization: true,
    enableCSRFProtection: true,
    enableBruteForceProtection: true,
    enableSuspiciousActivityDetection: true,
  },
} as const;

// Environment-specific overrides
if (process.env.NODE_ENV === "development") {
  // Relax some restrictions for development
  (SECURITY_CONFIG.rateLimiting.api.default as Record<string, unknown>).maxRequests = 1000;
  (SECURITY_CONFIG.audit as Record<string, unknown>).logLevel = "debug";
  (SECURITY_CONFIG.fileUpload as Record<string, unknown>).scanForViruses = false; // Disable virus scanning in dev
}

if (process.env.NODE_ENV === "test") {
  // Disable rate limiting and audit logging for tests
  (SECURITY_CONFIG.features as Record<string, unknown>).enableRateLimiting = false;
  (SECURITY_CONFIG.features as Record<string, unknown>).enableAuditLogging = false;
  (SECURITY_CONFIG.fileUpload as Record<string, unknown>).scanForViruses = false;
}

export type SecurityConfig = typeof SECURITY_CONFIG;
