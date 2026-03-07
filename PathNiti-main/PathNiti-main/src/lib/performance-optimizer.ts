/**
 * Performance Optimizer for PathNiti
 * Advanced optimization strategies for SIH finals
 */

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  apiResponseTime: number;
  cacheHitRate: number;
  bundleSize: number;
  imageOptimization: number;
  lazyLoading: number;
}

export interface OptimizationConfig {
  enableCodeSplitting: boolean;
  enableImageOptimization: boolean;
  enableLazyLoading: boolean;
  enableCaching: boolean;
  enableCompression: boolean;
  enableCDN: boolean;
  enableServiceWorker: boolean;
  enablePreloading: boolean;
  enableVirtualization: boolean;
  enableDebouncing: boolean;
}

export class PerformanceOptimizer {
  private config: OptimizationConfig;
  private metrics: PerformanceMetrics;
  private observers: Map<string, PerformanceObserver> = new Map();
  private cache: Map<string, any> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableCodeSplitting: true,
      enableImageOptimization: true,
      enableLazyLoading: true,
      enableCaching: true,
      enableCompression: true,
      enableCDN: true,
      enableServiceWorker: true,
      enablePreloading: true,
      enableVirtualization: true,
      enableDebouncing: true,
      ...config
    };

    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      apiResponseTime: 0,
      cacheHitRate: 0,
      bundleSize: 0,
      imageOptimization: 0,
      lazyLoading: 0
    };

    this.initializePerformanceMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor page load performance
    this.observePageLoad();
    
    // Monitor memory usage
    this.observeMemoryUsage();
    
    // Monitor API performance
    this.observeAPIPerformance();
    
    // Monitor render performance
    this.observeRenderPerformance();
  }

  /**
   * Monitor page load performance
   */
  private observePageLoad(): void {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          this.metrics.loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.set('navigation', observer);
  }

  /**
   * Monitor memory usage
   */
  private observeMemoryUsage(): void {
    if (typeof window === 'undefined') return;

    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      }
    };

    setInterval(updateMemoryUsage, 5000);
    updateMemoryUsage();
  }

  /**
   * Monitor API performance
   */
  private observeAPIPerformance(): void {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'resource' && entry.name.includes('/api/')) {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.metrics.apiResponseTime = resourceEntry.responseEnd - resourceEntry.requestStart;
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.set('resource', observer);
  }

  /**
   * Monitor render performance
   */
  private observeRenderPerformance(): void {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          if (entry.name === 'render-time') {
            this.metrics.renderTime = entry.duration;
          }
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });
    this.observers.set('measure', observer);
  }

  /**
   * Optimize images
   */
  optimizeImages(): void {
    if (!this.config.enableImageOptimization || typeof window === 'undefined') return;

    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      this.optimizeImage(img as HTMLImageElement);
    });
  }

  private optimizeImage(img: HTMLImageElement): void {
    // Lazy loading
    if (this.config.enableLazyLoading && !img.loading) {
      img.loading = 'lazy';
    }

    // WebP format with fallback
    if (img.src && !img.src.includes('.webp')) {
      const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      const fallbackSrc = img.src;
      
      // Check WebP support
      const webpSupported = this.checkWebPSupport();
      if (webpSupported) {
        img.src = webpSrc;
        img.onerror = () => {
          img.src = fallbackSrc;
        };
      }
    }

    // Responsive images
    if (img.srcset) {
      img.sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
    }
  }

  /**
   * Check WebP support
   */
  private checkWebPSupport(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Implement code splitting
   */
  async loadComponent(componentPath: string): Promise<any> {
    if (!this.config.enableCodeSplitting) {
      return import(componentPath);
    }

    const cacheKey = `component_${componentPath}`;
    
    if (this.cache.has(cacheKey)) {
      this.metrics.cacheHitRate += 1;
      return this.cache.get(cacheKey);
    }

    try {
      const component = await import(componentPath);
      this.cache.set(cacheKey, component);
      return component;
    } catch (error) {
      console.error(`Failed to load component ${componentPath}:`, error);
      throw error;
    }
  }

  /**
   * Implement lazy loading
   */
  setupLazyLoading(): void {
    if (!this.config.enableLazyLoading || typeof window === 'undefined') return;

    const lazyElements = document.querySelectorAll('[data-lazy]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          this.loadLazyElement(element);
          observer.unobserve(element);
        }
      });
    });

    lazyElements.forEach((element) => {
      observer.observe(element);
    });
  }

  private loadLazyElement(element: HTMLElement): void {
    const src = element.getAttribute('data-src');
    const component = element.getAttribute('data-component');
    
    if (src && element.tagName === 'IMG') {
      (element as HTMLImageElement).src = src;
      element.removeAttribute('data-src');
    }
    
    if (component) {
      this.loadComponent(component).then((Component) => {
        // Render component
        if (typeof Component.default === 'function') {
          const instance = new Component.default();
          element.appendChild(instance);
        }
      });
    }
  }

  /**
   * Implement caching strategy
   */
  async cacheData(key: string, data: any, ttl: number = 300000): Promise<void> {
    if (!this.config.enableCaching) return;

    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl
    };

    this.cache.set(key, cacheEntry);
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
      } catch (error) {
        console.warn('Failed to cache data in localStorage:', error);
      }
    }
  }

  async getCachedData(key: string): Promise<any> {
    if (!this.config.enableCaching) return null;

    // Check memory cache first
    const memoryEntry = this.cache.get(key);
    if (memoryEntry && this.isCacheValid(memoryEntry)) {
      this.metrics.cacheHitRate += 1;
      return memoryEntry.data;
    }

    // Check localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          const entry = JSON.parse(stored);
          if (this.isCacheValid(entry)) {
            this.metrics.cacheHitRate += 1;
            this.cache.set(key, entry);
            return entry.data;
          }
        }
      } catch (error) {
        console.warn('Failed to retrieve cached data:', error);
      }
    }

    return null;
  }

  private isCacheValid(entry: any): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Implement debouncing
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    key: string
  ): (...args: Parameters<T>) => void {
    if (!this.config.enableDebouncing) {
      return func;
    }

    return (...args: Parameters<T>) => {
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        func(...args);
        this.debounceTimers.delete(key);
      }, delay);

      this.debounceTimers.set(key, timer);
    };
  }

  /**
   * Implement throttling
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Implement virtualization for large lists
   */
  setupVirtualization(container: HTMLElement, items: any[], itemHeight: number): void {
    if (!this.config.enableVirtualization) return;

    const containerHeight = container.clientHeight;
    const visibleItems = Math.ceil(containerHeight / itemHeight) + 2;
    const totalItems = items.length;

    let startIndex = 0;
    let endIndex = Math.min(startIndex + visibleItems, totalItems);

    const renderItems = () => {
      const visibleItems = items.slice(startIndex, endIndex);
      container.innerHTML = '';
      
      visibleItems.forEach((item, index) => {
        const element = document.createElement('div');
        element.style.height = `${itemHeight}px`;
        element.textContent = item.text || `Item ${startIndex + index}`;
        container.appendChild(element);
      });
    };

    const handleScroll = this.throttle((event: Event) => {
      const scrollTop = (event.target as HTMLElement).scrollTop;
      const newStartIndex = Math.floor(scrollTop / itemHeight);
      
      if (newStartIndex !== startIndex) {
        startIndex = newStartIndex;
        endIndex = Math.min(startIndex + visibleItems, totalItems);
        renderItems();
      }
    }, 16);

    container.addEventListener('scroll', handleScroll);
    renderItems();
  }

  /**
   * Implement preloading
   */
  preloadResources(resources: string[]): void {
    if (!this.config.enablePreloading || typeof window === 'undefined') return;

    resources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.match(/\.(jpg|jpeg|png|webp)$/)) {
        link.as = 'image';
      }
      
      document.head.appendChild(link);
    });
  }

  /**
   * Implement service worker
   */
  async registerServiceWorker(): Promise<void> {
    if (!this.config.enableServiceWorker || typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Optimize API calls
   */
  async optimizeAPICall<T>(
    url: string,
    options: RequestInit = {},
    cacheKey?: string
  ): Promise<T> {
    // Check cache first
    if (cacheKey) {
      const cached = await this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept-Encoding': 'gzip, deflate, br',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the response
      if (cacheKey) {
        await this.cacheData(cacheKey, data);
      }

      this.metrics.apiResponseTime = Date.now() - startTime;
      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  /**
   * Bundle size optimization
   */
  analyzeBundleSize(): void {
    if (typeof window === 'undefined') return;

    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;

    scripts.forEach((script) => {
      const src = (script as HTMLScriptElement).src;
      if (src && !src.includes('localhost')) {
        // Estimate size based on URL patterns
        if (src.includes('chunk')) {
          totalSize += 50; // Estimated KB
        } else if (src.includes('vendor')) {
          totalSize += 200; // Estimated KB
        } else {
          totalSize += 100; // Estimated KB
        }
      }
    });

    this.metrics.bundleSize = totalSize;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Generate performance report
   */
  generateReport(): any {
    const metrics = this.getMetrics();
    
    return {
      timestamp: new Date().toISOString(),
      metrics,
      recommendations: this.generateRecommendations(metrics),
      score: this.calculatePerformanceScore(metrics)
    };
  }

  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.loadTime > 3000) {
      recommendations.push('Consider implementing code splitting to reduce initial bundle size');
    }

    if (metrics.memoryUsage > 100) {
      recommendations.push('Memory usage is high - consider implementing cleanup strategies');
    }

    if (metrics.apiResponseTime > 1000) {
      recommendations.push('API response times are slow - consider implementing caching');
    }

    if (metrics.cacheHitRate < 0.5) {
      recommendations.push('Cache hit rate is low - consider improving caching strategy');
    }

    if (metrics.bundleSize > 500) {
      recommendations.push('Bundle size is large - consider tree shaking and code splitting');
    }

    return recommendations;
  }

  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    let score = 100;

    // Load time scoring
    if (metrics.loadTime > 3000) score -= 20;
    else if (metrics.loadTime > 2000) score -= 10;

    // Memory usage scoring
    if (metrics.memoryUsage > 100) score -= 15;
    else if (metrics.memoryUsage > 50) score -= 5;

    // API response time scoring
    if (metrics.apiResponseTime > 1000) score -= 15;
    else if (metrics.apiResponseTime > 500) score -= 5;

    // Cache hit rate scoring
    if (metrics.cacheHitRate < 0.3) score -= 10;
    else if (metrics.cacheHitRate < 0.5) score -= 5;

    // Bundle size scoring
    if (metrics.bundleSize > 500) score -= 10;
    else if (metrics.bundleSize > 300) score -= 5;

    return Math.max(0, score);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
    
    this.cache.clear();
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();
