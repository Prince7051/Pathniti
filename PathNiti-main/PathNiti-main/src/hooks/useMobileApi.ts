/**
 * Mobile API Hook
 * Custom hook for making API calls with offline support
 */

import { useState, useEffect, useCallback } from 'react';
import { mobileApiService, ApiResponse } from '@/lib/mobile-api-service';
import { useMobile } from '@/components/MobileProvider';

export interface UseApiOptions {
  immediate?: boolean;
  cacheKey?: string;
  retryCount?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export interface UseApiReturn<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  offline: boolean;
  cached: boolean;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
}

/**
 * Hook for GET requests
 */
export function useApi<T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [cached, setCached] = useState(false);
  
  const { isOnline } = useMobile();
  const { immediate = true, cacheKey, onSuccess, onError } = options;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOffline(false);
    setCached(false);

    try {
      const response: ApiResponse<T> = await mobileApiService.get(
        endpoint,
        cacheKey || endpoint
      );

      if (response.error) {
        setError(response.error);
        setOffline(response.offline || false);
        onError?.(response.error);
      } else {
        setData(response.data || null);
        setOffline(response.offline || false);
        setCached(response.cached || false);
        onSuccess?.(response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [endpoint, cacheKey, onSuccess, onError]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
  }, []);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  // Refetch when coming back online
  useEffect(() => {
    if (isOnline && !loading && error) {
      fetchData();
    }
  }, [isOnline, loading, error, fetchData]);

  return {
    data,
    loading,
    error,
    offline,
    cached,
    refetch: fetchData,
    mutate,
  };
}

/**
 * Hook for POST requests
 */
export function useApiPost<T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiReturn<T> & { post: (body: any) => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [cached, setCached] = useState(false);
  
  const { onSuccess, onError } = options;

  const post = useCallback(async (body: any) => {
    setLoading(true);
    setError(null);
    setOffline(false);
    setCached(false);

    try {
      const response: ApiResponse<T> = await mobileApiService.post(endpoint, body);

      if (response.error) {
        setError(response.error);
        setOffline(response.offline || false);
        onError?.(response.error);
      } else {
        setData(response.data || null);
        setOffline(response.offline || false);
        setCached(response.cached || false);
        onSuccess?.(response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [endpoint, onSuccess, onError]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
  }, []);

  return {
    data,
    loading,
    error,
    offline,
    cached,
    refetch: () => Promise.resolve(),
    mutate,
    post,
  };
}

/**
 * Hook for PUT requests
 */
export function useApiPut<T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiReturn<T> & { put: (body: any) => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [cached, setCached] = useState(false);
  
  const { onSuccess, onError } = options;

  const put = useCallback(async (body: any) => {
    setLoading(true);
    setError(null);
    setOffline(false);
    setCached(false);

    try {
      const response: ApiResponse<T> = await mobileApiService.put(endpoint, body);

      if (response.error) {
        setError(response.error);
        setOffline(response.offline || false);
        onError?.(response.error);
      } else {
        setData(response.data || null);
        setOffline(response.offline || false);
        setCached(response.cached || false);
        onSuccess?.(response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [endpoint, onSuccess, onError]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
  }, []);

  return {
    data,
    loading,
    error,
    offline,
    cached,
    refetch: () => Promise.resolve(),
    mutate,
    put,
  };
}

/**
 * Hook for DELETE requests
 */
export function useApiDelete<T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiReturn<T> & { delete: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [cached, setCached] = useState(false);
  
  const { onSuccess, onError } = options;

  const deleteRequest = useCallback(async () => {
    setLoading(true);
    setError(null);
    setOffline(false);
    setCached(false);

    try {
      const response: ApiResponse<T> = await mobileApiService.delete(endpoint);

      if (response.error) {
        setError(response.error);
        setOffline(response.offline || false);
        onError?.(response.error);
      } else {
        setData(response.data || null);
        setOffline(response.offline || false);
        setCached(response.cached || false);
        onSuccess?.(response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [endpoint, onSuccess, onError]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
  }, []);

  return {
    data,
    loading,
    error,
    offline,
    cached,
    refetch: () => Promise.resolve(),
    mutate,
    delete: deleteRequest,
  };
}

/**
 * Hook for assessment questions
 */
export function useAssessmentQuestions(type?: string, category?: string) {
  const endpoint = `/questions${type ? `?type=${type}` : ''}${category ? `&category=${category}` : ''}`;
  return useApi(endpoint, {
    cacheKey: `questions_${type}_${category}`,
  });
}

/**
 * Hook for colleges
 */
export function useColleges(filters?: any) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
  }
  
  const endpoint = `/colleges?${params.toString()}`;
  return useApi(endpoint, {
    cacheKey: `colleges_${JSON.stringify(filters)}`,
  });
}

/**
 * Hook for scholarships
 */
export function useScholarships(filters?: any) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
  }
  
  const endpoint = `/scholarships?${params.toString()}`;
  return useApi(endpoint, {
    cacheKey: `scholarships_${JSON.stringify(filters)}`,
  });
}

/**
 * Hook for timeline
 */
export function useTimeline() {
  return useApi('/timeline', {
    cacheKey: 'timeline',
  });
}

/**
 * Hook for user profile
 */
export function useUserProfile(userId: string) {
  return useApi(`/profile/${userId}`, {
    cacheKey: `profile_${userId}`,
  });
}

/**
 * Hook for chat messages
 */
export function useChatMessages(sessionId: string) {
  return useApi(`/chat/session/${sessionId}`, {
    cacheKey: `chat_${sessionId}`,
  });
}

/**
 * Hook for recommendations
 */
export function useRecommendations(userId: string) {
  return useApi(`/recommendations?user_id=${userId}`, {
    cacheKey: `recommendations_${userId}`,
  });
}

export default useApi;
