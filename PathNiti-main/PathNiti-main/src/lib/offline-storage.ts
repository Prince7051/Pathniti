/**
 * Offline Storage Service
 * Handles offline data storage and synchronization with Supabase
 */

import { supabase } from './supabase';
import { capacitorService } from './capacitor-service';

export interface OfflineData {
  id: string;
  table: string;
  data: any;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  timestamp: number;
  synced: boolean;
}

export interface OfflineChatMessage {
  id: string;
  session_id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  synced: boolean;
  metadata?: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private syncInProgress = false;

  /**
   * Initialize offline storage
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize IndexedDB
      await this.initializeIndexedDB();

      this.isInitialized = true;
      console.log('OfflineStorageService: Initialized successfully');
    } catch (error) {
      console.error('OfflineStorageService: Initialization failed', error);
    }
  }

  /**
   * Initialize IndexedDB
   */
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PathNitiOffline', 1);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores for different data types
        if (!db.objectStoreNames.contains('offline_data')) {
          const offlineStore = db.createObjectStore('offline_data', { keyPath: 'id' });
          offlineStore.createIndex('table', 'table', { unique: false });
          offlineStore.createIndex('synced', 'synced', { unique: false });
          offlineStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('cached_data')) {
          const cacheStore = db.createObjectStore('cached_data', { keyPath: 'key' });
          cacheStore.createIndex('table', 'table', { unique: false });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('user_data')) {
          const userStore = db.createObjectStore('user_data', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Store data offline for later sync
   */
  async storeOffline(table: string, data: any, action: 'INSERT' | 'UPDATE' | 'DELETE'): Promise<string> {
    if (!this.db) {
      throw new Error('Offline storage not initialized');
    }

    const offlineData: OfflineData = {
      id: `${table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      table,
      data,
      action,
      timestamp: Date.now(),
      synced: false,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_data'], 'readwrite');
      const store = transaction.objectStore('offline_data');
      const request = store.add(offlineData);

      request.onsuccess = () => {
        console.log('Data stored offline:', offlineData.id);
        resolve(offlineData.id);
      };

      request.onerror = () => {
        reject(new Error('Failed to store data offline'));
      };
    });
  }

  /**
   * Get offline data by table
   */
  async getOfflineData(table?: string): Promise<OfflineData[]> {
    if (!this.db) {
      throw new Error('Offline storage not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_data'], 'readonly');
      const store = transaction.objectStore('offline_data');
      const request = table 
        ? store.index('table').getAll(table)
        : store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to get offline data'));
      };
    });
  }

  /**
   * Cache data for offline access
   */
  async cacheData(key: string, table: string, data: any): Promise<void> {
    if (!this.db) {
      throw new Error('Offline storage not initialized');
    }

    const cacheData = {
      key,
      table,
      data,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached_data'], 'readwrite');
      const store = transaction.objectStore('cached_data');
      const request = store.put(cacheData);

      request.onsuccess = () => {
        console.log('Data cached:', key);
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to cache data'));
      };
    });
  }

  /**
   * Get cached data
   */
  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) {
      throw new Error('Offline storage not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached_data'], 'readonly');
      const store = transaction.objectStore('cached_data');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check if cache is still valid (24 hours)
          const isExpired = Date.now() - result.timestamp > 24 * 60 * 60 * 1000;
          if (isExpired) {
            resolve(null);
          } else {
            resolve(result.data);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to get cached data'));
      };
    });
  }

  /**
   * Get cached data by table
   */
  async getCachedDataByTable(table: string): Promise<any[]> {
    if (!this.db) {
      throw new Error('Offline storage not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached_data'], 'readonly');
      const store = transaction.objectStore('cached_data');
      const request = store.index('table').getAll(table);

      request.onsuccess = () => {
        const results = request.result || [];
        const validResults = results.filter(result => {
          const isExpired = Date.now() - result.timestamp > 24 * 60 * 60 * 1000;
          return !isExpired;
        });
        resolve(validResults.map(result => result.data));
      };

      request.onerror = () => {
        reject(new Error('Failed to get cached data by table'));
      };
    });
  }

  /**
   * Store user data locally
   */
  async storeUserData(key: string, data: any): Promise<void> {
    if (!this.db) {
      throw new Error('Offline storage not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['user_data'], 'readwrite');
      const store = transaction.objectStore('user_data');
      const request = store.put({ key, data, timestamp: Date.now() });

      request.onsuccess = () => {
        console.log('User data stored:', key);
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to store user data'));
      };
    });
  }

  /**
   * Get user data
   */
  async getUserData(key: string): Promise<any | null> {
    if (!this.db) {
      throw new Error('Offline storage not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['user_data'], 'readonly');
      const store = transaction.objectStore('user_data');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };

      request.onerror = () => {
        reject(new Error('Failed to get user data'));
      };
    });
  }

  /**
   * Sync offline data with Supabase
   */
  async syncOfflineData(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    this.syncInProgress = true;
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] };

    try {
      const offlineData = await this.getOfflineData();
      const unsyncedData = offlineData.filter(item => !item.synced);

      console.log(`Syncing ${unsyncedData.length} offline items`);

      for (const item of unsyncedData) {
        try {
          let success = false;

          switch (item.action) {
            case 'INSERT':
              const { error: insertError } = await (supabase as any)
                .from(item.table)
                .insert(item.data);
              success = !insertError;
              break;

            case 'UPDATE':
              const { error: updateError } = await (supabase as any)
                .from(item.table)
                .update(item.data)
                .eq('id', item.data.id);
              success = !updateError;
              break;

            case 'DELETE':
              const { error: deleteError } = await (supabase as any)
                .from(item.table)
                .delete()
                .eq('id', item.data.id);
              success = !deleteError;
              break;
          }

          if (success) {
            await this.markAsSynced(item.id);
            result.synced++;
          } else {
            result.failed++;
            result.errors.push(`Failed to sync ${item.id}: ${item.action} on ${item.table}`);
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Error syncing ${item.id}: ${error}`);
        }
      }

      result.success = result.failed === 0;
      console.log('Sync completed:', result);
    } catch (error) {
      result.success = false;
      result.errors.push(`Sync failed: ${error}`);
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  /**
   * Mark offline data as synced
   */
  private async markAsSynced(id: string): Promise<void> {
    if (!this.db) {
      throw new Error('Offline storage not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_data'], 'readwrite');
      const store = transaction.objectStore('offline_data');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const data = getRequest.result;
        if (data) {
          data.synced = true;
          const putRequest = store.put(data);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error('Failed to mark as synced'));
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to get data for marking as synced'));
      };
    });
  }

  /**
   * Clear old offline data
   */
  async clearOldOfflineData(daysOld: number = 7): Promise<void> {
    if (!this.db) {
      throw new Error('Offline storage not initialized');
    }

    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_data'], 'readwrite');
      const store = transaction.objectStore('offline_data');
      const request = store.getAll();

      request.onsuccess = () => {
        const data = request.result || [];
        const oldData = data.filter(item => item.timestamp < cutoffTime && item.synced);

        if (oldData.length === 0) {
          resolve();
          return;
        }

        const deletePromises = oldData.map(item => {
          return new Promise<void>((resolveDelete, rejectDelete) => {
            const deleteRequest = store.delete(item.id);
            deleteRequest.onsuccess = () => resolveDelete();
            deleteRequest.onerror = () => rejectDelete(new Error('Failed to delete old data'));
          });
        });

        Promise.all(deletePromises)
          .then(() => {
            console.log(`Cleared ${oldData.length} old offline data items`);
            resolve();
          })
          .catch(reject);
      };

      request.onerror = () => {
        reject(new Error('Failed to get offline data for cleanup'));
      };
    });
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{ pending: number; lastSync: number | null }> {
    if (!this.db) {
      return { pending: 0, lastSync: null };
    }

    try {
      const offlineData = await this.getOfflineData();
      const pending = offlineData.filter(item => !item.synced).length;
      const lastSync = await this.getUserData('last_sync');
      
      return {
        pending,
        lastSync: lastSync ? parseInt(lastSync) : null,
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return { pending: 0, lastSync: null };
    }
  }

  /**
   * Set last sync time
   */
  async setLastSyncTime(): Promise<void> {
    await this.storeUserData('last_sync', Date.now().toString());
  }

  /**
   * Check if data is available offline
   */
  async isDataAvailableOffline(key: string): Promise<boolean> {
    const cachedData = await this.getCachedData(key);
    return cachedData !== null;
  }

  /**
   * Get offline data count
   */
  async getOfflineDataCount(): Promise<number> {
    const offlineData = await this.getOfflineData();
    return offlineData.length;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{ 
    totalSize: number; 
    itemCount: number; 
    lastUpdated: string;
    quizResponses: number;
    assessmentSessions: number;
    chatMessages: number;
    cachedColleges: number;
    cachedScholarships: number;
  }> {
    if (!this.db) {
      return { 
        totalSize: 0, 
        itemCount: 0, 
        lastUpdated: new Date().toISOString(),
        quizResponses: 0,
        assessmentSessions: 0,
        chatMessages: 0,
        cachedColleges: 0,
        cachedScholarships: 0,
      };
    }

    try {
      const offlineData = await this.getOfflineData();
      const cachedData = await this.getCachedDataByTable('all');
      
      const totalSize = JSON.stringify(offlineData).length + JSON.stringify(cachedData).length;
      const itemCount = offlineData.length + cachedData.length;
      const lastUpdated = new Date().toISOString();

      // Count specific data types
      const quizResponses = offlineData.filter(item => item.table === 'quiz_responses').length;
      const assessmentSessions = offlineData.filter(item => item.table === 'assessment_sessions').length;
      const chatMessages = offlineData.filter(item => item.table === 'chat_messages').length;
      const cachedColleges = cachedData.filter(item => item.table === 'colleges').length;
      const cachedScholarships = cachedData.filter(item => item.table === 'scholarships').length;

      return { 
        totalSize, 
        itemCount, 
        lastUpdated,
        quizResponses,
        assessmentSessions,
        chatMessages,
        cachedColleges,
        cachedScholarships,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { 
        totalSize: 0, 
        itemCount: 0, 
        lastUpdated: new Date().toISOString(),
        quizResponses: 0,
        assessmentSessions: 0,
        chatMessages: 0,
        cachedColleges: 0,
        cachedScholarships: 0,
      };
    }
  }

  /**
   * Clear all offline data
   */
  async clearAllData(): Promise<void> {
    if (!this.db) {
      throw new Error('Offline storage not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_data', 'cached_data', 'user_data'], 'readwrite');
      
      const clearOfflineData = transaction.objectStore('offline_data').clear();
      const clearCachedData = transaction.objectStore('cached_data').clear();
      const clearUserData = transaction.objectStore('user_data').clear();

      transaction.oncomplete = () => {
        console.log('All offline data cleared');
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error('Failed to clear offline data'));
      };
    });
  }

  /**
   * Get cached colleges
   */
  async getCachedColleges(): Promise<any[]> {
    return this.getCachedDataByTable('colleges');
  }

  /**
   * Save assessment session
   */
  async saveAssessmentSession(sessionData: any): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.storeUserData(`assessment_session_${sessionId}`, sessionData);
    return sessionId;
  }

  /**
   * Save quiz response
   */
  async saveQuizResponse(responseData: any): Promise<string> {
    return await this.storeOffline('quiz_responses', responseData, 'INSERT');
  }

  /**
   * Get assessment session
   */
  async getAssessmentSession(sessionId: string): Promise<any | null> {
    return this.getUserData(`assessment_session_${sessionId}`);
  }

  /**
   * Update assessment session
   */
  async updateAssessmentSession(sessionId: string, updates: any): Promise<void> {
    const session = await this.getAssessmentSession(sessionId);
    if (session) {
      const updatedSession = { ...session, ...updates };
      await this.storeUserData(`assessment_session_${sessionId}`, updatedSession);
    }
  }

  /**
   * Get quiz responses
   */
  async getQuizResponses(sessionId: string): Promise<any[]> {
    const offlineData = await this.getOfflineData('quiz_responses');
    return offlineData.filter(item => item.data.session_id === sessionId).map(item => item.data);
  }

  /**
   * Get cached scholarships
   */
  async getCachedScholarships(): Promise<any[]> {
    return this.getCachedDataByTable('scholarships');
  }

  /**
   * Cache colleges
   */
  async cacheColleges(colleges: any[]): Promise<void> {
    for (const college of colleges) {
      await this.cacheData(`college_${college.id}`, 'colleges', college);
    }
  }

  /**
   * Cache scholarships
   */
  async cacheScholarships(scholarships: any[]): Promise<void> {
    for (const scholarship of scholarships) {
      await this.cacheData(`scholarship_${scholarship.id}`, 'scholarships', scholarship);
    }
  }

  /**
   * Save chat message
   */
  async saveChatMessage(messageData: any): Promise<void> {
    await this.storeOffline('chat_messages', messageData, 'INSERT');
  }

  /**
   * Get chat messages
   */
  async getChatMessages(sessionId: string): Promise<any[]> {
    const offlineData = await this.getOfflineData('chat_messages');
    return offlineData.filter(item => item.data.session_id === sessionId).map(item => item.data);
  }

  /**
   * Get unsynced quiz responses
   */
  async getUnsyncedQuizResponses(): Promise<any[]> {
    const offlineData = await this.getOfflineData('quiz_responses');
    return offlineData.filter(item => !item.synced).map(item => item.data);
  }

  /**
   * Mark quiz response as synced
   */
  async markQuizResponseSynced(responseId: string): Promise<void> {
    const offlineData = await this.getOfflineData('quiz_responses');
    const response = offlineData.find(item => item.data.id === responseId);
    if (response) {
      response.synced = true;
      // Update in storage
      await this.markAsSynced(response.id);
    }
  }

  /**
   * Get unsynced assessment sessions
   */
  async getUnsyncedAssessmentSessions(): Promise<any[]> {
    const offlineData = await this.getOfflineData('assessment_sessions');
    return offlineData.filter(item => !item.synced).map(item => item.data);
  }

  /**
   * Get sync queue
   */
  async getSyncQueue(): Promise<any[]> {
    const offlineData = await this.getOfflineData();
    return offlineData.filter(item => !item.synced);
  }

  /**
   * Remove from sync queue
   */
  async removeFromSyncQueue(itemId: string): Promise<void> {
    await this.markAsSynced(itemId);
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<any | null> {
    return this.getUserData('user_profile');
  }

  /**
   * Save user profile
   */
  async saveUserProfile(profileData: any): Promise<void> {
    await this.storeUserData('user_profile', profileData);
  }

  /**
   * Cache awareness content
   */
  async cacheAwarenessContent(content: any): Promise<void> {
    await this.cacheData('awareness_content', 'awareness', content);
  }

  /**
   * Get cached careers
   */
  async getCachedCareers(): Promise<any[]> {
    return this.getCachedDataByTable('careers');
  }
}

// Export singleton instance
export const offlineStorageService = new OfflineStorageService();
export const offlineStorage = offlineStorageService; // Alias for backward compatibility
export default offlineStorageService;