"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Performance-optimized state hook that batches updates and prevents unnecessary re-renders
 */
export function usePerformanceOptimizedState<T>(
  initialState: T,
  options: {
    batchUpdates?: boolean;
    debounceMs?: number;
    maxUpdatesPerSecond?: number;
  } = {}
) {
  const { batchUpdates = true, debounceMs = 16, maxUpdatesPerSecond = 60 } = options;
  
  const [state, setState] = useState(initialState);
  const updateQueue = useRef<T[]>([]);
  const lastUpdate = useRef(0);
  const rafId = useRef<number | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const flushUpdates = useCallback(() => {
    if (updateQueue.current.length > 0) {
      const latestUpdate = updateQueue.current[updateQueue.current.length - 1];
      setState(latestUpdate);
      updateQueue.current = [];
    }
    rafId.current = null;
  }, []);

  const updateState = useCallback((newState: T | ((prev: T) => T)) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate.current;
    const minInterval = 1000 / maxUpdatesPerSecond;

    // Rate limiting
    if (timeSinceLastUpdate < minInterval) {
      return;
    }

    const resolvedState = typeof newState === 'function' 
      ? (newState as (prev: T) => T)(state)
      : newState;

    if (batchUpdates) {
      updateQueue.current.push(resolvedState);
      
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(() => {
          if (debounceMs > 0) {
            if (debounceTimeout.current) {
              clearTimeout(debounceTimeout.current);
            }
            debounceTimeout.current = setTimeout(flushUpdates, debounceMs);
          } else {
            flushUpdates();
          }
        });
      }
    } else {
      setState(resolvedState);
    }
    
    lastUpdate.current = now;
  }, [state, batchUpdates, debounceMs, maxUpdatesPerSecond, flushUpdates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return [state, updateState] as const;
}

/**
 * Hook for debounced state updates
 */
export function useDebouncedState<T>(
  initialState: T,
  delay: number = 300
) {
  return usePerformanceOptimizedState(initialState, {
    batchUpdates: true,
    debounceMs: delay,
    maxUpdatesPerSecond: 10
  });
}

/**
 * Hook for throttled state updates
 */
export function useThrottledState<T>(
  initialState: T,
  maxUpdatesPerSecond: number = 30
) {
  return usePerformanceOptimizedState(initialState, {
    batchUpdates: false,
    debounceMs: 0,
    maxUpdatesPerSecond
  });
}
