"use client";

import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/app/providers";
import { offlineAuthManager } from "@/lib/offline-auth-manager";

interface NetworkStatusIndicatorProps {
  className?: string;
  showWhenOnline?: boolean;
}

export function NetworkStatusIndicator({ 
  className = "", 
  showWhenOnline = false 
}: NetworkStatusIndicatorProps) {
  const { isOnline } = useAuth();
  const [showIndicator, setShowIndicator] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');

  useEffect(() => {
    const unsubscribe = offlineAuthManager.addConnectionListener((status) => {
      setShowIndicator(!status.isOnline || showWhenOnline);
      
      // Determine connection quality
      if (!status.isOnline) {
        setConnectionQuality('offline');
      } else if (status.connectionType === 'slow-2g' || status.connectionType === '2g') {
        setConnectionQuality('poor');
      } else {
        setConnectionQuality('good');
      }
    });

    // Initial state
    setShowIndicator(!isOnline || showWhenOnline);
    setConnectionQuality(isOnline ? 'good' : 'offline');

    return unsubscribe;
  }, [isOnline, showWhenOnline]);

  if (!showIndicator) return null;

  const getStatusConfig = () => {
    switch (connectionQuality) {
      case 'offline':
        return {
          icon: WifiOff,
          text: 'Offline',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
        };
      case 'poor':
        return {
          icon: AlertCircle,
          text: 'Poor Connection',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
        };
      case 'good':
        return {
          icon: Wifi,
          text: 'Online',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg ${config.bgColor} ${config.textColor}`}>
        <Icon className={`h-4 w-4 ${config.iconColor}`} />
        <span className="text-sm font-medium">{config.text}</span>
      </div>
    </div>
  );
}

// Hook for components that need network status
export function useNetworkStatus() {
  const { isOnline } = useAuth();
  const [networkStatus, setNetworkStatus] = useState<{
    isOnline: boolean;
    lastOnlineTime: number;
    connectionType?: string;
  }>({
    isOnline,
    lastOnlineTime: Date.now(),
    connectionType: undefined,
  });

  useEffect(() => {
    const unsubscribe = offlineAuthManager.addConnectionListener((status) => {
      setNetworkStatus(status);
    });

    return unsubscribe;
  }, []);

  return networkStatus;
}
