/**
 * Web-safe Capacitor Service
 * Provides fallback implementations for web environment
 */

export interface DeviceInfo {
  isNative: boolean;
  platform: string;
  model: string;
  osVersion: string;
  appVersion: string;
  isConnected: boolean;
  connectionType: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

class CapacitorServiceWeb {
  private isInitialized = false;
  private deviceInfo: DeviceInfo | null = null;

  /**
   * Initialize web services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Get device information for web
      this.deviceInfo = await this.getDeviceInfo();

      this.isInitialized = true;
      console.log('CapacitorServiceWeb: Initialized successfully');
    } catch (error) {
      console.error('CapacitorServiceWeb: Initialization failed', error);
    }
  }

  /**
   * Get device information for web
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    try {
      return {
        isNative: false,
        platform: 'web',
        model: navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser',
        osVersion: 'Unknown',
        appVersion: '1.0.0',
        isConnected: navigator.onLine,
        connectionType: 'unknown',
      };
    } catch (error) {
      console.error('Failed to get device info:', error);
      return {
        isNative: false,
        platform: 'web',
        model: 'unknown',
        osVersion: 'unknown',
        appVersion: '1.0.0',
        isConnected: navigator.onLine,
        connectionType: 'unknown',
      };
    }
  }

  /**
   * Show local notification (web fallback)
   */
  async showLocalNotification(notification: NotificationData): Promise<void> {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, { 
          body: notification.body, 
          data: notification.data 
        });
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(notification.title, { 
            body: notification.body, 
            data: notification.data 
          });
        }
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Get current location (web geolocation)
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    });
  }

  /**
   * Take photo (web file input fallback)
   */
  async takePhoto(): Promise<string | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        } else {
          resolve(null);
        }
      };
      input.click();
    });
  }

  /**
   * Trigger haptic feedback (web fallback - no-op)
   */
  async triggerHapticFeedback(): Promise<void> {
    // No haptic feedback available in web
    console.log('Haptic feedback not available in web environment');
  }

  /**
   * Check if device is online
   */
  async isOnline(): Promise<boolean> {
    return navigator.onLine;
  }

  /**
   * Store data in localStorage
   */
  async setPreference(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to set preference:', error);
    }
  }

  /**
   * Get data from localStorage
   */
  async getPreference(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Failed to get preference:', error);
      return null;
    }
  }

  /**
   * Remove data from localStorage
   */
  async removePreference(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove preference:', error);
    }
  }

  /**
   * Get device info
   */
  getDeviceInfoSync(): DeviceInfo | null {
    return this.deviceInfo;
  }

  /**
   * Check if running on native platform
   */
  isNative(): boolean {
    return false;
  }

  /**
   * Get platform name
   */
  getPlatform(): string {
    return 'web';
  }
}

// Export singleton instance
export const capacitorService = new CapacitorServiceWeb();
export default capacitorService;
