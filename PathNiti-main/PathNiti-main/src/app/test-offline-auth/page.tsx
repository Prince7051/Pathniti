"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/app/providers";
import { offlineAuthManager } from "@/lib/offline-auth-manager";
import { 
  Wifi, 
  WifiOff, 
  User, 
  Shield, 
  Clock, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";

export default function TestOfflineAuthPage() {
  const { user, session, profile, loading, isOnline } = useAuth();
  const [networkStatus, setNetworkStatus] = useState<{
    isOnline: boolean;
    lastOnlineTime: number;
    connectionType?: string;
  }>({
    isOnline: true,
    lastOnlineTime: Date.now(),
    connectionType: undefined,
  });
  const [offlineAuthState, setOfflineAuthState] = useState<any>(null);
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'success' | 'error' | 'warning' | 'pending';
    message: string;
    timestamp: number;
  }>>([]);

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = offlineAuthManager.addConnectionListener((status) => {
      setNetworkStatus(status);
    });

    // Get current offline auth state
    const getOfflineState = async () => {
      const state = await offlineAuthManager.getOfflineAuthState();
      setOfflineAuthState(state);
    };
    getOfflineState();

    return unsubscribe;
  }, []);

  const addTestResult = (test: string, status: 'success' | 'error' | 'warning' | 'pending', message: string) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      timestamp: Date.now()
    }]);
  };

  const runOfflineAuthTests = async () => {
    setTestResults([]);
    
    // Test 1: Check if offline auth state is saved
    addTestResult('Offline Auth State', 'pending', 'Checking offline auth state...');
    try {
      const state = await offlineAuthManager.getOfflineAuthState();
      if (state) {
        addTestResult('Offline Auth State', 'success', `Found offline state for user: ${state.user?.email || 'Unknown'}`);
      } else {
        addTestResult('Offline Auth State', 'warning', 'No offline auth state found');
      }
    } catch (error) {
      addTestResult('Offline Auth State', 'error', `Error: ${error}`);
    }

    // Test 2: Test network error handling
    addTestResult('Network Error Handling', 'pending', 'Testing network error handling...');
    try {
      const isHandled = await offlineAuthManager.handleAuthError(new Error('Failed to fetch'));
      if (isHandled) {
        addTestResult('Network Error Handling', 'success', 'Network error handled correctly');
      } else {
        addTestResult('Network Error Handling', 'warning', 'Network error not handled');
      }
    } catch (error) {
      addTestResult('Network Error Handling', 'error', `Error: ${error}`);
    }

    // Test 3: Test retry queue
    addTestResult('Retry Queue', 'pending', 'Testing retry queue functionality...');
    try {
      await offlineAuthManager.queueRetryAction(async () => {
        console.log('Test retry action executed');
      });
      addTestResult('Retry Queue', 'success', 'Retry action queued successfully');
    } catch (error) {
      addTestResult('Retry Queue', 'error', `Error: ${error}`);
    }

    // Test 4: Test connection waiting
    addTestResult('Connection Waiting', 'pending', 'Testing connection waiting...');
    try {
      const connected = await offlineAuthManager.waitForConnection(1000); // 1 second timeout
      addTestResult('Connection Waiting', connected ? 'success' : 'warning', 
        connected ? 'Connection available' : 'Connection timeout (expected if offline)');
    } catch (error) {
      addTestResult('Connection Waiting', 'error', `Error: ${error}`);
    }
  };

  const clearOfflineState = async () => {
    try {
      await offlineAuthManager.clearOfflineAuthState();
      setOfflineAuthState(null);
      addTestResult('Clear Offline State', 'success', 'Offline auth state cleared');
    } catch (error) {
      addTestResult('Clear Offline State', 'error', `Error: ${error}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Offline Authentication Test
          </h1>
          <p className="text-gray-600">
            Test and verify offline authentication functionality
          </p>
        </div>

        {/* Network Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              <span>Network Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Badge variant={isOnline ? "default" : "destructive"}>
                  {isOnline ? "Online" : "Offline"}
                </Badge>
                <span className="text-sm text-gray-600">
                  {isOnline ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <strong>Last Online:</strong> {new Date(networkStatus.lastOnlineTime).toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Connection Type:</strong> {networkStatus.connectionType || "Unknown"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span>Authentication Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Current Session</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>
                      {user ? `${user.email} (${user.id})` : "Not authenticated"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={session ? "default" : "secondary"}>
                      {session ? "Active Session" : "No Session"}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={profile ? "default" : "secondary"}>
                      {profile ? `${profile.role} Profile` : "No Profile"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Offline State</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Stored:</strong> {offlineAuthState ? "Yes" : "No"}
                  </div>
                  {offlineAuthState && (
                    <>
                      <div>
                        <strong>User:</strong> {offlineAuthState.user?.email || "Unknown"}
                      </div>
                      <div>
                        <strong>Last Sync:</strong> {new Date(offlineAuthState.lastSyncTime).toLocaleString()}
                      </div>
                      <div>
                        <strong>Pending Actions:</strong> {offlineAuthState.pendingActions?.length || 0}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
            <CardDescription>
              Run tests to verify offline authentication functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={runOfflineAuthTests} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Tests
              </Button>
              <Button onClick={clearOfflineState} variant="outline">
                Clear Offline State
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{result.test}</span>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{result.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">To test offline functionality:</h4>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>Make sure you&apos;re logged in and have an active session</li>
                  <li>Turn off your internet connection (or use browser dev tools)</li>
                  <li>Refresh the page - you should still see your authentication status</li>
                  <li>Turn your internet back on</li>
                  <li>Run the tests to verify offline state management</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Expected behavior:</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Authentication state should persist when offline</li>
                  <li>No network errors should appear in console when offline</li>
                  <li>Session should be restored when connection returns</li>
                  <li>Retry actions should be queued and executed when online</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
