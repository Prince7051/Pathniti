"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { collegeProfileServiceClient } from "@/lib/services/college-profile-service-client";

interface PerformanceMetrics {
  cacheStats: {
    profileCache: {
      hits: number;
      misses: number;
      size: number;
      maxSize: number;
    };
    listCache: {
      hits: number;
      misses: number;
      size: number;
      maxSize: number;
    };
    courseCache: {
      hits: number;
      misses: number;
      size: number;
      maxSize: number;
    };
    noticeCache: {
      hits: number;
      misses: number;
      size: number;
      maxSize: number;
    };
  };
  pageLoadTime?: number;
  apiResponseTimes: number[];
  memoryUsage?: number;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or for admin users
    const isDev = process.env.NODE_ENV === "development";
    const isAdmin = localStorage.getItem("user_role") === "admin";

    if (isDev || isAdmin) {
      setIsVisible(true);
      loadMetrics();

      // Update metrics every 60 seconds (reduced frequency to improve performance)
      const interval = setInterval(loadMetrics, 60000);
      return () => clearInterval(interval);
    }
  }, []);

  const loadMetrics = async () => {
    try {
      // Get cache statistics (client-side service doesn't have caching)
      const cacheStats = {
        profileCache: { hits: 0, misses: 0, size: 0, maxSize: 0 },
        listCache: { hits: 0, misses: 0, size: 0, maxSize: 0 },
        courseCache: { hits: 0, misses: 0, size: 0, maxSize: 0 },
        noticeCache: { hits: 0, misses: 0, size: 0, maxSize: 0 },
      };

      // Get performance metrics
      const pageLoadTime = performance.timing
        ? performance.timing.loadEventEnd - performance.timing.navigationStart
        : undefined;

      // Get memory usage if available
      const memoryUsage = (
        performance as Performance & { memory?: { usedJSHeapSize?: number } }
      ).memory?.usedJSHeapSize;

      setMetrics({
        cacheStats,
        pageLoadTime,
        apiResponseTimes: [], // This would be populated by API call tracking
        memoryUsage,
      });
    } catch (error) {
      console.error("Error loading performance metrics:", error);
    }
  };

  const clearCaches = () => {
    // Client-side service doesn't have caching, just reload metrics
    loadMetrics();
  };

  const calculateHitRate = (hits: number, misses: number) => {
    const total = hits + misses;
    return total > 0 ? ((hits / total) * 100).toFixed(1) : "0.0";
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!isVisible || !metrics) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            Performance Monitor
            <Button
              variant="outline"
              size="sm"
              onClick={clearCaches}
              className="text-xs"
            >
              Clear Caches
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* Cache Statistics */}
          <div>
            <h4 className="font-medium mb-2">Cache Performance</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Profile Cache:</span>
                  <Badge variant="secondary" className="text-xs">
                    {calculateHitRate(
                      metrics.cacheStats.profileCache.hits,
                      metrics.cacheStats.profileCache.misses,
                    )}
                    %
                  </Badge>
                </div>
                <div className="text-gray-500">
                  {metrics.cacheStats.profileCache.size}/
                  {metrics.cacheStats.profileCache.maxSize} entries
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>List Cache:</span>
                  <Badge variant="secondary" className="text-xs">
                    {calculateHitRate(
                      metrics.cacheStats.listCache.hits,
                      metrics.cacheStats.listCache.misses,
                    )}
                    %
                  </Badge>
                </div>
                <div className="text-gray-500">
                  {metrics.cacheStats.listCache.size}/
                  {metrics.cacheStats.listCache.maxSize} entries
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Course Cache:</span>
                  <Badge variant="secondary" className="text-xs">
                    {calculateHitRate(
                      metrics.cacheStats.courseCache.hits,
                      metrics.cacheStats.courseCache.misses,
                    )}
                    %
                  </Badge>
                </div>
                <div className="text-gray-500">
                  {metrics.cacheStats.courseCache.size}/
                  {metrics.cacheStats.courseCache.maxSize} entries
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Notice Cache:</span>
                  <Badge variant="secondary" className="text-xs">
                    {calculateHitRate(
                      metrics.cacheStats.noticeCache.hits,
                      metrics.cacheStats.noticeCache.misses,
                    )}
                    %
                  </Badge>
                </div>
                <div className="text-gray-500">
                  {metrics.cacheStats.noticeCache.size}/
                  {metrics.cacheStats.noticeCache.maxSize} entries
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h4 className="font-medium mb-2">Performance Metrics</h4>
            <div className="space-y-1">
              {metrics.pageLoadTime && (
                <div className="flex justify-between">
                  <span>Page Load Time:</span>
                  <Badge
                    variant={
                      metrics.pageLoadTime < 3000 ? "default" : "destructive"
                    }
                    className="text-xs"
                  >
                    {(metrics.pageLoadTime / 1000).toFixed(2)}s
                  </Badge>
                </div>
              )}

              {metrics.memoryUsage && (
                <div className="flex justify-between">
                  <span>Memory Usage:</span>
                  <Badge variant="secondary" className="text-xs">
                    {formatBytes(metrics.memoryUsage)}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Cache Hit Rate Summary */}
          <div>
            <h4 className="font-medium mb-2">Overall Cache Efficiency</h4>
            <div className="flex justify-between">
              <span>Total Hit Rate:</span>
              <Badge
                variant={
                  parseFloat(
                    calculateHitRate(
                      metrics.cacheStats.profileCache.hits +
                        metrics.cacheStats.listCache.hits +
                        metrics.cacheStats.courseCache.hits +
                        metrics.cacheStats.noticeCache.hits,
                      metrics.cacheStats.profileCache.misses +
                        metrics.cacheStats.listCache.misses +
                        metrics.cacheStats.courseCache.misses +
                        metrics.cacheStats.noticeCache.misses,
                    ),
                  ) > 70
                    ? "default"
                    : "secondary"
                }
                className="text-xs"
              >
                {calculateHitRate(
                  metrics.cacheStats.profileCache.hits +
                    metrics.cacheStats.listCache.hits +
                    metrics.cacheStats.courseCache.hits +
                    metrics.cacheStats.noticeCache.hits,
                  metrics.cacheStats.profileCache.misses +
                    metrics.cacheStats.listCache.misses +
                    metrics.cacheStats.courseCache.misses +
                    metrics.cacheStats.noticeCache.misses,
                )}
                %
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
