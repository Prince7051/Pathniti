/**
 * Mobile Provider
 * Provides mobile-specific features and device integration
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { offlineStorageService, SyncResult } from '@/lib/offline-storage';

// Define DeviceInfo type
interface DeviceInfo {
  isNative: boolean;
  platform: string;
  model: string;
  osVersion: string;
  appVersion: string;
  bundleId: string;
}

// Conditionally import Capacitor service only when available
let capacitorService: any = null;

// Initialize capacitor service safely
const initializeCapacitorService = async () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Check if Capacitor is available
    if ((window as any).Capacitor) {
      const capacitorModule = await import('@/lib/capacitor-service');
      capacitorService = capacitorModule.capacitorService;
      console.log('Capacitor service loaded successfully');
    } else {
      // Use web-safe fallback
      const webModule = await import('@/lib/capacitor-service-web');
      capacitorService = webModule.capacitorService;
      console.log('Web-safe capacitor service loaded');
    }
  } catch (error) {
    console.log('Capacitor service not available, using web fallback:', error);
    try {
      const webModule = await import('@/lib/capacitor-service-web');
      capacitorService = webModule.capacitorService;
      console.log('Web-safe capacitor service loaded as fallback');
    } catch (fallbackError) {
      console.error('Failed to load any capacitor service:', fallbackError);
      capacitorService = null;
    }
  }
};

// Initialize immediately if in browser
if (typeof window !== 'undefined') {
  initializeCapacitorService();
}

interface MobileContextType {
  // Device info
  deviceInfo: DeviceInfo | null;
  isNative: boolean;
  isMobile: boolean;
  isOnline: boolean;
  
  // Offline storage
  syncStatus: { pending: number; lastSync: number | null };
  isDataAvailableOffline: (key: string) => Promise<boolean>;
  
  // Mobile features
  takePhoto: () => Promise<string | null>;
  getCurrentLocation: () => Promise<any>;
  triggerHapticFeedback: () => Promise<void>;
  showNotification: (title: string, body: string, data?: any) => Promise<void>;
  
  // Sync
  syncOfflineData: () => Promise<SyncResult>;
  isSyncing: boolean;
}

const MobileContext = createContext<MobileContextType | null>(null);

interface MobileProviderProps {
  children: ReactNode;
}

export function MobileProvider({ children }: MobileProviderProps) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<{ pending: number; lastSync: number | null }>({ pending: 0, lastSync: null });
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Handle offline data sync
  const handleSyncOfflineData = useCallback(async (): Promise<SyncResult> => {
    if (isSyncing) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    setIsSyncing(true);
    try {
      const result = await offlineStorageService.syncOfflineData();
      
      if (result.success) {
        await offlineStorageService.setLastSyncTime();
        const newStatus = await offlineStorageService.getSyncStatus();
        setSyncStatus(newStatus);
      }
      
      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      return { success: false, synced: 0, failed: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Initialize mobile services
  useEffect(() => {
    const initializeMobile = async () => {
      try {
        // Initialize Capacitor services if available
        if (capacitorService) {
          await capacitorService.initialize();
          
          // Get device info
          const info = capacitorService.getDeviceInfoSync();
          setDeviceInfo(info);
          
          // Check online status
          const online = await capacitorService.isOnline();
          setIsOnline(online);
        } else {
          // Fallback for web environment
          setDeviceInfo({
            isNative: false,
            platform: 'web',
            model: 'Web Browser',
            osVersion: 'Unknown',
            appVersion: '1.0.0',
            bundleId: 'com.pathniti.web'
          });
          setIsOnline(navigator.onLine);
        }
        
        // Initialize offline storage
        await offlineStorageService.initialize();
        
        // Get sync status
        const status = await offlineStorageService.getSyncStatus();
        setSyncStatus(status);
        
        setIsInitialized(true);
        console.log('Mobile services initialized');
      } catch (error) {
        console.error('Failed to initialize mobile services:', error);
      }
    };

    initializeMobile();
  }, []);

  // Listen for network status changes
  useEffect(() => {
    const handleNetworkChange = async () => {
      let online = false;
      if (capacitorService) {
        online = await capacitorService.isOnline();
        setIsOnline(online);
      } else {
        online = navigator.onLine;
        setIsOnline(online);
      }
      
      // Auto-sync when back online
      if (online && syncStatus.pending > 0) {
        handleSyncOfflineData();
      }
    };

    // Listen for network status changes
    window.addEventListener('networkStatusChange', handleNetworkChange);
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    return () => {
      window.removeEventListener('networkStatusChange', handleNetworkChange);
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, [syncStatus.pending, handleSyncOfflineData]);

  // Periodic sync check
  useEffect(() => {
    if (!isInitialized) return;

    const syncInterval = setInterval(async () => {
      if (isOnline && syncStatus.pending > 0) {
        await handleSyncOfflineData();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(syncInterval);
  }, [isInitialized, isOnline, syncStatus.pending, handleSyncOfflineData]);

  // Check if data is available offline
  const isDataAvailableOffline = async (key: string): Promise<boolean> => {
    return await offlineStorageService.isDataAvailableOffline(key);
  };

  // Take photo
  const takePhoto = async (): Promise<string | null> => {
    if (capacitorService) {
      return await capacitorService.takePhoto();
    }
    return null;
  };

  // Get current location
  const getCurrentLocation = async () => {
    if (capacitorService) {
      return await capacitorService.getCurrentLocation();
    }
    return null;
  };

  // Trigger haptic feedback
  const triggerHapticFeedback = async (): Promise<void> => {
    if (capacitorService) {
      await capacitorService.triggerHapticFeedback();
    }
  };

  // Show notification
  const showNotification = async (title: string, body: string, data?: any): Promise<void> => {
    if (capacitorService) {
      await capacitorService.showLocalNotification({ title, body, data });
    } else {
      // Fallback to browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, data });
      }
    }
  };

  const contextValue: MobileContextType = {
    deviceInfo,
    isNative: capacitorService ? capacitorService.isNative() : false,
    isMobile: deviceInfo?.isNative || false,
    isOnline,
    syncStatus,
    isDataAvailableOffline,
    takePhoto,
    getCurrentLocation,
    triggerHapticFeedback,
    showNotification,
    syncOfflineData: handleSyncOfflineData,
    isSyncing,
  };

  return (
    <MobileContext.Provider value={contextValue}>
      {children}
    </MobileContext.Provider>
  );
}

export function useMobile(): MobileContextType {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error('useMobile must be used within a MobileProvider');
  }
  return context;
}

export default MobileProvider;
