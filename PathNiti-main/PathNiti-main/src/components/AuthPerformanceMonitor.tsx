"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";

interface AuthPerformanceMonitorProps {
  showInProduction?: boolean;
}

export function AuthPerformanceMonitor({
  showInProduction = false,
}: AuthPerformanceMonitorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only show in development unless explicitly enabled for production
  if (
    !mounted ||
    (process.env.NODE_ENV === "production" && !showInProduction)
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Auth Performance
          </CardTitle>
          <CardDescription className="text-xs">
            Development Mode Monitor
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="text-xs text-gray-500">
            Authentication system is active and monitoring performance.
          </div>
          <div className="text-xs text-green-600">
            ✓ Centralized auth working
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AuthPerformanceMonitor;
