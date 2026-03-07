/**
 * Cache Service for College Profiles
 * Implements in-memory caching with TTL and LRU eviction
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
}

class CacheService<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTTL: number;
  private stats: CacheStats;

  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) {
    // 5 minutes default TTL
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      maxSize,
    };

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.defaultTTL;

    // If cache is full, remove least recently used item
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: entryTTL,
      accessCount: 0,
      lastAccessed: now,
    });

    this.stats.size = this.cache.size;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();

    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
    this.stats.size = this.cache.size;
  }

  // Get cache entries sorted by access frequency (for debugging)
  getTopEntries(
    limit = 10,
  ): Array<{ key: string; accessCount: number; lastAccessed: number }> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed,
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }
}

// College profile cache with longer TTL since profiles don't change frequently
export const collegeProfileCache = new CacheService<unknown>(50, 10 * 60 * 1000); // 10 minutes TTL

// College list cache with shorter TTL for more dynamic data
export const collegeListCache = new CacheService<unknown>(20, 5 * 60 * 1000); // 5 minutes TTL

// Application cache with very short TTL since applications change frequently
export const applicationCache = new CacheService<unknown>(30, 2 * 60 * 1000); // 2 minutes TTL

// Course cache with medium TTL
export const courseCache = new CacheService<unknown>(40, 15 * 60 * 1000); // 15 minutes TTL

// Notice cache with short TTL
export const noticeCache = new CacheService<unknown>(25, 3 * 60 * 1000); // 3 minutes TTL

/**
 * Cache key generators for consistent key naming
 */
export const CacheKeys = {
  collegeProfile: (slug: string) => `college:profile:${slug}`,
  collegeList: (filters: Record<string, unknown>) => {
    const sortedKeys = Object.keys(filters).sort();
    const filterString = sortedKeys
      .map((key) => `${key}:${filters[key]}`)
      .join("|");
    return `colleges:list:${filterString}`;
  },
  collegeApplications: (
    collegeId: string,
    page: number,
    filters: Record<string, unknown>,
  ) => {
    const sortedKeys = Object.keys(filters).sort();
    const filterString = sortedKeys
      .map((key) => `${key}:${filters[key]}`)
      .join("|");
    return `college:${collegeId}:applications:${page}:${filterString}`;
  },
  collegeCourses: (collegeId: string) => `college:${collegeId}:courses`,
  collegeNotices: (collegeId: string) => `college:${collegeId}:notices`,
  collegeStats: (collegeId: string) => `college:${collegeId}:stats`,
  studentApplications: (studentId: string) =>
    `student:${studentId}:applications`,
};

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  invalidateCollegeProfile: (slug: string) => {
    collegeProfileCache.delete(CacheKeys.collegeProfile(slug));
  },

  invalidateCollegeData: (collegeId: string, slug?: string) => {
    if (slug) {
      collegeProfileCache.delete(CacheKeys.collegeProfile(slug));
    }
    courseCache.delete(CacheKeys.collegeCourses(collegeId));
    noticeCache.delete(CacheKeys.collegeNotices(collegeId));
    applicationCache.delete(CacheKeys.collegeStats(collegeId));

    // Clear college list cache since it might contain this college
    collegeListCache.clear();
  },

  invalidateApplicationData: (collegeId: string, studentId?: string) => {
    // Clear application-related caches
    const applicationKeys = Array.from(
      applicationCache.getStats().size > 0
        ? applicationCache.getTopEntries(100).map((entry) => entry.key)
        : [],
    ).filter((key) => key.includes(`college:${collegeId}:applications`));

    applicationKeys.forEach((key) => applicationCache.delete(key));

    if (studentId) {
      applicationCache.delete(CacheKeys.studentApplications(studentId));
    }
  },

  invalidateAllCaches: () => {
    collegeProfileCache.clear();
    collegeListCache.clear();
    applicationCache.clear();
    courseCache.clear();
    noticeCache.clear();
  },
};

/**
 * Cache warming utilities
 */
export const CacheWarming = {
  warmCollegeProfile: async (
    slug: string,
    fetchFunction: () => Promise<unknown>,
  ) => {
    if (!collegeProfileCache.has(CacheKeys.collegeProfile(slug))) {
      try {
        const data = await fetchFunction();
        collegeProfileCache.set(CacheKeys.collegeProfile(slug), data);
      } catch (error) {
        console.error(
          `Failed to warm cache for college profile ${slug}:`,
          error,
        );
      }
    }
  },

  warmPopularColleges: async (
    slugs: string[],
    fetchFunction: (slug: string) => Promise<unknown>,
  ) => {
    const promises = slugs.map((slug) =>
      CacheWarming.warmCollegeProfile(slug, () => fetchFunction(slug)),
    );

    await Promise.allSettled(promises);
  },
};

export default CacheService;
