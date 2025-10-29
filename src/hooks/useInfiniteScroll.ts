'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number; // Distance from bottom to trigger load (in pixels)
  rootMargin?: string; // Intersection observer root margin
  enabled?: boolean; // Whether infinite scroll is enabled
}

interface UseInfiniteScrollReturn {
  isFetching: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  reset: () => void;
  setHasMore: (hasMore: boolean) => void;
  setError: (error: string | null) => void;
  lastElementRef: (node: HTMLElement | null) => void;
}

export function useInfiniteScroll<T>(
  fetchMore: () => Promise<T[]>,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollReturn {
  const {
    threshold = 100,
    rootMargin = '0px',
    enabled = true,
  } = options;

  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (isFetching || !enabled) return;
      
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMore();
          }
        },
        { rootMargin }
      );
      
      if (node) observer.current.observe(node);
    },
    [isFetching, hasMore, enabled, rootMargin]
  );

  const loadMore = useCallback(async () => {
    if (isFetching || !hasMore || !enabled) return;

    setIsFetching(true);
    setError(null);

    try {
      const newItems = await fetchMore();
      
      if (newItems.length === 0) {
        setHasMore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more items');
    } finally {
      setIsFetching(false);
    }
  }, [fetchMore, isFetching, hasMore, enabled]);

  const reset = useCallback(() => {
    setIsFetching(false);
    setHasMore(true);
    setError(null);
  }, []);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return {
    isFetching,
    hasMore,
    error,
    loadMore,
    reset,
    setHasMore,
    setError,
    lastElementRef,
  };
}

// Hook for infinite scroll with scroll position tracking
export function useInfiniteScrollWithPosition<T>(
  fetchMore: (page: number) => Promise<T[]>,
  options: UseInfiniteScrollOptions & {
    initialPage?: number;
    itemsPerPage?: number;
  } = {}
) {
  const {
    threshold = 100,
    rootMargin = '0px',
    enabled = true,
    initialPage = 1,
    itemsPerPage = 20,
  } = options;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMoreItems = useCallback(async () => {
    const newItems = await fetchMore(page);
    
    setItems(prev => [...prev, ...newItems]);
    setPage(prev => prev + 1);
    
    return newItems;
  }, [fetchMore, page]);

  const {
    isFetching: isInfiniteScrollFetching,
    lastElementRef,
    reset: resetInfiniteScroll,
  } = useInfiniteScroll(fetchMoreItems, {
    threshold,
    rootMargin,
    enabled: enabled && hasMore,
  });

  // Update fetching state
  useEffect(() => {
    setIsFetching(isInfiniteScrollFetching);
  }, [isInfiniteScrollFetching]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    resetInfiniteScroll();
  }, [initialPage, resetInfiniteScroll]);

  // Load initial items
  useEffect(() => {
    if (items.length === 0 && enabled) {
      const loadInitial = async () => {
        setIsFetching(true);
        setError(null);

        try {
          const initialItems = await fetchMore(initialPage);
          setItems(initialItems);
          setPage(initialPage + 1);
          
          if (initialItems.length < itemsPerPage) {
            setHasMore(false);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load items');
        } finally {
          setIsFetching(false);
        }
      };

      loadInitial();
    }
  }, [fetchMore, initialPage, itemsPerPage, enabled, items.length]);

  return {
    items,
    isFetching,
    hasMore,
    error,
    lastElementRef,
    reset,
    loadMore: fetchMoreItems,
  };
}

// Hook for bidirectional infinite scroll (load more at top and bottom)
export function useBidirectionalInfiniteScroll<T>(
  fetchMore: (direction: 'up' | 'down', cursor?: string) => Promise<{
    items: T[];
    hasMore: boolean;
    cursor?: string;
  }>,
  options: {
    threshold?: number;
    enabled?: boolean;
  } = {}
) {
  const { threshold = 100, enabled = true } = options;

  const [items, setItems] = useState<T[]>([]);
  const [isFetchingUp, setIsFetchingUp] = useState(false);
  const [isFetchingDown, setIsFetchingDown] = useState(false);
  const [hasMoreUp, setHasMoreUp] = useState(true);
  const [hasMoreDown, setHasMoreDown] = useState(true);
  const [upCursor, setUpCursor] = useState<string | undefined>();
  const [downCursor, setDownCursor] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLElement | null>(null);

  const loadMore = useCallback(async (direction: 'up' | 'down') => {
    const isFetching = direction === 'up' ? isFetchingUp : isFetchingDown;
    const hasMore = direction === 'up' ? hasMoreUp : hasMoreDown;
    const cursor = direction === 'up' ? upCursor : downCursor;

    if (isFetching || !hasMore || !enabled) return;

    const setIsFetching = direction === 'up' ? setIsFetchingUp : setIsFetchingDown;
    const setHasMore = direction === 'up' ? setHasMoreUp : setHasMoreDown;
    const setCursor = direction === 'up' ? setUpCursor : setDownCursor;

    setIsFetching(true);
    setError(null);

    try {
      const result = await fetchMore(direction, cursor);
      
      setItems(prev => 
        direction === 'up' 
          ? [...result.items, ...prev]
          : [...prev, ...result.items]
      );
      
      setHasMore(result.hasMore);
      setCursor(result.cursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load more items ${direction}`);
    } finally {
      setIsFetching(false);
    }
  }, [
    fetchMore,
    isFetchingUp,
    isFetchingDown,
    hasMoreUp,
    hasMoreDown,
    upCursor,
    downCursor,
    enabled,
  ]);

  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;

      // Load more at top
      if (scrollTop <= threshold && hasMoreUp && !isFetchingUp) {
        loadMore('up');
      }

      // Load more at bottom
      if (scrollHeight - scrollTop - clientHeight <= threshold && hasMoreDown && !isFetchingDown) {
        loadMore('down');
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadMore, hasMoreUp, hasMoreDown, isFetchingUp, isFetchingDown, threshold, enabled]);

  const reset = useCallback(() => {
    setItems([]);
    setIsFetchingUp(false);
    setIsFetchingDown(false);
    setHasMoreUp(true);
    setHasMoreDown(true);
    setUpCursor(undefined);
    setDownCursor(undefined);
    setError(null);
  }, []);

  return {
    items,
    isFetchingUp,
    isFetchingDown,
    hasMoreUp,
    hasMoreDown,
    error,
    containerRef,
    loadMore,
    reset,
  };
}

// Hook for infinite scroll with search
export function useInfiniteScrollWithSearch<T>(
  searchFunction: (query: string, page: number) => Promise<T[]>,
  searchQuery: string,
  options: {
    debounceMs?: number;
    itemsPerPage?: number;
    enabled?: boolean;
  } = {}
) {
  const { debounceMs = 300, itemsPerPage = 20, enabled = true } = options;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, debounceMs]);

  // Reset when search query changes
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, [debouncedQuery]);

  const fetchMore = useCallback(async () => {
    if (!debouncedQuery.trim()) return [];
    
    const newItems = await searchFunction(debouncedQuery, page);
    
    if (page === 1) {
      setItems(newItems);
    } else {
      setItems(prev => [...prev, ...newItems]);
    }
    
    setPage(prev => prev + 1);
    
    if (newItems.length < itemsPerPage) {
      setHasMore(false);
    }
    
    return newItems;
  }, [searchFunction, debouncedQuery, page, itemsPerPage]);

  const { lastElementRef } = useInfiniteScroll(fetchMore, {
    enabled: enabled && hasMore && debouncedQuery.trim().length > 0,
  });

  // Load initial results when query changes
  useEffect(() => {
    if (debouncedQuery.trim() && enabled) {
      const loadInitial = async () => {
        setIsFetching(true);
        setError(null);

        try {
          await fetchMore();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Search failed');
        } finally {
          setIsFetching(false);
        }
      };

      loadInitial();
    }
  }, [debouncedQuery, enabled]);

  return {
    items,
    isFetching,
    hasMore,
    error,
    lastElementRef,
    searchQuery: debouncedQuery,
  };
}

export default useInfiniteScroll;