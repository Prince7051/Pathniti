"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface UsageStats {
  requestsToday: number;
  remainingToday: number;
  isApproachingLimit: boolean;
}

export default function UsageMonitor() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate getting usage stats (in a real app, this would come from an API)
    const fetchUsageStats = () => {
      // For demo purposes, we'll show some sample data
      // In production, this would come from your backend
      setUsage({
        requestsToday: 3,
        remainingToday: 12,
        isApproachingLimit: false,
      });
      setLoading(false);
    };

    fetchUsageStats();
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            AI Usage Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usage) return null;

  const usagePercent =
    (usage.requestsToday / (usage.requestsToday + usage.remainingToday)) * 100;
  const isNearLimit = usagePercent > 80;
  const isAtLimit = usage.remainingToday === 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isAtLimit ? (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          ) : isNearLimit ? (
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          AI Usage Monitor
          <Badge
            variant={
              isAtLimit ? "destructive" : isNearLimit ? "secondary" : "default"
            }
          >
            Free Tier
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Requests Today</span>
            <span className="font-medium">
              {usage.requestsToday} /{" "}
              {usage.requestsToday + usage.remainingToday}
            </span>
          </div>
          <Progress
            value={usagePercent}
            className={`h-2 ${
              isAtLimit
                ? "bg-red-100"
                : isNearLimit
                  ? "bg-yellow-100"
                  : "bg-green-100"
            }`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Remaining Today</p>
            <p className="font-semibold text-lg">{usage.remainingToday}</p>
          </div>
          <div>
            <p className="text-gray-600">Status</p>
            <p
              className={`font-semibold ${
                isAtLimit
                  ? "text-red-600"
                  : isNearLimit
                    ? "text-yellow-600"
                    : "text-green-600"
              }`}
            >
              {isAtLimit
                ? "Limit Reached"
                : isNearLimit
                  ? "Near Limit"
                  : "Available"}
            </p>
          </div>
        </div>

        {isNearLimit && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> You&apos;re approaching your daily AI usage
              limit. Basic recommendations will still work even if the limit is
              reached.
            </p>
          </div>
        )}

        {isAtLimit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Daily limit reached.</strong> AI features will use
              fallback recommendations. Your limit will reset tomorrow.
            </p>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>• Free tier: 15 requests/day</p>
          <p>• Resets daily at midnight</p>
          <p>• Basic recommendations always available</p>
        </div>
      </CardContent>
    </Card>
  );
}
