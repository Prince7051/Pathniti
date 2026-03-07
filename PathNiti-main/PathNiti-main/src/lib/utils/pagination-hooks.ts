"use client";

/**
 * React hooks for pagination - Client-side only
 */

import { useState, useEffect } from "react";

/**
 * React hook for pagination state management
 */
export function usePagination(initialPage = 1, initialLimit = 10) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const goToPage = (newPage: number) => {
    setPage(Math.max(1, newPage));
  };

  const nextPage = () => {
    setPage((prev) => prev + 1);
  };

  const prevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const changeLimit = (newLimit: number) => {
    setLimit(Math.max(1, newLimit));
    setPage(1); // Reset to first page when changing limit
  };

  const reset = () => {
    setPage(initialPage);
    setLimit(initialLimit);
  };

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    goToPage,
    nextPage,
    prevPage,
    changeLimit,
    reset,
  };
}

/**
 * Infinite scroll pagination utilities
 */
export interface InfiniteScrollParams {
  hasMore: boolean;
  loading: boolean;
  threshold?: number;
}

export function useInfiniteScroll(
  callback: () => void,
  params: InfiniteScrollParams,
) {
  const { hasMore, loading, threshold = 100 } = params;

  useEffect(() => {
    if (!hasMore || loading) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const { scrollTop, scrollHeight, clientHeight } =
            document.documentElement;

          if (scrollTop + clientHeight >= scrollHeight - threshold) {
            callback();
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [callback, hasMore, loading, threshold]);
}
