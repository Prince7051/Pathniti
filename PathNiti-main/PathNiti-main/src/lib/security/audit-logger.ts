import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/types";

export interface AuditLogEntry {
  userId?: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Audit logger for tracking sensitive operations
 */
export class AuditLogger {
  private supabase: ReturnType<typeof createClient<Database>>;

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for audit logging
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  /**
   * Log a sensitive operation
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const { error } = await (this.supabase as any).from("audit_logs").insert({
        user_id: entry.userId || null,
        action: entry.action,
        table_name: entry.tableName,
        record_id: entry.recordId || null,
        old_values: entry.oldValues || null,
        new_values: entry.newValues || null,
        ip_address: entry.ipAddress || null,
        user_agent: entry.userAgent || null,
        created_at: new Date().toISOString(),
      } as never);

      if (error) {
        console.error("Failed to write audit log:", error);
        // Don't throw error to avoid breaking the main operation
      }
    } catch (error) {
      console.error("Audit logging error:", error);
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(
    action: "login" | "logout" | "signup" | "password_reset" | "failed_login",
    context: AuditContext,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      userId: context.userId,
      action: `auth.${action}`,
      tableName: "profiles",
      recordId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        ...metadata,
        sessionId: context.sessionId,
      },
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    action: "read" | "export" | "bulk_read",
    tableName: string,
    context: AuditContext,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      userId: context.userId,
      action: `data.${action}`,
      tableName,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata,
    });
  }

  /**
   * Log data modification events
   */
  async logDataModification(
    action: "create" | "update" | "delete",
    tableName: string,
    recordId: string,
    context: AuditContext,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      userId: context.userId,
      action: `data.${action}`,
      tableName,
      recordId,
      oldValues,
      newValues,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  /**
   * Log file operations
   */
  async logFileOperation(
    action: "upload" | "download" | "delete" | "virus_scan",
    fileName: string,
    context: AuditContext,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      userId: context.userId,
      action: `file.${action}`,
      tableName: "files",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        fileName,
        ...metadata,
      },
    });
  }

  /**
   * Log permission changes
   */
  async logPermissionChange(
    action: "grant" | "revoke" | "modify",
    targetUserId: string,
    context: AuditContext,
    oldPermissions?: Record<string, unknown>,
    newPermissions?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      userId: context.userId,
      action: `permission.${action}`,
      tableName: "profiles",
      recordId: targetUserId,
      oldValues: oldPermissions,
      newValues: newPermissions,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    event:
      | "suspicious_activity"
      | "rate_limit_exceeded"
      | "unauthorized_access"
      | "malware_detected",
    context: AuditContext,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      userId: context.userId,
      action: `security.${event}`,
      tableName: "security_events",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata,
    });
  }

  /**
   * Log application status changes
   */
  async logApplicationStatusChange(
    applicationId: string,
    oldStatus: string,
    newStatus: string,
    context: AuditContext,
    feedback?: string,
  ): Promise<void> {
    await this.log({
      userId: context.userId,
      action: "application.status_change",
      tableName: "student_applications",
      recordId: applicationId,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus, feedback },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  /**
   * Log college profile changes
   */
  async logCollegeProfileChange(
    collegeId: string,
    changes: Record<string, unknown>,
    context: AuditContext,
  ): Promise<void> {
    await this.log({
      userId: context.userId,
      action: "college.profile_update",
      tableName: "colleges",
      recordId: collegeId,
      newValues: changes,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  /**
   * Get audit logs for a specific user (admin only)
   */
  async getUserAuditLogs(userId: string, limit: number = 100): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.supabase
      .from("audit_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get audit logs for a specific table/resource
   */
  async getResourceAuditLogs(
    tableName: string,
    recordId?: string,
    limit: number = 100,
  ): Promise<Record<string, unknown>[]> {
    let query = this.supabase
      .from("audit_logs")
      .select("*")
      .eq("table_name", tableName);

    if (recordId) {
      query = query.eq("record_id", recordId);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get security events
   */
  async getSecurityEvents(limit: number = 100): Promise<Record<string, unknown>[]> {
    const { data, error } = await this.supabase
      .from("audit_logs")
      .select("*")
      .like("action", "security.%")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch security events: ${error.message}`);
    }

    return data || [];
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

/**
 * Middleware to extract audit context from request
 */
export function extractAuditContext(
  request: Request,
  userId?: string,
): AuditContext {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = forwarded?.split(",")[0] || realIp || "unknown";

  return {
    userId,
    ipAddress,
    userAgent: request.headers.get("user-agent") || "unknown",
    sessionId: request.headers.get("x-session-id") || undefined,
  };
}

/**
 * Decorator for automatic audit logging of API routes
 */
export function withAuditLog(
  action: string,
  tableName: string,
  options: {
    logRequest?: boolean;
    logResponse?: boolean;
    sensitiveFields?: string[];
  } = {},
) {
  return function (
    target: Record<string, unknown>,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: Record<string, unknown>[]) {
      const [request, context] = args;
      const auditContext = extractAuditContext(request as unknown as Request, (context as { user?: { id: string } })?.user?.id);

      try {
        // Log the operation start
        if (options.logRequest) {
          await auditLogger.log({
            userId: auditContext.userId,
            action: `${action}.start`,
            tableName,
            ipAddress: auditContext.ipAddress,
            userAgent: auditContext.userAgent,
          });
        }

        // Execute the original method
        const result = await method.apply(this, args);

        // Log successful completion
        await auditLogger.log({
          userId: auditContext.userId,
          action: `${action}.success`,
          tableName,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
        });

        return result;
      } catch (error) {
        // Log the error
        await auditLogger.log({
          userId: auditContext.userId,
          action: `${action}.error`,
          tableName,
          ipAddress: auditContext.ipAddress,
          userAgent: auditContext.userAgent,
          metadata: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });

        throw error;
      }
    };

    return descriptor;
  };
}
