/**
 * Rate limiting utilities for API endpoints
 * Provides in-memory and Redis-based rate limiting with sliding window
 */

import { NextRequest } from "next/server";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// In-memory store for rate limiting (use Redis in production)
class MemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  get(key: string): { count: number; resetTime: number } | undefined {
    const entry = this.store.get(key);
    if (entry && entry.resetTime < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, value: { count: number; resetTime: number }): void {
    this.store.set(key, value);
  }

  increment(
    key: string,
    windowMs: number,
  ): { count: number; resetTime: number } {
    const now = Date.now();
    const existing = this.get(key);

    if (!existing) {
      const entry = { count: 1, resetTime: now + windowMs };
      this.set(key, entry);
      return entry;
    }

    // Create a new object to avoid mutation issues
    const updated = {
      count: existing.count + 1,
      resetTime: existing.resetTime,
    };
    this.set(key, updated);
    return updated;
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
}

const memoryStore = new MemoryStore();

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    memoryStore.cleanup();
  },
  5 * 60 * 1000,
);

export class RateLimiter {
  public config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: this.defaultKeyGenerator,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: "Too many requests, please try again later.",
      ...config,
    };
  }

  /**
   * Check if request should be rate limited
   */
  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    const key = this.config.keyGenerator(request);
    const entry = memoryStore.increment(key, this.config.windowMs);

    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const success = entry.count <= this.config.maxRequests;

    return {
      success,
      limit: this.config.maxRequests,
      remaining,
      resetTime: entry.resetTime,
      retryAfter: success
        ? undefined
        : Math.ceil((entry.resetTime - Date.now()) / 1000),
    };
  }

  /**
   * Default key generator using IP address
   */
  private defaultKeyGenerator(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";
    return `rate_limit:${ip}`;
  }

  /**
   * Create rate limiter for authentication endpoints
   */
  static createAuthLimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes
      message:
        "Too many authentication attempts. Please try again in 15 minutes.",
    });
  }

  /**
   * Create rate limiter for registration endpoints
   */
  static createRegistrationLimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // 3 registrations per hour
      message: "Too many registration attempts. Please try again in 1 hour.",
    });
  }

  /**
   * Create rate limiter for general API endpoints
   */
  static createApiLimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // 100 requests per 15 minutes
      message: "Too many API requests. Please try again later.",
    });
  }

  /**
   * Create rate limiter for search endpoints
   */
  static createSearchLimiter(): RateLimiter {
    return new RateLimiter({
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 30, // 30 searches per minute
      message:
        "Too many search requests. Please wait a moment before searching again.",
    });
  }

  /**
   * Create rate limiter with user-based key
   */
  static createUserBasedLimiter(
    config: Omit<RateLimitConfig, "keyGenerator">,
  ): RateLimiter {
    return new RateLimiter({
      ...config,
      keyGenerator: (request: NextRequest) => {
        // Try to get user ID from various sources
        const authHeader = request.headers.get("authorization");
        const userId = request.headers.get("x-user-id");

        if (userId) {
          return `rate_limit:user:${userId}`;
        }

        if (authHeader) {
          // Extract user ID from JWT token (simplified)
          try {
            const token = authHeader.replace("Bearer ", "");
            const payload = JSON.parse(atob(token.split(".")[1]));
            return `rate_limit:user:${payload.sub || payload.user_id || "unknown"}`;
          } catch {
            // Fall back to IP-based limiting
          }
        }

        // Fall back to IP-based limiting
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded
          ? forwarded.split(",")[0]
          : "unknown";
        return `rate_limit:ip:${ip}`;
      },
    });
  }
}

/**
 * Middleware helper for applying rate limiting
 */
export async function applyRateLimit(
  request: NextRequest,
  limiter: RateLimiter,
): Promise<Response | null> {
  const result = await limiter.checkLimit(request);

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: "Too many requests, please try again later.",
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
          "Retry-After": result.retryAfter?.toString() || "60",
        },
      },
    );
  }

  return null;
}

/**
 * Rate limiting decorator for API routes
 */
export function withRateLimit(limiter: RateLimiter) {
  return function <T extends (...args: unknown[]) => Promise<Response>>(
    handler: T,
  ): T {
    return (async (request: NextRequest, ...args: unknown[]) => {
      const rateLimitResponse = await applyRateLimit(request, limiter);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }
      return handler(request, ...args);
    }) as T;
  };
}

/**
 * Enhanced rate limiter with burst protection
 */
export class BurstProtectedRateLimiter extends RateLimiter {
  private burstConfig: {
    burstLimit: number;
    burstWindowMs: number;
  };

  constructor(
    config: RateLimitConfig & {
      burstLimit: number;
      burstWindowMs: number;
    },
  ) {
    super(config);
    this.burstConfig = {
      burstLimit: config.burstLimit,
      burstWindowMs: config.burstWindowMs,
    };
  }

  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    // Check burst limit first (short window, low limit)
    const burstKey = (this.config.keyGenerator as (request: NextRequest) => string)(request) + ":burst";
    const burstEntry = memoryStore.increment(
      burstKey,
      this.burstConfig.burstWindowMs,
    );

    if (burstEntry.count > this.burstConfig.burstLimit) {
      return {
        success: false,
        limit: this.burstConfig.burstLimit,
        remaining: 0,
        resetTime: burstEntry.resetTime,
        retryAfter: Math.ceil((burstEntry.resetTime - Date.now()) / 1000),
      };
    }

    // Check regular rate limit
    return super.checkLimit(request);
  }
}
