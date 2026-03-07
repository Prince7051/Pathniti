import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/supabase/types";

export interface AuthContext {
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
  isAuthenticated: boolean;
  hasRole: (role: string | string[]) => boolean;
  isOwner: (resourceOwnerId: string) => boolean;
}

/**
 * Enhanced authentication middleware with role-based access control
 */
export async function createAuthContext(
  request: NextRequest,
): Promise<AuthContext> {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      isAuthenticated: false,
      hasRole: () => false,
      isOwner: () => false,
    };
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userWithRole = {
    id: user.id,
    email: user.email!,
    role: (profile as { role?: string } | null)?.role || "student",
  };

  return {
    user: userWithRole,
    isAuthenticated: true,
    hasRole: (roles: string | string[]) => {
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(userWithRole.role);
    },
    isOwner: (resourceOwnerId: string) => {
      return userWithRole.id === resourceOwnerId;
    },
  };
}

/**
 * Authentication guard for API routes
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: AuthContext,
    params?: Record<string, unknown>,
  ) => Promise<NextResponse>,
  options: {
    roles?: string | string[];
    requireAuth?: boolean;
  } = {},
) {
  return async (request: NextRequest, { params }: { params?: Record<string, unknown> } = {}) => {
    const authContext = await createAuthContext(request);

    // Check authentication requirement
    if (options.requireAuth !== false && !authContext.isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    // Check role requirement
    if (options.roles && authContext.isAuthenticated) {
      if (!authContext.hasRole(options.roles)) {
        return NextResponse.json(
          { error: "Insufficient permissions", code: "FORBIDDEN" },
          { status: 403 },
        );
      }
    }

    return handler(request, authContext, params);
  };
}

/**
 * Resource ownership validation
 */
export async function validateResourceOwnership(
  supabase: { from: (table: string) => { select: (field: string) => { eq: (field: string, value: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }> } } } },
  table: string,
  resourceId: string,
  userId: string,
  ownerField: string = "created_by",
): Promise<boolean> {
  const { data, error } = await supabase
    .from(table)
    .select(ownerField)
    .eq("id", resourceId)
    .single();

  if (error || !data) {
    return false;
  }

  return data[ownerField] === userId;
}

/**
 * College ownership validation (for college-specific resources)
 */
export async function validateCollegeOwnership(
  supabase: { from: (table: string) => { select: (field: string) => { eq: (field: string, value: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }> } } } },
  collegeId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("colleges")
    .select("created_by")
    .eq("id", collegeId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.created_by === userId;
}

/**
 * Rate limiting middleware
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  handler: (
    request: NextRequest,
    context: AuthContext,
    params?: Record<string, unknown>,
  ) => Promise<NextResponse>,
  options: {
    maxRequests: number;
    windowMs: number;
    keyGenerator?: (request: NextRequest, context: AuthContext) => string;
  },
) {
  return async (request: NextRequest, context: AuthContext, params?: Record<string, unknown>) => {
    const key = options.keyGenerator
      ? options.keyGenerator(request, context)
      : context.user?.id || (request as { ip?: string }).ip || "anonymous";

    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Clean up old entries
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetTime < windowStart) {
        rateLimitMap.delete(k);
      }
    }

    const current = rateLimitMap.get(key) || {
      count: 0,
      resetTime: now + options.windowMs,
    };

    if (current.count >= options.maxRequests && current.resetTime > now) {
      return NextResponse.json(
        { error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" },
        { status: 429 },
      );
    }

    current.count++;
    rateLimitMap.set(key, current);

    return handler(request, context, params);
  };
}

/**
 * Input validation middleware
 */
export function withValidation<T>(
  handler: (
    request: NextRequest,
    context: AuthContext,
    validatedData: T,
    params?: Record<string, unknown>,
  ) => Promise<NextResponse>,
  schema: {
    validate: (data: unknown) => { success: boolean; data?: T; error?: unknown };
  },
) {
  return async (request: NextRequest, context: AuthContext, params?: Record<string, unknown>) => {
    try {
      const body = await request.json();
      const validation = schema.validate(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            error: "Validation failed",
            code: "VALIDATION_ERROR",
            details: validation.error,
          },
          { status: 400 },
        );
      }

      return handler(request, context, validation.data!, params);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON", code: "INVALID_JSON" },
        { status: 400 },
      );
    }
  };
}
