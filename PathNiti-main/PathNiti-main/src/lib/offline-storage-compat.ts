/**
 * Offline Storage Compatibility Layer
 * Provides backward compatibility for existing offline storage usage
 */

import { offlineStorageService } from './offline-storage';

// Create a compatibility object that provides all the methods expected by existing code
export const offlineStorage = {
  // Core methods
  initialize: () => offlineStorageService.initialize(),
  getStorageStats: () => offlineStorageService.getStorageStats(),
  clearAllData: () => offlineStorageService.clearAllData(),
  
  // Assessment methods
  saveAssessmentSession: (data: any) => offlineStorageService.saveAssessmentSession(data),
  getAssessmentSession: (id: string) => offlineStorageService.getAssessmentSession(id),
  updateAssessmentSession: (id: string, updates: any) => offlineStorageService.updateAssessmentSession(id, updates),
  
  // Quiz methods
  saveQuizResponse: (data: any) => offlineStorageService.saveQuizResponse(data),
  getQuizResponses: (sessionId: string) => offlineStorageService.getQuizResponses(sessionId),
  
  // Cache methods
  getCachedColleges: () => offlineStorageService.getCachedColleges(),
  getCachedScholarships: () => offlineStorageService.getCachedScholarships(),
  cacheColleges: (colleges: any[]) => offlineStorageService.cacheColleges(colleges),
  cacheScholarships: (scholarships: any[]) => offlineStorageService.cacheScholarships(scholarships),
  
  // Chat methods
  saveChatMessage: (data: any) => offlineStorageService.saveChatMessage(data),
  
  // Generic methods
  storeOffline: (table: string, data: any, action: 'INSERT' | 'UPDATE' | 'DELETE') => 
    offlineStorageService.storeOffline(table, data, action),
  getOfflineData: (table?: string) => offlineStorageService.getOfflineData(table),
  cacheData: (key: string, table: string, data: any) => offlineStorageService.cacheData(key, table, data),
  getCachedData: (key: string) => offlineStorageService.getCachedData(key),
  getCachedDataByTable: (table: string) => offlineStorageService.getCachedDataByTable(table),
  storeUserData: (key: string, data: any) => offlineStorageService.storeUserData(key, data),
  getUserData: (key: string) => offlineStorageService.getUserData(key),
  syncOfflineData: () => offlineStorageService.syncOfflineData(),
  getSyncStatus: () => offlineStorageService.getSyncStatus(),
  setLastSyncTime: () => offlineStorageService.setLastSyncTime(),
  isDataAvailableOffline: (key: string) => offlineStorageService.isDataAvailableOffline(key),
  getOfflineDataCount: () => offlineStorageService.getOfflineDataCount(),
  clearOldOfflineData: (daysOld?: number) => offlineStorageService.clearOldOfflineData(daysOld),
};

export default offlineStorage;
