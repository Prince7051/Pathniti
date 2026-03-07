/**
 * Lazy loading utilities for college list and search functionality
 * Provides efficient data loading with caching and pagination
 */

// Removed direct supabase import - now using API routes

export interface LazyLoadConfig {
  pageSize: number;
  cacheTimeout: number; // in milliseconds
  preloadThreshold: number; // items remaining before preloading next page
}

export interface LazyLoadResult<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount?: number;
  isLoading: boolean;
  error?: string;
}

export interface CollegeSearchOptions {
  query?: string;
  state?: string;
  city?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

// Cache interface
interface CacheEntry<T> {
  data: T[];
  timestamp: number;
  hasMore: boolean;
  totalCount?: number;
}

class LazyLoadCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private timeout: number;

  constructor(timeout: number = 5 * 60 * 1000) {
    // 5 minutes default
    this.timeout = timeout;
  }

  get(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.timeout) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  set(key: string, data: T[], hasMore: boolean, totalCount?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hasMore,
      totalCount,
    });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.timeout) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instances
const collegeCache = new LazyLoadCache<unknown>(10 * 60 * 1000); // 10 minutes for colleges
const searchCache = new LazyLoadCache<unknown>(2 * 60 * 1000); // 2 minutes for search results

// Cleanup caches periodically
setInterval(
  () => {
    collegeCache.cleanup();
    searchCache.cleanup();
  },
  5 * 60 * 1000,
); // Every 5 minutes

export class CollegeLazyLoader {
  private config: LazyLoadConfig;

  constructor(config: Partial<LazyLoadConfig> = {}) {
    this.config = {
      pageSize: 50,
      cacheTimeout: 10 * 60 * 1000, // 10 minutes
      preloadThreshold: 10,
      ...config,
    };
  }

  /**
   * Load colleges with lazy loading and caching
   */
  async loadColleges(
    options: CollegeSearchOptions = {},
    useCache: boolean = true,
  ): Promise<LazyLoadResult<unknown>> {
    const cacheKey = this.generateCacheKey("colleges", options);

    // Check cache first
    if (useCache) {
      const cached = collegeCache.get(cacheKey);
      if (cached) {
        return {
          data: cached.data,
          hasMore: cached.hasMore,
          totalCount: cached.totalCount,
          isLoading: false,
        };
      }
    }

    try {
      const { data, error, count } = await this.fetchColleges(options);

      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Unknown error');
      }

      const hasMore = (data?.length || 0) === this.config.pageSize;
      const result: LazyLoadResult<unknown> = {
        data: data || [],
        hasMore,
        totalCount: count || undefined,
        isLoading: false,
      };

      // Cache the result
      if (useCache && data) {
        collegeCache.set(cacheKey, data, hasMore, count || undefined);
      }

      return result;
    } catch (error) {
      return {
        data: [],
        hasMore: false,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to load colleges",
      };
    }
  }

  /**
   * Search colleges with debouncing and caching
   */
  async searchColleges(
    query: string,
    options: Omit<CollegeSearchOptions, "query"> = {},
    useCache: boolean = true,
  ): Promise<LazyLoadResult<unknown>> {
    if (!query.trim()) {
      return this.loadColleges(options, useCache);
    }

    const searchOptions = { ...options, query: query.trim() };
    const cacheKey = this.generateCacheKey("search", searchOptions);

    // Check cache first
    if (useCache) {
      const cached = searchCache.get(cacheKey);
      if (cached) {
        return {
          data: cached.data,
          hasMore: cached.hasMore,
          totalCount: cached.totalCount,
          isLoading: false,
        };
      }
    }

    try {
      const { data, error, count } = await this.fetchColleges(searchOptions);

      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Unknown error');
      }

      const hasMore = (data?.length || 0) === this.config.pageSize;
      const result: LazyLoadResult<unknown> = {
        data: data || [],
        hasMore,
        totalCount: count || undefined,
        isLoading: false,
      };

      // Cache the result
      if (useCache && data) {
        searchCache.set(cacheKey, data, hasMore, count || undefined);
      }

      return result;
    } catch (error) {
      return {
        data: [],
        hasMore: false,
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to search colleges",
      };
    }
  }

  /**
   * Load more colleges (pagination)
   */
  async loadMore(
    currentData: Record<string, unknown>[],
    options: CollegeSearchOptions = {},
  ): Promise<LazyLoadResult<unknown>> {
    const nextOptions = {
      ...options,
      offset: (options.offset || 0) + this.config.pageSize,
    };

    const result = await this.loadColleges(nextOptions, false); // Don't use cache for pagination

    return {
      ...result,
      data: [...currentData, ...result.data],
    };
  }

  /**
   * Preload next page if threshold is reached
   */
  shouldPreload(currentIndex: number, totalLoaded: number): boolean {
    const remaining = totalLoaded - currentIndex - 1; // -1 because currentIndex is 0-based
    return remaining <= this.config.preloadThreshold;
  }

  /**
   * Invalidate cache for colleges
   */
  invalidateCache(pattern?: string): void {
    collegeCache.invalidate(pattern);
    searchCache.invalidate(pattern);
  }

  /**
   * Fetch colleges from API route instead of direct database access
   */
  private async fetchColleges(options: CollegeSearchOptions) {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (options.query) params.append("search", options.query);
    if (options.state) params.append("state", options.state);
    if (options.type) params.append("type", options.type);
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.offset) params.append("offset", options.offset.toString());

    // Call the API route
    const response = await fetch(`/api/colleges?${params.toString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    // Return in the format expected by the lazy loader
    return {
      data: result.data || [],
      error: null,
      count: result.total || 0
    };
  }

  /**
   * Generate cache key for options
   */
  private generateCacheKey(
    prefix: string,
    options: CollegeSearchOptions,
  ): string {
    const keyParts = [prefix];

    if (options.query) keyParts.push(`q:${options.query}`);
    if (options.state) keyParts.push(`s:${options.state}`);
    if (options.city) keyParts.push(`c:${options.city}`);
    if (options.type) keyParts.push(`t:${options.type}`);
    if (options.limit) keyParts.push(`l:${options.limit}`);
    if (options.offset) keyParts.push(`o:${options.offset}`);

    return keyParts.join("|");
  }
}

/**
 * React hook for lazy loading colleges
 */
export function useCollegeLazyLoader(config?: Partial<LazyLoadConfig>) {
  const loader = new CollegeLazyLoader(config);

  return {
    loadColleges: loader.loadColleges.bind(loader),
    searchColleges: loader.searchColleges.bind(loader),
    loadMore: loader.loadMore.bind(loader),
    shouldPreload: loader.shouldPreload.bind(loader),
    invalidateCache: loader.invalidateCache.bind(loader),
  };
}

/**
 * Virtualization helper for large lists
 */
export class VirtualizedList {
  private itemHeight: number;
  private containerHeight: number;
  private overscan: number;

  constructor(
    itemHeight: number,
    containerHeight: number,
    overscan: number = 5,
  ) {
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
    this.overscan = overscan;
  }

  /**
   * Calculate visible range for virtualization
   */
  getVisibleRange(
    scrollTop: number,
    totalItems: number,
  ): {
    startIndex: number;
    endIndex: number;
    visibleItems: number;
  } {
    const visibleItems = Math.ceil(this.containerHeight / this.itemHeight);
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / this.itemHeight) - this.overscan,
    );
    const endIndex = Math.min(
      totalItems - 1,
      startIndex + visibleItems + this.overscan * 2,
    );

    return {
      startIndex,
      endIndex,
      visibleItems,
    };
  }

  /**
   * Calculate total height for virtual scrolling
   */
  getTotalHeight(totalItems: number): number {
    return totalItems * this.itemHeight;
  }

  /**
   * Calculate offset for visible items
   */
  getOffsetY(startIndex: number): number {
    return startIndex * this.itemHeight;
  }
}

// Export singleton instance for convenience
export const collegeLazyLoader = new CollegeLazyLoader();
