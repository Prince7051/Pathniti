/**
 * Authentication Performance Monitoring Utilities
 *
 * This module provides utilities to monitor and track authentication
 * performance metrics to identify bottlenecks and optimize user experience.
 */

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

class AuthPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100; // Keep only the last 100 metrics

  /**
   * Start timing an authentication operation
   */
  startTimer(operation: string) {
    const startTime = performance.now();

    return {
      end: (success: boolean = true, error?: string) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.recordMetric({
          operation,
          duration,
          timestamp: Date.now(),
          success,
          error,
        });

        // Log performance in development
        if (process.env.NODE_ENV === "development") {
          const status = success ? "✅" : "❌";
          console.log(
            `[Auth Performance] ${status} ${operation}: ${duration.toFixed(2)}ms`,
          );
          if (error) {
            console.log(`[Auth Performance] Error: ${error}`);
          }
        }

        return duration;
      },
    };
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Keep only the last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get performance statistics for a specific operation
   */
  getOperationStats(operation: string) {
    const operationMetrics = this.metrics.filter(
      (m) => m.operation === operation,
    );

    if (operationMetrics.length === 0) {
      return null;
    }

    const durations = operationMetrics.map((m) => m.duration);
    const successCount = operationMetrics.filter((m) => m.success).length;
    const errorCount = operationMetrics.length - successCount;

    return {
      operation,
      totalCalls: operationMetrics.length,
      successCount,
      errorCount,
      successRate: (successCount / operationMetrics.length) * 100,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      lastCall: operationMetrics[operationMetrics.length - 1],
    };
  }

  /**
   * Get overall performance summary
   */
  getOverallStats() {
    if (this.metrics.length === 0) {
      return null;
    }

    const operations = [...new Set(this.metrics.map((m) => m.operation))];
    const operationStats = operations
      .map((op) => this.getOperationStats(op))
      .filter((op): op is NonNullable<typeof op> => op !== null);

    const totalCalls = this.metrics.length;
    const successCount = this.metrics.filter((m) => m.success).length;
    const errorCount = totalCalls - successCount;

    return {
      totalCalls,
      successCount,
      errorCount,
      successRate: (successCount / totalCalls) * 100,
      operations: operationStats,
      timeRange: {
        start: this.metrics[0]?.timestamp,
        end: this.metrics[this.metrics.length - 1]?.timestamp,
      },
    };
  }

  /**
   * Get slow operations (above threshold)
   */
  getSlowOperations(thresholdMs: number = 1000) {
    return this.metrics
      .filter((m) => m.duration > thresholdMs)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10); // Top 10 slowest
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10) {
    return this.metrics
      .filter((m) => !m.success)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return {
      metrics: [...this.metrics],
      summary: this.getOverallStats(),
      slowOperations: this.getSlowOperations(),
      recentErrors: this.getRecentErrors(),
    };
  }
}

// Global instance
export const authPerformanceMonitor = new AuthPerformanceMonitor();

/**
 * Hook to access performance monitoring in components
 */
export function useAuthPerformance() {
  return {
    getStats: (operation?: string) =>
      operation
        ? authPerformanceMonitor.getOperationStats(operation)
        : authPerformanceMonitor.getOverallStats(),
    getSlowOperations: (threshold?: number) =>
      authPerformanceMonitor.getSlowOperations(threshold),
    getRecentErrors: (limit?: number) =>
      authPerformanceMonitor.getRecentErrors(limit),
    exportMetrics: () => authPerformanceMonitor.exportMetrics(),
  };
}

/**
 * Development helper to log performance summary
 */
export function logAuthPerformanceSummary() {
  if (process.env.NODE_ENV === "development") {
    const stats = authPerformanceMonitor.getOverallStats();
    if (stats) {
      console.group("🔍 Auth Performance Summary");
      console.log(`Total Operations: ${stats.totalCalls}`);
      console.log(`Success Rate: ${stats.successRate.toFixed(1)}%`);
      console.log(`Operations:`);
      stats.operations.forEach((op) => {
        if (op) {
          console.log(
            `  ${op.operation}: ${op.averageDuration.toFixed(2)}ms avg (${op.totalCalls} calls)`,
          );
        }
      });

      const slowOps = authPerformanceMonitor.getSlowOperations(500);
      if (slowOps.length > 0) {
        console.log(`Slow Operations (>500ms):`);
        slowOps.forEach((op) => {
          console.log(`  ${op.operation}: ${op.duration.toFixed(2)}ms`);
        });
      }

      console.groupEnd();
    }
  }
}
