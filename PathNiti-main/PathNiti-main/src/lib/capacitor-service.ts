/**
 * Capacitor Service
 * Handles mobile-specific features and device integration
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Network } from '@capacitor/network';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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

class CapacitorService {
  private isInitialized = false;
  private deviceInfo: DeviceInfo | null = null;

  /**
   * Initialize Capacitor services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if running on native platform
      if (Capacitor.isNativePlatform()) {
        await this.initializeNativeFeatures();
      }

      // Get device information
      this.deviceInfo = await this.getDeviceInfo();

      // Initialize network monitoring
      await this.initializeNetworkMonitoring();

      // Initialize push notifications
      await this.initializePushNotifications();

      this.isInitialized = true;
      console.log('CapacitorService: Initialized successfully');
    } catch (error) {
      console.error('CapacitorService: Initialization failed', error);
    }
  }

  /**
   * Initialize native platform features
   */
  private async initializeNativeFeatures(): Promise<void> {
    try {
      // Configure status bar
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#1A237E' });

      // Hide splash screen
      await SplashScreen.hide();

      // Configure app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('App state changed. Is active?', isActive);
      });

      App.addListener('appUrlOpen', (event) => {
        console.log('App opened with URL:', event.url);
      });

      App.addListener('appRestoredResult', (event) => {
        console.log('App restored with result:', event);
      });

      console.log('Native features initialized');
    } catch (error) {
      console.error('Failed to initialize native features:', error);
    }
  }

  /**
   * Get device information
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    try {
      const info = await Device.getInfo();
      const networkStatus = await Network.getStatus();

      return {
        isNative: Capacitor.isNativePlatform(),
        platform: info.platform,
        model: info.model,
        osVersion: info.osVersion,
        appVersion: '1.0.0', // Default app version
        isConnected: networkStatus.connected,
        connectionType: networkStatus.connectionType,
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
   * Initialize network monitoring
   */
  private async initializeNetworkMonitoring(): Promise<void> {
    try {
      Network.addListener('networkStatusChange', (status) => {
        console.log('Network status changed:', status);
        // Emit custom event for app to handle
        window.dispatchEvent(new CustomEvent('networkStatusChange', { detail: status }));
      });
    } catch (error) {
      console.error('Failed to initialize network monitoring:', error);
    }
  }

  /**
   * Initialize push notifications
   */
  private async initializePushNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Request permissions
      const permStatus = await PushNotifications.requestPermissions();
      if (permStatus.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();
      }

      // Listen for registration
      PushNotifications.addListener('registration', (token: Token) => {
        console.log('Push registration success, token: ' + token.value);
        // Store token for server use
        this.storePushToken(token.value);
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      // Listen for incoming notifications
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received: ', notification);
        // Handle notification received
        this.handleNotificationReceived(notification);
      });

      // Listen for notification actions
      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push notification action performed', notification.actionId, notification.inputValue);
        // Handle notification action
        this.handleNotificationAction(notification);
      });
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  /**
   * Store push token for server use
   */
  private async storePushToken(token: string): Promise<void> {
    try {
      await Preferences.set({
        key: 'push_token',
        value: token,
      });
      // TODO: Send token to your server
      console.log('Push token stored:', token);
    } catch (error) {
      console.error('Failed to store push token:', error);
    }
  }

  /**
   * Handle notification received
   */
  private handleNotificationReceived(notification: PushNotificationSchema): void {
    // Trigger haptic feedback
    this.triggerHapticFeedback();
    
    // Show local notification if needed
    this.showLocalNotification({
      title: notification.title || 'PathNiti',
      body: notification.body || 'You have a new notification',
      data: notification.data,
    });
  }

  /**
   * Handle notification action
   */
  private handleNotificationAction(notification: ActionPerformed): void {
    const actionId = notification.actionId;
    const data = notification.notification.data;

    switch (actionId) {
      case 'tap':
        // Open app or specific page
        if (data?.url) {
          window.location.href = data.url;
        }
        break;
      case 'view':
        // Navigate to specific page
        if (data?.page) {
          window.location.href = data.page;
        }
        break;
      default:
        console.log('Unknown notification action:', actionId);
    }
  }

  /**
   * Show local notification
   */
  async showLocalNotification(notification: NotificationData): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title,
            body: notification.body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'beep.wav',
            attachments: undefined,
            actionTypeId: '',
            extra: notification.data,
          },
        ],
      });
    } catch (error) {
      console.error('Failed to show local notification:', error);
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to web geolocation
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

    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      return {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy,
        timestamp: coordinates.timestamp,
      };
    } catch (error) {
      console.error('Failed to get location:', error);
      return null;
    }
  }

  /**
   * Take photo with camera
   */
  async takePhoto(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to file input for web
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

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      return image.dataUrl || null;
    } catch (error) {
      console.error('Failed to take photo:', error);
      return null;
    }
  }

  /**
   * Trigger haptic feedback
   */
  async triggerHapticFeedback(style: ImpactStyle = ImpactStyle.Medium): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.error('Failed to trigger haptic feedback:', error);
    }
  }

  /**
   * Check if device is online
   */
  async isOnline(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return navigator.onLine;
    }

    try {
      const status = await Network.getStatus();
      return status.connected;
    } catch (error) {
      console.error('Failed to check network status:', error);
      return navigator.onLine;
    }
  }

  /**
   * Store data in device preferences
   */
  async setPreference(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value });
    } catch (error) {
      console.error('Failed to set preference:', error);
    }
  }

  /**
   * Get data from device preferences
   */
  async getPreference(key: string): Promise<string | null> {
    try {
      const result = await Preferences.get({ key });
      return result.value;
    } catch (error) {
      console.error('Failed to get preference:', error);
      return null;
    }
  }

  /**
   * Remove data from device preferences
   */
  async removePreference(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
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
    return Capacitor.isNativePlatform();
  }

  /**
   * Get platform name
   */
  getPlatform(): string {
    return Capacitor.getPlatform();
  }
}

// Export singleton instance
export const capacitorService = new CapacitorService();
export default capacitorService;
