"use client";

import { useEffect, useCallback, useRef, useState } from "react";

/**
 * Optimized scroll hook that prevents forced reflows by using requestAnimationFrame
 * and passive event listeners
 */
export function useOptimizedScroll(
  callback: (scrollY: number) => void,
  options: {
    throttle?: number;
    passive?: boolean;
  } = {}
) {
  const { throttle = 16, passive = true } = options; // 16ms = ~60fps
  const ticking = useRef(false);
  const lastCall = useRef(0);

  const handleScroll = useCallback(() => {
    const now = Date.now();
    
    if (!ticking.current && now - lastCall.current >= throttle) {
      requestAnimationFrame(() => {
        callback(window.scrollY);
        ticking.current = false;
        lastCall.current = now;
      });
      ticking.current = true;
    }
  }, [callback, throttle]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll, passive]);
}

/**
 * Hook for scroll-based state updates with debouncing
 */
export function useScrollState<T>(
  initialState: T,
  updateFn: (scrollY: number, currentState: T) => T,
  options: {
    throttle?: number;
    passive?: boolean;
  } = {}
) {
  const [state, setState] = useState(initialState);
  
  const handleScroll = useCallback((scrollY: number) => {
    setState(currentState => updateFn(scrollY, currentState));
  }, [updateFn]);

  useOptimizedScroll(handleScroll, options);

  return state;
}

/**
 * Hook for scroll position tracking with optimized performance
 */
export function useScrollPosition(options: {
  throttle?: number;
  passive?: boolean;
} = {}) {
  return useScrollState(
    0,
    (scrollY) => scrollY,
    options
  );
}

/**
 * Hook for scroll direction tracking
 */
export function useScrollDirection(options: {
  threshold?: number;
  throttle?: number;
  passive?: boolean;
} = {}) {
  const { threshold = 5 } = options;
  
  return useScrollState(
    { direction: "down" as "up" | "down", lastY: 0 },
    (scrollY, currentState) => {
      const diff = scrollY - currentState.lastY;
      
      if (Math.abs(diff) < threshold) {
        return currentState;
      }
      
      return {
        direction: (diff > 0 ? "down" : "up") as "up" | "down",
        lastY: scrollY,
      };
    },
    options
  );
}
