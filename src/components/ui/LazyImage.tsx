'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  fallback?: string;
  quality?: number;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  threshold?: number;
  rootMargin?: string;
  'aria-label'?: string;
  role?: string;
  onLoad?: () => void;
  onLoadStart?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  placeholder = '/images/placeholder.svg',
  fallback,
  quality = 75,
  priority = false,
  fill = false,
  sizes,
  threshold = 0.1,
  rootMargin = '50px',
  'aria-label': ariaLabel,
  role,
  onLoad,
  onLoadStart,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    // Check if IntersectionObserver is available
    if (typeof window !== 'undefined' && window.IntersectionObserver) {
      const observer = new window.IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              onLoadStart?.();
              observer.disconnect();
            }
          });
        },
        {
          rootMargin: rootMargin, // Use the prop value
          threshold: threshold,   // Use the prop value
        }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    } else {
      // Fallback: load image immediately if IntersectionObserver is not available
      setIsInView(true);
      onLoadStart?.();
    }
  }, [priority, isInView, onLoadStart]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    if (fallback && currentSrc !== fallback) {
      setCurrentSrc(fallback);
      setHasError(false); // Reset error state when switching to fallback
      setIsLoading(false); // Don't show loading state for fallback
    } else {
      setIsLoading(false);
      setHasError(true);
    }
    onError?.();
  };

  const imageProps: any = {
    alt,
    quality,
    onLoad: handleLoad,
    onError: handleError,
    className: cn(
      'transition-opacity duration-300',
      isLoading ? 'opacity-0' : 'opacity-100',
      className
    ),
    ...(fill ? { fill: true } : { width, height }),
    ...(sizes && { sizes }),
    ...(priority && { priority: true }),
    ...(ariaLabel && { 'aria-label': ariaLabel }),
    ...(role && { role }),
  };

  const placeholderProps = {
    alt: "",
    fill,
    width: fill ? undefined : width,
    height: fill ? undefined : height,
    className: cn('absolute inset-0 blur-sm scale-110 -z-10'),
    priority: false,
  };

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-gray-100',
        fill ? 'w-full h-full' : '',
        className
      )}
      style={!fill ? { width, height } : undefined}
    >
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100" data-loading="true" data-testid="loading-placeholder">
          <div className="animate-pulse">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400" data-error="true">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Blur placeholder while loading */}
      {isLoading && !hasError && placeholder && (
        <Image
          src={placeholder}
          {...placeholderProps}
        />
      )}

      {/* Actual image */}
      {isInView && !hasError && (
        <Image
          src={currentSrc}
          data-testid="lazy-image"
          {...imageProps}
        />
      )}
    </div>
  );
};

export default LazyImage;