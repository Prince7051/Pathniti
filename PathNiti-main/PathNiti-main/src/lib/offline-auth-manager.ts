"use client";

import { User, Session } from "@supabase/supabase-js";

export interface OfflineAuthState {
  user: User | null;
  session: Session | null;
  isOnline: boolean;
  lastSyncTime: number;
  pendingActions: string[];
}

export interface NetworkStatus {
  isOnline: boolean;
  lastOnlineTime: number;
  connectionType?: string;
}

class OfflineAuthManager {
  private isOnline = typeof window !== "undefined" ? navigator.onLine : true;
  private lastOnlineTime = Date.now();
  private connectionListeners: Set<(status: NetworkStatus) => void> = new Set();
  private authStateListeners: Set<(state: OfflineAuthState) => void> = new Set();
  private retryQueue: Array<() => Promise<void>> = [];
  private isRetrying = false;
  private retryInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.setupEventListeners();
      this.startConnectionMonitoring();
    }
  }

  private setupEventListeners(): void {
    window.addEventListener("online", () => {
      console.log("[OfflineAuth] Network came online");
      this.isOnline = true;
      this.lastOnlineTime = Date.now();
      this.notifyConnectionListeners();
      this.processRetryQueue();
    });

    window.addEventListener("offline", () => {
      console.log("[OfflineAuth] Network went offline");
      this.isOnline = false;
      this.notifyConnectionListeners();
    });

    // Monitor connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener('change', () => {
          this.notifyConnectionListeners();
        });
      }
    }
  }

  private startConnectionMonitoring(): void {
    // Check connection status every 30 seconds
    setInterval(() => {
      this.checkConnectionStatus();
    }, 30000);
  }

  private async checkConnectionStatus(): Promise<void> {
    try {
      // Try to fetch a small resource to verify connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);

      if (response.ok && !this.isOnline) {
        console.log("[OfflineAuth] Connection restored via health check");
        this.isOnline = true;
        this.lastOnlineTime = Date.now();
        this.notifyConnectionListeners();
        this.processRetryQueue();
      }
    } catch (error) {
      if (this.isOnline) {
        console.log("[OfflineAuth] Connection lost via health check");
        this.isOnline = false;
        this.notifyConnectionListeners();
      }
    }
  }

  public getNetworkStatus(): NetworkStatus {
    return {
      isOnline: this.isOnline,
      lastOnlineTime: this.lastOnlineTime,
      connectionType: typeof window !== "undefined" && 'connection' in navigator 
        ? (navigator as any).connection?.effectiveType 
        : undefined
    };
  }

  public addConnectionListener(listener: (status: NetworkStatus) => void): () => void {
    this.connectionListeners.add(listener);
    // Return unsubscribe function
    return () => this.connectionListeners.delete(listener);
  }

  public addAuthStateListener(listener: (state: OfflineAuthState) => void): () => void {
    this.authStateListeners.add(listener);
    // Return unsubscribe function
    return () => this.authStateListeners.delete(listener);
  }

  private notifyConnectionListeners(): void {
    const status = this.getNetworkStatus();
    this.connectionListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error("[OfflineAuth] Error in connection listener:", error);
      }
    });
  }

  private notifyAuthStateListeners(state: OfflineAuthState): void {
    this.authStateListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error("[OfflineAuth] Error in auth state listener:", error);
      }
    });
  }

  public async saveOfflineAuthState(user: User | null, session: Session | null): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      const authState: OfflineAuthState = {
        user,
        session,
        isOnline: this.isOnline,
        lastSyncTime: Date.now(),
        pendingActions: []
      };

      localStorage.setItem('offline_auth_state', JSON.stringify(authState));
      
      this.notifyAuthStateListeners(authState);
      console.log("[OfflineAuth] Saved offline auth state");
    } catch (error) {
      console.error("[OfflineAuth] Failed to save offline auth state:", error);
    }
  }

  public async getOfflineAuthState(): Promise<OfflineAuthState | null> {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem('offline_auth_state');
      if (!stored) return null;

      const authState: OfflineAuthState = JSON.parse(stored);
      
      // Check if the stored session is still valid (not expired)
      if (authState.session && authState.session.expires_at) {
        const expiresAt = new Date(authState.session.expires_at).getTime();
        const now = Date.now();
        
        // If session is expired, clear it
        if (expiresAt <= now) {
          console.log("[OfflineAuth] Stored session expired, clearing");
          this.clearOfflineAuthState();
          return null;
        }
      }

      return authState;
    } catch (error) {
      console.error("[OfflineAuth] Failed to get offline auth state:", error);
      return null;
    }
  }

  public async clearOfflineAuthState(): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem('offline_auth_state');
      console.log("[OfflineAuth] Cleared offline auth state");
    } catch (error) {
      console.error("[OfflineAuth] Failed to clear offline auth state:", error);
    }
  }

  public async queueRetryAction(action: () => Promise<void>): Promise<void> {
    this.retryQueue.push(action);
    console.log("[OfflineAuth] Queued retry action, queue length:", this.retryQueue.length);
    
    // If we're online, try to process immediately
    if (this.isOnline) {
      this.processRetryQueue();
    }
  }

  private async processRetryQueue(): Promise<void> {
    if (this.isRetrying || this.retryQueue.length === 0 || !this.isOnline) {
      return;
    }

    this.isRetrying = true;
    console.log("[OfflineAuth] Processing retry queue, items:", this.retryQueue.length);

    try {
      while (this.retryQueue.length > 0 && this.isOnline) {
        const action = this.retryQueue.shift();
        if (action) {
          try {
            await action();
            console.log("[OfflineAuth] Successfully executed queued action");
          } catch (error) {
            console.error("[OfflineAuth] Failed to execute queued action:", error);
            // Re-queue the action if it failed due to network issues
            if (this.isNetworkError(error)) {
              this.retryQueue.unshift(action);
              break; // Stop processing if we hit a network error
            }
          }
        }
      }
    } finally {
      this.isRetrying = false;
    }
  }

  private isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('network') || 
             message.includes('fetch') || 
             message.includes('connection') ||
             message.includes('timeout') ||
             message.includes('internet_disconnected');
    }
    return false;
  }

  public async handleAuthError(error: unknown): Promise<boolean> {
    const isNetworkError = this.isNetworkError(error);
    
    if (isNetworkError && !this.isOnline) {
      console.log("[OfflineAuth] Network error while offline, will retry when online");
      return true; // Indicates we should continue with offline state
    }
    
    return false; // Indicates we should handle the error normally
  }

  public async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    if (this.isOnline) return true;

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);

      const unsubscribe = this.addConnectionListener((status) => {
        if (status.isOnline) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  public destroy(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
    }
    this.connectionListeners.clear();
    this.authStateListeners.clear();
    this.retryQueue = [];
  }
}

// Singleton instance
export const offlineAuthManager = new OfflineAuthManager();

// Export types and utilities
export { OfflineAuthManager };
