"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { offlineAuthManager } from "@/lib/offline-auth-manager";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isOnline: boolean;
  retryCount: number;
}

export class OfflineErrorBoundary extends Component<Props, State> {
  private unsubscribeConnection: (() => void) | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isOnline: true,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidMount() {
    // Subscribe to network status changes
    this.unsubscribeConnection = offlineAuthManager.addConnectionListener((status) => {
      this.setState({ isOnline: status.isOnline });
    });
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[OfflineErrorBoundary] Caught error:", error, errorInfo);
    
    // Check if this is a network-related error
    const isNetworkError = this.isNetworkError(error);
    
    if (isNetworkError) {
      console.log("[OfflineErrorBoundary] Network error detected, will retry when online");
    }
  }

  componentWillUnmount() {
    if (this.unsubscribeConnection) {
      this.unsubscribeConnection();
    }
  }

  private isNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('fetch') || 
           message.includes('connection') ||
           message.includes('timeout') ||
           message.includes('internet_disconnected') ||
           message.includes('failed to fetch');
  }

  private handleRetry = async () => {
    const { retryCount } = this.state;
    
    if (retryCount >= 3) {
      console.log("[OfflineErrorBoundary] Max retry attempts reached");
      return;
    }

    // Wait for connection if offline
    if (!this.state.isOnline) {
      console.log("[OfflineErrorBoundary] Waiting for connection...");
      const connected = await offlineAuthManager.waitForConnection(10000);
      if (!connected) {
        console.log("[OfflineErrorBoundary] Connection timeout");
        return;
      }
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, isOnline, retryCount } = this.state;
      const isNetworkError = error ? this.isNetworkError(error) : false;

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              {/* Icon */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                isNetworkError 
                  ? 'bg-gradient-to-br from-red-100 to-red-200' 
                  : 'bg-gradient-to-br from-orange-100 to-orange-200'
              }`}>
                {isNetworkError ? (
                  <WifiOff className="h-10 w-10 text-red-600" />
                ) : (
                  <AlertTriangle className="h-10 w-10 text-orange-600" />
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isNetworkError ? "Connection Error" : "Something went wrong"}
              </h1>

              {/* Message */}
              <p className="text-gray-600 mb-6">
                {isNetworkError 
                  ? "Unable to connect to the server. Please check your internet connection and try again."
                  : "An unexpected error occurred. Please try again or contact support if the problem persists."
                }
              </p>

              {/* Network Status */}
              {isNetworkError && (
                <div className={`rounded-lg p-3 mb-6 ${
                  isOnline ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className={`flex items-center justify-center space-x-2 text-sm ${
                    isOnline ? 'text-green-800' : 'text-red-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span>
                      {isOnline ? 'Connection restored' : 'You are offline'}
                    </span>
                  </div>
                </div>
              )}

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && error && (
                <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Error Details:</h3>
                  <pre className="text-xs text-gray-600 overflow-auto">
                    {error.message}
                  </pre>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={this.handleRetry}
                  disabled={!isOnline && isNetworkError}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isNetworkError && !isOnline 
                    ? 'Waiting for connection...' 
                    : `Try Again ${retryCount > 0 ? `(${retryCount}/3)` : ''}`
                  }
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full"
                >
                  Reload Page
                </Button>
              </div>

              {/* Retry Limit Warning */}
              {retryCount >= 3 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Maximum retry attempts reached. Please reload the page or contact support.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
