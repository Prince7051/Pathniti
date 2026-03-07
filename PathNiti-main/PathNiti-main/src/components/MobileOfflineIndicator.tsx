/**
 * Mobile Offline Indicator
 * Shows offline status and sync information for mobile app
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useMobile } from './MobileProvider';
import { Wifi, WifiOff, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';

export function MobileOfflineIndicator() {
  const [isClient, setIsClient] = useState(false);
  const { isOnline, syncStatus, isSyncing, syncOfflineData } = useMobile();
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  const [showDetails, setShowDetails] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  useEffect(() => {
    if (syncStatus.lastSync) {
      const date = new Date(syncStatus.lastSync);
      setLastSyncTime(date.toLocaleTimeString());
    }
  }, [syncStatus.lastSync]);

  const handleSync = async () => {
    if (isOnline && !isSyncing) {
      await syncOfflineData();
    }
  };

  const getSyncStatusText = () => {
    if (isSyncing) return 'Syncing...';
    if (syncStatus.pending > 0) return `${syncStatus.pending} pending`;
    if (syncStatus.lastSync) return `Last sync: ${lastSyncTime}`;
    return 'Up to date';
  };

  const getSyncStatusColor = () => {
    if (isSyncing) return 'text-blue-500';
    if (syncStatus.pending > 0) return 'text-orange-500';
    if (syncStatus.lastSync) return 'text-green-500';
    return 'text-gray-500';
  };

  // Don't render during SSR
  if (!isClient) {
    return null;
  }

  if (isOnline && syncStatus.pending === 0 && !isSyncing) {
    return null; // Don't show when everything is synced and online
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm border-b">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Status Icon and Text */}
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            
            <span className="text-sm font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>
            
            {syncStatus.pending > 0 && (
              <div className="flex items-center space-x-1">
                <AlertCircle className="w-3 h-3 text-orange-500" />
                <span className="text-xs text-orange-600">
                  {syncStatus.pending} pending
                </span>
              </div>
            )}
          </div>

          {/* Sync Status */}
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${getSyncStatusColor()}`}>
              {getSyncStatusText()}
            </span>
            
            {isOnline && syncStatus.pending > 0 && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
              >
                <RotateCcw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            )}
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {showDetails ? 'Hide' : 'Details'}
            </button>
          </div>
        </div>

        {/* Detailed Information */}
        {showDetails && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500">Connection:</span>
                <span className={`ml-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {isOnline ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div>
                <span className="text-gray-500">Pending Sync:</span>
                <span className="ml-1 text-orange-600">
                  {syncStatus.pending} items
                </span>
              </div>
              
              {syncStatus.lastSync && (
                <div className="col-span-2">
                  <span className="text-gray-500">Last Sync:</span>
                  <span className="ml-1 text-gray-700">
                    {new Date(syncStatus.lastSync).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            
            {!isOnline && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs text-yellow-800">
                    You&apos;re offline. Some features may be limited. Data will sync when you&apos;re back online.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileOfflineIndicator;
