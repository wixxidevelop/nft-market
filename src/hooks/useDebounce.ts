'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Basic debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Debounced callback hook
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps?: React.DependencyList
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, deps ? [callback, ...deps] : [callback]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}

// Advanced debounce hook with immediate execution option
export function useAdvancedDebounce<T>(
  value: T,
  delay: number,
  options: {
    leading?: boolean; // Execute immediately on first call
    trailing?: boolean; // Execute after delay (default behavior)
    maxWait?: number; // Maximum time to wait before executing
  } = {}
): T {
  const { leading = false, trailing = true, maxWait } = options;
  
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const lastInvokeTimeRef = useRef<number>(0);
  const leadingRef = useRef<boolean>(true);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;
    const timeSinceLastInvoke = now - lastInvokeTimeRef.current;

    lastCallTimeRef.current = now;

    const shouldInvokeLeading = leading && leadingRef.current;
    const shouldInvokeTrailing = trailing;

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
    }

    // Immediate execution for leading edge
    if (shouldInvokeLeading) {
      setDebouncedValue(value);
      lastInvokeTimeRef.current = now;
      leadingRef.current = false;
    }

    // Set up trailing execution
    if (shouldInvokeTrailing) {
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        lastInvokeTimeRef.current = Date.now();
        leadingRef.current = true;
      }, delay);
    }

    // Set up max wait execution
    if (maxWait && timeSinceLastInvoke < maxWait) {
      const remainingWait = maxWait - timeSinceLastInvoke;
      maxTimeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        lastInvokeTimeRef.current = Date.now();
        leadingRef.current = true;
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }, remainingWait);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, [value, delay, leading, trailing, maxWait]);

  return debouncedValue;
}

// Debounced search hook
export function useDebouncedSearch(
  searchTerm: string,
  searchFunction: (term: string) => Promise<any>,
  delay: number = 300
) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      setError(null);

      try {
        const searchResults = await searchFunction(debouncedSearchTerm);
        setResults(searchResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm, searchFunction]);

  return {
    results,
    loading,
    error,
    searchTerm: debouncedSearchTerm,
  };
}

// Debounced form validation hook
export function useDebouncedValidation<T>(
  values: T,
  validationFunction: (values: T) => Record<string, string>,
  delay: number = 500
) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  
  const debouncedValues = useDebounce(values, delay);

  useEffect(() => {
    setIsValidating(true);
    
    const validate = async () => {
      try {
        const validationErrors = validationFunction(debouncedValues);
        setErrors(validationErrors);
      } catch (error) {
        console.error('Validation error:', error);
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [debouncedValues, validationFunction]);

  return {
    errors,
    isValidating,
    isValid: Object.keys(errors).length === 0,
  };
}

// Debounced API call hook
export function useDebouncedApi<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>,
  delay: number = 300
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedCall = useDebouncedCallback(
    async (...args: P) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'API call failed');
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    delay
  );

  return {
    data,
    loading,
    error,
    call: debouncedCall,
    reset: () => {
      setData(null);
      setError(null);
      setLoading(false);
    },
  };
}

// Debounced resize observer hook
export function useDebouncedResize(
  callback: (entry: ResizeObserverEntry) => void,
  delay: number = 100
) {
  const debouncedCallback = useDebouncedCallback(callback, delay);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(debouncedCallback);
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [debouncedCallback]);

  return elementRef;
}

export default useDebounce;