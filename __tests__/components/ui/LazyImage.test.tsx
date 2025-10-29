// Test suite for LazyImage component

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LazyImage from '@/components/ui/LazyImage';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

mockIntersectionObserver.mockImplementation((callback) => {
  // Simulate intersection immediately when observe is called
  const mockObserveWithCallback = jest.fn((target) => {
    // Trigger intersection callback immediately to simulate element entering viewport
    setTimeout(() => {
      callback([{ isIntersecting: true, target }]);
    }, 0);
  });

  return {
    observe: mockObserveWithCallback,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
  };
});

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, onLoad, onError, ...props }: any) => {
    const handleLoad = () => {
      if (onLoad) onLoad();
    };
    
    const handleError = () => {
      if (onError) onError();
    };
    
    // Only render the image if it has data-testid (actual image, not placeholder)
    if (props['data-testid'] === 'lazy-image') {
      return (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      );
    }
    
    // For placeholder images, don't include data-testid
    return (
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    );
  },
}));

describe('LazyImage Component', () => {
  beforeEach(() => {
    window.IntersectionObserver = mockIntersectionObserver;
    jest.clearAllMocks();
    
    // Reset the mock implementation for each test
    mockIntersectionObserver.mockImplementation((callback) => {
      const mockObserveWithCallback = jest.fn((target) => {
        // Trigger intersection callback immediately to simulate element entering viewport
        setTimeout(() => {
          callback([{ isIntersecting: true, target }]);
        }, 0);
      });

      return {
        observe: mockObserveWithCallback,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with basic props', async () => {
      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={300}
          height={200}
        />
      );

      // Wait for intersection observer to trigger
      await waitFor(() => {
        expect(screen.getByTestId('lazy-image')).toBeInTheDocument();
        expect(screen.getByAltText('Test image')).toBeInTheDocument();
      });
    });

    it('should render placeholder initially when not in viewport', () => {
      const { container } = render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={300}
          height={200}
          placeholder="/placeholder.jpg"
        />
      );

      // Check for loading state instead of placeholder attribute
      const loadingElement = container.querySelector('[data-loading="true"]');
      expect(loadingElement).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={300}
          height={200}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render with custom dimensions', async () => {
      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={500}
          height={300}
        />
      );

      // Wait for intersection observer to trigger
      await waitFor(() => {
        const image = screen.getByTestId('lazy-image');
        expect(image).toHaveAttribute('width', '500');
        expect(image).toHaveAttribute('height', '300');
      });
    });
  });

  describe('Intersection Observer Integration', () => {
    it('should create IntersectionObserver on mount', () => {
      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={300}
          height={200}
        />
      );

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          threshold: 0.1,
          rootMargin: '50px',
        })
      );
    });

    it('should observe the image element', () => {
      const mockObserve = jest.fn();
      mockIntersectionObserver.mockReturnValue({
        observe: mockObserve,
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      });

      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={300}
          height={200}
        />
      );

      expect(mockObserve).toHaveBeenCalled();
    });

    it('should disconnect observer on unmount', () => {
      const mockDisconnect = jest.fn();
      mockIntersectionObserver.mockReturnValue({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      });

      const { unmount } = render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={300}
          height={200}
        />
      );

      unmount();
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should handle custom intersection options', () => {
      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={300}
          height={200}
          threshold={0.5}
          rootMargin="100px"
        />
      );

      expect(mockIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          threshold: 0.5,
          rootMargin: '100px',
        })
      );
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      const { container } = render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={300}
          height={200}
        />
      );

      expect(container.querySelector('[data-loading="true"]')).toBeInTheDocument();
    });

    it('should call onLoadStart when loading begins', () => {
      const onLoadStart = jest.fn();
      
      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={300}
          height={200}
          onLoadStart={onLoadStart}
        />
      );

      // Simulate intersection
      const callback = mockIntersectionObserver.mock.calls[0][0] as IntersectionObserverCallback;
      const mockEntry: IntersectionObserverEntry = {
        isIntersecting: true,
        target: document.createElement('div'),
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRatio: 1,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: {} as DOMRectReadOnly,
        time: Date.now(),
      };
      callback([mockEntry], {} as IntersectionObserver);

      expect(onLoadStart).toHaveBeenCalled();
    });

    it('should call onLoad when image loads successfully', async () => {
      const onLoad = jest.fn();
      
      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={300}
          height={200}
          onLoad={onLoad}
        />
      );

      // Wait for intersection observer to trigger and image to be rendered
      await waitFor(() => {
        expect(screen.getByTestId('lazy-image')).toBeInTheDocument();
      });

      // Simulate image load event
      const image = screen.getByTestId('lazy-image');
      fireEvent.load(image);

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalled();
      });
    });

    it('should call onError when image fails to load', async () => {
      const onError = jest.fn();
      
      render(
        <LazyImage
          src="/invalid-image.jpg"
          alt="Test image"
          width={300}
          height={200}
          onError={onError}
        />
      );

      // Wait for intersection observer to trigger and image to be rendered
      await waitFor(() => {
        expect(screen.getByTestId('lazy-image')).toBeInTheDocument();
      });

      // Simulate image error event
      const image = screen.getByTestId('lazy-image');
      fireEvent.error(image);

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show fallback image on error', async () => {
      render(
        <LazyImage
          src="/invalid-image.jpg"
          alt="Test image"
          width={300}
          height={200}
          fallback="/fallback-image.jpg"
        />
      );

      // Wait for intersection observer to trigger and image to be rendered
      await waitFor(() => {
        expect(screen.getByTestId('lazy-image')).toBeInTheDocument();
      });

      const image = screen.getByTestId('lazy-image');
      fireEvent.error(image);

      await waitFor(() => {
        expect(image).toHaveAttribute('src', '/fallback-image.jpg');
      });
    });

    it('should show error state when no fallback provided', async () => {
      const { container } = render(
        <LazyImage
          src="/invalid-image.jpg"
          alt="Test image"
          width={300}
          height={200}
        />
      );

      // Wait for intersection observer to trigger and image to be rendered
      await waitFor(() => {
        expect(screen.getByTestId('lazy-image')).toBeInTheDocument();
      });

      const image = screen.getByTestId('lazy-image');
      fireEvent.error(image);

      await waitFor(() => {
        expect(container.querySelector('[data-error="true"]')).toBeInTheDocument();
      });
    });

    it('should handle missing IntersectionObserver gracefully', () => {
      // @ts-ignore
      window.IntersectionObserver = undefined;

      expect(() => {
        render(
          <LazyImage
            src="/test-image.jpg"
            alt="Test image"
            width={300}
            height={200}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should not load image initially when not in viewport', async () => {
      // Override the mock to not trigger intersection immediately
      mockIntersectionObserver.mockReturnValue({
        observe: mockObserve,
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      });

      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={300}
          height={200}
        />
      );

      // Image should not be loaded initially - check that lazy-image is not present
      expect(screen.queryByTestId('lazy-image')).not.toBeInTheDocument();
      
      // But loading state should be present
      expect(screen.getByTestId('loading-placeholder')).toBeInTheDocument();
    });

    it('should load image when entering viewport', async () => {
      let intersectionCallback: IntersectionObserverCallback;
      mockIntersectionObserver.mockImplementation((callback: IntersectionObserverCallback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        };
      });

      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={300}
          height={200}
        />
      );

      // Simulate entering viewport
      const mockEntry: IntersectionObserverEntry = {
        isIntersecting: true,
        target: document.createElement('div'),
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRatio: 1,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: {} as DOMRectReadOnly,
        time: Date.now(),
      };
      
      intersectionCallback!([mockEntry], {} as IntersectionObserver);

      await waitFor(() => {
        const image = screen.getByTestId('lazy-image');
        expect(image).toHaveAttribute('src', '/test-image.jpg');
      });
    });

    it('should disconnect observer after loading', async () => {
      const mockDisconnectLocal = jest.fn();
      let intersectionCallback: IntersectionObserverCallback;
      
      mockIntersectionObserver.mockImplementation((callback: IntersectionObserverCallback) => {
        intersectionCallback = callback;
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: mockDisconnectLocal,
        };
      });

      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={300}
          height={200}
        />
      );

      // Simulate entering viewport
      const mockEntry: IntersectionObserverEntry = {
        isIntersecting: true,
        target: document.createElement('div'),
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRatio: 1,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: {} as DOMRectReadOnly,
        time: Date.now(),
      };
      
      intersectionCallback!([mockEntry], {} as IntersectionObserver);

      await waitFor(() => {
        expect(mockDisconnectLocal).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text', async () => {
      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Descriptive alt text"
          width={300}
          height={200}
        />
      );

      // Wait for intersection observer to trigger
      await waitFor(() => {
        const image = screen.getByTestId('lazy-image');
        expect(image).toHaveAttribute('alt', 'Descriptive alt text');
      });
    });

    it('should support aria-label', async () => {
      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={300}
          height={200}
          aria-label="Custom aria label"
        />
      );

      // Wait for intersection observer to trigger
      await waitFor(() => {
        expect(screen.getByLabelText('Custom aria label')).toBeInTheDocument();
      });
    });

    it('should support role attribute', async () => {
      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={300}
          height={200}
          role="presentation"
        />
      );

      // Wait for intersection observer to trigger
      await waitFor(() => {
        expect(screen.getByRole('presentation')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty src gracefully', () => {
      expect(() => {
        render(
          <LazyImage
            src=""
            alt="Test image"
            width={300}
            height={200}
          />
        );
      }).not.toThrow();
    });

    it('should handle very small dimensions', async () => {
      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={1}
          height={1}
        />
      );

      // Wait for intersection observer to trigger
      await waitFor(() => {
        const image = screen.getByTestId('lazy-image');
        expect(image).toHaveAttribute('width', '1');
        expect(image).toHaveAttribute('height', '1');
      });
    });

    it('should handle very large dimensions', async () => {
      render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={5000}
          height={3000}
        />
      );

      // Wait for intersection observer to trigger
      await waitFor(() => {
        const image = screen.getByTestId('lazy-image');
        expect(image).toHaveAttribute('width', '5000');
        expect(image).toHaveAttribute('height', '3000');
      });
    });

    it('should handle rapid mount/unmount cycles', () => {
      const { unmount } = render(
        <LazyImage
          src="/test-image.jpg"
          alt="Test image"
          width={300}
          height={200}
        />
      );

      unmount();
      
      expect(() => {
        render(
          <LazyImage
            src="/test-image-2.jpg"
            alt="Test image 2"
            width={300}
            height={200}
          />
        );
      }).not.toThrow();
    });
  });
});