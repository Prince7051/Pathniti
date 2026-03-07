# Security Implementation Guide

This document outlines the comprehensive security measures implemented for the PathNiti application as part of Task 16.

## Overview

The security implementation includes:

- Row Level Security (RLS) policies
- Authentication and authorization middleware
- File upload security and virus scanning
- Audit logging for sensitive operations
- Rate limiting and input validation
- Enhanced API route protection

## 🔒 Row Level Security (RLS) Policies

### Database Tables Protected

1. **student_applications**
   - Students can only view/modify their own applications
   - College admins can view applications to their college
   - Admins can view all applications

2. **college_courses**
   - Anyone can view active courses
   - College admins can manage their own courses
   - Admins can manage all courses

3. **college_notices**
   - Anyone can view active, non-expired notices
   - College admins can manage their own notices
   - Admins can manage all notices

4. **audit_logs**
   - Only admins can view audit logs
   - System can insert audit logs

### Migration File

Location: `src/lib/migrations/003_security_policies.sql`

To apply the security policies:

```bash
node run-security-migration.js
```

## 🛡️ Authentication Middleware

### Security Middleware (`src/lib/auth/security-middleware.ts`)

Features:

- **Role-based access control (RBAC)**
- **Resource ownership validation**
- **Rate limiting**
- **Input validation**
- **Request context extraction**

#### Usage Example

```typescript
import { withAuth, withRateLimit } from "@/lib/auth/security-middleware";

export const POST = withAuth(
  withRateLimit(
    async (request, authContext, params) => {
      // Your handler logic
      if (!authContext.hasRole("admin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // ... rest of handler
    },
    {
      maxRequests: 10,
      windowMs: 60000, // 1 minute
    },
  ),
  {
    roles: ["admin", "college"],
    requireAuth: true,
  },
);
```

### Authentication Context

The `AuthContext` provides:

- `user`: Current user information with role
- `isAuthenticated`: Boolean authentication status
- `hasRole(roles)`: Check if user has required role(s)
- `isOwner(resourceId)`: Check if user owns a resource

## 📁 File Upload Security

### File Security (`src/lib/security/file-security.ts`)

Features:

- **File type validation** (MIME type and extension)
- **File size limits**
- **Virus scanning** (basic pattern detection)
- **File name sanitization**
- **Malicious content detection**
- **File integrity hashing**

#### Security Configurations

```typescript
export const FILE_SECURITY_CONFIGS = {
  documents: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['application/pdf', 'image/jpeg', ...],
    allowedExtensions: ['.pdf', '.jpg', '.png', ...],
    scanForViruses: true
  },
  images: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', ...],
    scanForViruses: true
  }
}
```

#### Usage Example

```typescript
import {
  secureFileUpload,
  FILE_SECURITY_CONFIGS,
} from "@/lib/security/file-security";

const result = await secureFileUpload(file, FILE_SECURITY_CONFIGS.documents, {
  generateUniqueFileName: true,
});

if (!result.success) {
  return NextResponse.json(
    {
      error: "File security validation failed",
      details: result.errors,
    },
    { status: 400 },
  );
}
```

## 📊 Audit Logging

### Audit Logger (`src/lib/security/audit-logger.ts`)

Features:

- **Comprehensive event logging**
- **User activity tracking**
- **Security event monitoring**
- **Data modification tracking**
- **File operation logging**

#### Event Types

1. **Authentication Events**
   - Login/logout attempts
   - Password resets
   - Failed authentication

2. **Data Access Events**
   - Read operations
   - Bulk data exports
   - Sensitive data access

3. **Data Modification Events**
   - Create/update/delete operations
   - Permission changes
   - Profile modifications

4. **File Operations**
   - Upload/download/delete
   - Virus scan results
   - Security violations

5. **Security Events**
   - Suspicious activity
   - Rate limit violations
   - Unauthorized access attempts
   - Malware detection

#### Usage Example

```typescript
import { auditLogger, extractAuditContext } from "@/lib/security/audit-logger";

const auditContext = extractAuditContext(request, userId);

// Log authentication
await auditLogger.logAuth("login", auditContext, { method: "email" });

// Log data modification
await auditLogger.logDataModification(
  "create",
  "student_applications",
  applicationId,
  auditContext,
  undefined,
  newApplicationData,
);

// Log security event
await auditLogger.logSecurityEvent("suspicious_activity", auditContext, {
  reason: "Multiple failed login attempts",
  attempts: 5,
});
```

## ⚙️ Security Configuration

### Configuration File (`src/lib/security/config.ts`)

Centralized security settings:

```typescript
export const SECURITY_CONFIG = {
  auth: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },
  rateLimiting: {
    api: {
      default: { maxRequests: 100, windowMs: 15 * 60 * 1000 },
      auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 },
      upload: { maxRequests: 20, windowMs: 60 * 60 * 1000 },
    },
  },
  fileUpload: {
    maxFileSize: 10 * 1024 * 1024,
    scanForViruses: true,
    allowedMimeTypes: [
      /* ... */
    ],
  },
  features: {
    enableAuditLogging: true,
    enableRateLimiting: true,
    enableFileScanning: true,
  },
};
```

## 🔐 Enhanced API Routes

### Secure Upload Route (`src/app/api/upload/route-secure.ts`)

Features:

- **Multi-layer file validation**
- **Virus scanning**
- **Role-based access control**
- **Comprehensive audit logging**
- **Rate limiting**

### Secure Application Route (`src/app/api/colleges/[slug]/apply/route-secure.ts`)

Features:

- **Student role validation**
- **Duplicate application prevention**
- **File security validation**
- **Audit trail for applications**
- **Rate limiting (5 applications per hour)**

## 🧪 Testing

### Security Tests (`src/__tests__/security-implementation.test.ts`)

Test coverage includes:

- Authentication middleware functionality
- Rate limiting behavior
- File security validation
- Audit logging operations
- Resource ownership validation
- Security configuration validation

Run tests:

```bash
npm test src/__tests__/security-implementation.test.ts
```

## 🚀 Deployment and Verification

### 1. Run Security Migration

```bash
node run-security-migration.js
```

### 2. Verify Implementation

```bash
node verify-security-implementation.js
```

### 3. Environment Variables

Ensure these are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📋 Security Checklist

- [ ] RLS policies applied to all sensitive tables
- [ ] Audit logging table created and configured
- [ ] Security middleware integrated into API routes
- [ ] File upload security implemented
- [ ] Rate limiting configured
- [ ] Security tests passing
- [ ] Environment variables configured
- [ ] Migration scripts executed
- [ ] Verification script passes

## 🔍 Monitoring and Maintenance

### Audit Log Monitoring

Query audit logs for security events:

```sql
SELECT * FROM audit_logs
WHERE action LIKE 'security.%'
ORDER BY created_at DESC
LIMIT 100;
```

### Performance Monitoring

Monitor rate limiting effectiveness:

```sql
SELECT action, COUNT(*) as count
FROM audit_logs
WHERE action = 'security.rate_limit_exceeded'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY action;
```

### File Security Monitoring

Check virus scan results:

```sql
SELECT * FROM audit_logs
WHERE action = 'security.malware_detected'
ORDER BY created_at DESC;
```

## 🚨 Security Incident Response

1. **Suspicious Activity Detection**
   - Monitor audit logs for unusual patterns
   - Investigate failed authentication attempts
   - Check for unauthorized access attempts

2. **Malware Detection**
   - Quarantine affected files
   - Notify administrators
   - Review upload patterns

3. **Rate Limit Violations**
   - Identify source IP addresses
   - Implement additional restrictions if needed
   - Monitor for DDoS patterns

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)

## 🤝 Contributing

When adding new security features:

1. Update the security configuration
2. Add appropriate tests
3. Update this documentation
4. Run the verification script
5. Consider audit logging requirements

---

**Note**: This security implementation provides a robust foundation but should be regularly reviewed and updated based on emerging threats and security best practices.
