"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Brain,
  MapPin,
  MessageSquare,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  offlineTestSuite,
  TestResult,
  TestSuiteResult,
} from "@/lib/offline-test-suite";
import { offlineStorage } from "@/lib/offline-storage";
import { syncEngine } from "@/lib/sync-engine";

export default function TestOfflinePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestSuiteResult | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof window !== "undefined" ? navigator.onLine : true,
  );
  const [storageStats, setStorageStats] = useState<{
    totalSize: number;
    itemCount: number;
    lastUpdated: string;
  } | null>(null);
  const [syncStatus, setSyncStatus] = useState<{
    lastSyncTime: string;
    syncInProgress: boolean;
    pendingItems: number;
  } | null>(null);

  useEffect(() => {
    // Listen for online/offline status changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load initial data
    loadInitialData();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadInitialData = async () => {
    try {
      await offlineStorage.initialize();
      const stats = await offlineStorage.getStorageStats();
      setStorageStats(stats as unknown as { totalSize: number; itemCount: number; lastUpdated: string });

      const status = syncEngine.getSyncStatus();
      setSyncStatus(status as unknown as { lastSyncTime: string; syncInProgress: boolean; pendingItems: number });
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults(null);

    try {
      const results = await offlineTestSuite.runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error("Test suite failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const runSpecificTests = async (testType: string) => {
    setIsRunning(true);
    setTestResults(null);

    try {
      let results: TestResult[] = [];

      switch (testType) {
        case "storage":
          results = await offlineTestSuite.runStorageTests();
          break;
        case "quiz":
          results = await offlineTestSuite.runQuizTests();
          break;
        case "recommendations":
          results = await offlineTestSuite.runRecommendationTests();
          break;
        case "ai":
          results = await offlineTestSuite.runAITests();
          break;
        case "maps":
          results = await offlineTestSuite.runMapsTests();
          break;
        case "sync":
          results = await offlineTestSuite.runSyncTests();
          break;
        case "transitions":
          results = await offlineTestSuite.runTransitionTests();
          break;
      }

      const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
      const passedTests = results.filter((r) => r.passed).length;
      const failedTests = results.filter((r) => !r.passed).length;

      setTestResults({
        totalTests: results.length,
        passedTests,
        failedTests,
        totalDuration,
        results,
        summary: `Tests: ${passedTests}/${results.length} passed in ${totalDuration}ms`,
      });
    } catch (error) {
      console.error("Specific tests failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearOfflineData = async () => {
    try {
      await offlineStorage.clearAllData();
      await loadInitialData();
      alert("Offline data cleared successfully");
    } catch (error) {
      console.error("Failed to clear offline data:", error);
      alert("Failed to clear offline data");
    }
  };

  const triggerSync = async () => {
    try {
      const result = await syncEngine.triggerSync();
      console.log("Sync result:", result);
      await loadInitialData();
      alert(`Sync completed: ${result.syncedItems} items synced`);
    } catch (error) {
      console.error("Sync failed:", error);
      alert("Sync failed");
    }
  };

  const getTestIcon = (testName: string) => {
    if (testName.includes("Storage")) return <Database className="h-4 w-4" />;
    if (testName.includes("Quiz")) return <Brain className="h-4 w-4" />;
    if (testName.includes("Recommendation"))
      return <CheckCircle className="h-4 w-4" />;
    if (testName.includes("AI") || testName.includes("Sarthi"))
      return <MessageSquare className="h-4 w-4" />;
    if (testName.includes("Maps")) return <MapPin className="h-4 w-4" />;
    if (testName.includes("Sync")) return <RefreshCw className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getTestCategory = (testName: string) => {
    if (testName.includes("Storage")) return "storage";
    if (testName.includes("Quiz")) return "quiz";
    if (testName.includes("Recommendation")) return "recommendations";
    if (testName.includes("AI") || testName.includes("Sarthi")) return "ai";
    if (testName.includes("Maps")) return "maps";
    if (testName.includes("Sync")) return "sync";
    if (testName.includes("Transition")) return "transitions";
    return "other";
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      storage: "bg-blue-100 text-blue-800",
      quiz: "bg-green-100 text-green-800",
      recommendations: "bg-purple-100 text-purple-800",
      ai: "bg-pink-100 text-pink-800",
      maps: "bg-orange-100 text-orange-800",
      sync: "bg-cyan-100 text-cyan-800",
      transitions: "bg-yellow-100 text-yellow-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Offline-First Test Suite
            </h1>
            <p className="text-gray-600">
              Comprehensive testing of PathNiti&apos;s offline capabilities and
              sync functionality
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Online Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  {isOnline ? (
                    <Wifi className="h-5 w-5 text-green-600" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-orange-600" />
                  )}
                  <span>Connection Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge
                    className={
                      isOnline
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }
                  >
                    {isOnline ? "Online" : "Offline"}
                  </Badge>
                  {syncStatus?.syncInProgress && (
                    <Badge className="bg-blue-100 text-blue-800">
                      Syncing...
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Storage Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span>Storage Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {storageStats ? (
                  <div className="space-y-1">
                    <div className="text-sm">
                      Quiz Responses: {(storageStats as Record<string, unknown>).quizResponses as number}
                    </div>
                    <div className="text-sm">
                      Cached Colleges: {(storageStats as Record<string, unknown>).cachedColleges as number}
                    </div>
                    <div className="text-sm">
                      Chat Messages: {(storageStats as Record<string, unknown>).chatMessages as number}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Loading...</div>
                )}
              </CardContent>
            </Card>

            {/* Sync Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5 text-cyan-600" />
                  <span>Sync Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {syncStatus ? (
                  <div className="space-y-1">
                    <div className="text-sm">
                      Last Sync:{" "}
                      {syncStatus.lastSyncTime
                        ? new Date(syncStatus.lastSyncTime).toLocaleString()
                        : "Never"}
                    </div>
                    <div className="text-sm">
                      Pending Items: {syncStatus.pendingItems || 0}
                    </div>
                    {((syncStatus as Record<string, unknown>).lastError as string) && (
                      <div className="text-sm text-red-600">
                        Error: {(syncStatus as Record<string, unknown>).lastError as string}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Loading...</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Test Controls */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Test Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={runAllTests}
                  disabled={isRunning}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    "Run All Tests"
                  )}
                </Button>

                <div className="flex flex-wrap gap-2">
                  {[
                    "storage",
                    "quiz",
                    "recommendations",
                    "ai",
                    "maps",
                    "sync",
                    "transitions",
                  ].map((testType) => (
                    <Button
                      key={testType}
                      variant="outline"
                      size="sm"
                      onClick={() => runSpecificTests(testType)}
                      disabled={isRunning}
                    >
                      {testType.charAt(0).toUpperCase() + testType.slice(1)}
                    </Button>
                  ))}
                </div>

                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="outline"
                    onClick={triggerSync}
                    disabled={!isOnline}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Trigger Sync
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearOfflineData}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Test Results</CardTitle>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      {testResults.summary}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-100 text-green-800">
                        {testResults.passedTests} Passed
                      </Badge>
                      <Badge className="bg-red-100 text-red-800">
                        {testResults.failedTests} Failed
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testResults.results.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {result.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div className="flex items-center space-x-2">
                          {getTestIcon(result.testName)}
                          <span className="font-medium">{result.testName}</span>
                        </div>
                        <Badge
                          className={getCategoryColor(
                            getTestCategory(result.testName),
                          )}
                        >
                          {getTestCategory(result.testName)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                          {result.duration}ms
                        </div>
                        {result.error && (
                          <div className="text-sm text-red-600 max-w-md truncate">
                            {result.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    How to Test Offline Functionality:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>
                      Run the test suite while online to verify all systems work
                    </li>
                    <li>
                      Disconnect from the internet (or use browser dev tools to
                      simulate offline)
                    </li>
                    <li>Run tests again to verify offline functionality</li>
                    <li>
                      Reconnect to the internet and trigger sync to test data
                      synchronization
                    </li>
                    <li>Check that offline data persists after page refresh</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Expected Behavior:
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      All tests should pass in both online and offline modes
                    </li>
                    <li>Data should persist in offline storage</li>
                    <li>Sync should work when coming back online</li>
                    <li>UI should show appropriate online/offline status</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
