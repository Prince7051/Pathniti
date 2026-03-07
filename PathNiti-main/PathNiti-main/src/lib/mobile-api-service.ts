/**
 * Mobile API Service
 * Handles API calls with offline support and mobile-specific features
 */

import { offlineStorageService } from './offline-storage';
import { capacitorService } from './capacitor-service';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  offline?: boolean;
  cached?: boolean;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  cacheKey?: string;
  offlineFallback?: boolean;
  retryCount?: number;
}

class MobileApiService {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Make API request with offline support
   */
  async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      cacheKey,
      offlineFallback = true,
      retryCount = 0,
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    // Check if we're online
    const isOnline = await capacitorService.isOnline();

    // If offline and it's a GET request, try to return cached data
    if (!isOnline && method === 'GET' && cacheKey && offlineFallback) {
      const cachedData = await offlineStorageService.getCachedData(cacheKey);
      if (cachedData) {
        return {
          data: cachedData,
          cached: true,
          offline: true,
        };
      }
    }

    // If offline and not a GET request, store for later sync
    if (!isOnline && method !== 'GET') {
      if (offlineFallback) {
        await this.storeOfflineRequest(endpoint, method, body, headers);
        return {
          data: { message: 'Request queued for sync when online' } as T,
          offline: true,
        };
      } else {
        return {
          error: 'No internet connection',
          offline: true,
        };
      }
    }

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache GET requests
      if (method === 'GET' && cacheKey) {
        await offlineStorageService.cacheData(cacheKey, endpoint, data);
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);

      // If online request failed, try cached data as fallback
      if (method === 'GET' && cacheKey && offlineFallback) {
        const cachedData = await offlineStorageService.getCachedData(cacheKey);
        if (cachedData) {
          return {
            data: cachedData,
            cached: true,
            error: 'Using cached data due to network error',
          };
        }
      }

      // Retry logic for network errors
      if (retryCount < 3 && this.isRetryableError(error)) {
        await this.delay(1000 * Math.pow(2, retryCount)); // Exponential backoff
        return this.request(endpoint, { ...options, retryCount: retryCount + 1 });
      }

      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        offline: !isOnline,
      };
    }
  }

  /**
   * Store offline request for later sync
   */
  private async storeOfflineRequest(
    endpoint: string,
    method: string,
    body: any,
    headers: Record<string, string>
  ): Promise<void> {
    const offlineData = {
      endpoint,
      method,
      body,
      headers,
      timestamp: Date.now(),
    };

    await offlineStorageService.storeOffline(
      'api_requests',
      offlineData,
      'INSERT'
    );
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true; // Network error
    }
    if (error.message && error.message.includes('HTTP 5')) {
      return true; // Server error
    }
    return false;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, cacheKey?: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      cacheKey: cacheKey || endpoint,
    });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Get assessment questions
   */
  async getAssessmentQuestions(type?: string, category?: string): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (category) params.append('category', category);
    
    const endpoint = `/questions?${params.toString()}`;
    return this.get(endpoint, `questions_${type}_${category}`);
  }

  /**
   * Submit assessment
   */
  async submitAssessment(assessmentData: any): Promise<ApiResponse> {
    return this.post('/assessment', assessmentData);
  }

  /**
   * Get colleges
   */
  async getColleges(filters?: any): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    
    const endpoint = `/colleges?${params.toString()}`;
    return this.get(endpoint, `colleges_${JSON.stringify(filters)}`);
  }

  /**
   * Get scholarships
   */
  async getScholarships(filters?: any): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
    }
    
    const endpoint = `/scholarships?${params.toString()}`;
    return this.get(endpoint, `scholarships_${JSON.stringify(filters)}`);
  }

  /**
   * Get timeline
   */
  async getTimeline(): Promise<ApiResponse> {
    return this.get('/timeline', 'timeline');
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<ApiResponse> {
    return this.get(`/profile/${userId}`, `profile_${userId}`);
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, profileData: any): Promise<ApiResponse> {
    return this.put(`/profile/${userId}`, profileData);
  }

  /**
   * Get chat messages
   */
  async getChatMessages(sessionId: string): Promise<ApiResponse> {
    return this.get(`/chat/session/${sessionId}`, `chat_${sessionId}`);
  }

  /**
   * Send chat message
   */
  async sendChatMessage(messageData: any): Promise<ApiResponse> {
    return this.post('/chat/message', messageData);
  }

  /**
   * Get recommendations
   */
  async getRecommendations(userId: string): Promise<ApiResponse> {
    return this.get(`/recommendations?user_id=${userId}`, `recommendations_${userId}`);
  }

  /**
   * Sync offline data
   */
  async syncOfflineData(): Promise<ApiResponse> {
    const result = await offlineStorageService.syncOfflineData();
    return {
      data: result,
    };
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    // Implementation would clear cached data
    console.log('Cache cleared');
  }

  /**
   * Get cache status
   */
  async getCacheStatus(): Promise<{ size: number; items: number }> {
    // Implementation would return cache statistics
    return { size: 0, items: 0 };
  }
}

// Export singleton instance
export const mobileApiService = new MobileApiService();
export default mobileApiService;
