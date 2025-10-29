// Test suite for useDebounce hooks

import { renderHook, act } from '@testing-library/react';
import {
  useDebounce,
  useDebouncedCallback,
  useAdvancedDebounce,
  useDebouncedSearch,
  useDebouncedValidation,
  useDebouncedApi,
  useDebouncedResize,
} from '@/hooks/useDebounce';

describe('useDebounce Hooks', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('useAdvancedDebounce', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useAdvancedDebounce('initial', 500));
      expect(result.current).toBe('initial');
    });

    it('should debounce value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useAdvancedDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      expect(result.current).toBe('initial');

      // Change value
      rerender({ value: 'updated', delay: 500 });
      expect(result.current).toBe('initial'); // Should still be initial

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('updated');
    });

    it('should reset timer on rapid changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useAdvancedDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      // Rapid changes
      rerender({ value: 'change1', delay: 500 });
      act(() => {
        jest.advanceTimersByTime(250);
      });

      rerender({ value: 'change2', delay: 500 });
      act(() => {
        jest.advanceTimersByTime(250);
      });

      expect(result.current).toBe('initial'); // Should still be initial

      // Complete the debounce
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('change2');
    });

    it('should handle different delay values', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useAdvancedDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 1000 } }
      );

      rerender({ value: 'updated', delay: 1000 });

      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(result.current).toBe('updated');
    });
  });

  describe('useDebouncedCallback', () => {
    it('should debounce callback execution', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback, 500));

      // Call multiple times rapidly
      act(() => {
        result.current('arg1');
        result.current('arg2');
        result.current('arg3');
      });

      expect(callback).not.toHaveBeenCalled();

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('arg3');
    });

    it('should cancel previous calls', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback, 500));

      act(() => {
        result.current('first');
      });

      act(() => {
        jest.advanceTimersByTime(250);
      });

      act(() => {
        result.current('second');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('second');
    });

    it('should handle immediate execution option', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => 
        useDebouncedCallback(callback, 500)
      );

      act(() => {
        result.current('immediate');
      });

      expect(callback).not.toHaveBeenCalled(); // Should be debounced

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('immediate');

      // Subsequent calls should also be debounced
      act(() => {
        result.current('debounced');
      });

      expect(callback).toHaveBeenCalledTimes(1); // Still 1

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith('debounced');
    });
  });

  describe('useAdvancedDebounce', () => {
    it('should provide debounced value with advanced options', () => {
      const { result, rerender } = renderHook(
        ({ value, delay, options }) => useAdvancedDebounce(value, delay, options),
        {
          initialProps: {
            value: 'initial',
            delay: 500,
            options: { leading: false, trailing: true }
          }
        }
      );

      expect(result.current).toBe('initial');

      rerender({
        value: 'updated',
        delay: 500,
        options: { leading: false, trailing: true }
      });

      expect(result.current).toBe('initial'); // Still initial before delay

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('updated'); // Debounced value updated
    });

    it('should handle rapid value changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useAdvancedDebounce(value, 300),
        { initialProps: { value: '' } }
      );

      expect(result.current).toBe('');

      rerender({ value: 'a' });
      expect(result.current).toBe('');

      rerender({ value: 'ab' });
      expect(result.current).toBe('');

      rerender({ value: 'abc' });
      expect(result.current).toBe('');

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('abc');
    });
  });

  describe('useDebouncedSearch', () => {
    it('should debounce search queries', async () => {
      const searchFn = jest.fn().mockResolvedValue(['result1', 'result2']);
      const { result } = renderHook(() => 
        useDebouncedSearch('', searchFn, 500)
      );

      expect(result.current.results).toEqual([]);
      expect(result.current.loading).toBe(false);

      // Simulate search
      const { rerender } = renderHook(
        ({ searchTerm }) => useDebouncedSearch(searchTerm, searchFn, 500),
        { initialProps: { searchTerm: '' } }
      );

      rerender({ searchTerm: 'test' });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Wait for async operation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(searchFn).toHaveBeenCalledWith('test');
    });

    it('should handle empty queries', () => {
      const searchFn = jest.fn();
      const { result } = renderHook(() => 
        useDebouncedSearch('', searchFn, 500)
      );

      expect(result.current.results).toEqual([]);
      expect(searchFn).not.toHaveBeenCalled();
    });

    it('should cancel previous search requests', async () => {
      const searchFn = jest.fn()
        .mockResolvedValueOnce(['result1'])
        .mockResolvedValueOnce(['result2']);

      const { rerender } = renderHook(
        ({ searchTerm }) => useDebouncedSearch(searchTerm, searchFn, 300),
        { initialProps: { searchTerm: '' } }
      );

      rerender({ searchTerm: 'first' });

      act(() => {
        jest.advanceTimersByTime(150);
      });

      rerender({ searchTerm: 'second' });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Wait for async operation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(searchFn).toHaveBeenCalledTimes(1);
      expect(searchFn).toHaveBeenCalledWith('second');
    });
  });

  describe('useDebouncedValidation', () => {
    it('should debounce validation', async () => {
      const validator = jest.fn().mockReturnValue({});
      const { result, rerender } = renderHook(
        ({ values }) => useDebouncedValidation(values, validator, 400),
        { initialProps: { values: { email: '' } } }
      );

      expect(result.current.errors).toEqual({});
      expect(result.current.isValidating).toBe(false);

      rerender({ values: { email: 'test@example.com' } });

      expect(result.current.isValidating).toBe(true);

      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(result.current.isValidating).toBe(false);
      expect(validator).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result.current.errors).toEqual({});
    });

    it('should handle validation errors', async () => {
      const validator = jest.fn().mockReturnValue({ 
        email: 'Invalid email format'
      });

      const { result, rerender } = renderHook(
        ({ values }) => useDebouncedValidation(values, validator, 300),
        { initialProps: { values: { email: '' } } }
      );

      rerender({ values: { email: 'invalid-email' } });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.errors).toEqual({
        email: 'Invalid email format'
      });
      expect(result.current.isValid).toBe(false);
    });
  });

  describe('useDebouncedApi', () => {
    it('should debounce API calls', async () => {
      const apiCall = jest.fn().mockResolvedValue({ data: 'success' });
      const { result } = renderHook(() => useDebouncedApi(apiCall, 600));

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();

      act(() => {
        result.current.call({ param: 'value' });
      });

      expect(result.current.loading).toBe(false); // Not loading yet

      act(() => {
        jest.advanceTimersByTime(600);
      });

      expect(result.current.loading).toBe(true); // Now loading

      // Wait for async operation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(apiCall).toHaveBeenCalledWith({ param: 'value' });
      expect(result.current.data).toEqual({ data: 'success' });
      expect(result.current.loading).toBe(false);
    });

    it('should handle API errors', async () => {
      const apiCall = jest.fn().mockRejectedValue(new Error('API Error'));
      const { result } = renderHook(() => useDebouncedApi(apiCall, 300));

      act(() => {
        result.current.call({ param: 'value' });
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Wait for promise to resolve
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe('API Error');
      expect(result.current.loading).toBe(false); // Loading finished
    });
  });

  describe('useDebouncedResize', () => {
    it('should debounce resize events', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useDebouncedResize(callback, 250));

      const elementRef = result.current;
      
      // Mock element and ResizeObserver
      const mockElement = document.createElement('div');
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn(),
      };
      
      global.ResizeObserver = jest.fn().mockImplementation((callback) => {
        // Simulate resize events
        setTimeout(() => {
          callback([{ target: mockElement }]);
          callback([{ target: mockElement }]);
          callback([{ target: mockElement }]);
        }, 0);
        return mockObserver;
      });

      // Set the ref
      act(() => {
        elementRef.current = mockElement;
      });

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(250);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should cleanup observer on unmount', () => {
      const callback = jest.fn();
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn(),
      };
      
      global.ResizeObserver = jest.fn().mockImplementation(() => mockObserver);

      const { unmount } = renderHook(() => useDebouncedResize(callback, 250));

      unmount();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it('should handle rapid resize events', () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useDebouncedResize(callback, 500));

      const elementRef = result.current;
      const mockElement = document.createElement('div');
      let resizeCallback: (entries: ResizeObserverEntry[]) => void;
      
      global.ResizeObserver = jest.fn().mockImplementation((cb) => {
        resizeCallback = cb;
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
        };
      });

      // Set the ref
      act(() => {
        elementRef.current = mockElement;
      });

      // Rapid resize events
      act(() => {
        for (let i = 0; i < 10; i++) {
          resizeCallback([{
            target: mockElement,
            borderBoxSize: [{ inlineSize: 100, blockSize: 100 }],
            contentBoxSize: [{ inlineSize: 100, blockSize: 100 }],
            contentRect: { x: 0, y: 0, width: 100, height: 100, top: 0, right: 100, bottom: 100, left: 0, toJSON: () => ({}) },
            devicePixelContentBoxSize: [{ inlineSize: 100, blockSize: 100 }]
          }]);
          jest.advanceTimersByTime(50);
        }
      });

      expect(callback).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance', () => {
    it('should not create new functions on every render', () => {
      const callback = jest.fn();
      const { result, rerender } = renderHook(() => 
        useDebouncedCallback(callback, 500)
      );

      const firstRender = result.current;
      rerender();
      const secondRender = result.current;

      expect(firstRender).toBe(secondRender);
    });

    it('should handle high-frequency updates efficiently', () => {
      const { result } = renderHook(() => useDebounce('', 100));

      const startTime = performance.now();

      // Simulate high-frequency updates
      for (let i = 0; i < 1000; i++) {
        act(() => {
          // This would normally cause re-renders
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly (less than 100ms for 1000 operations)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 0),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current).toBe('updated');
    });

    it('should handle negative delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, -100),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // Should behave like zero delay
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current).toBe('updated');
    });

    it('should handle undefined values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: undefined } }
      );

      expect(result.current).toBeUndefined();

       rerender({ value: 'not null' as any });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('defined');
    });

    it('should handle null values', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: null } }
      );

      expect(result.current).toBeNull();

      rerender({ value: 'not null' as any });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('not null');
    });
  });
});