// Performance monitoring and optimization utilities

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface DatabaseQueryMetric {
  query: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private dbQueries: DatabaseQueryMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics
  private maxQueries = 500;  // Keep last 500 queries

  // Record a performance metric
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // Record database query performance
  recordDbQuery(query: string, duration: number, success: boolean, error?: string): void {
    const queryMetric: DatabaseQueryMetric = {
      query: query.substring(0, 200), // Truncate long queries
      duration,
      timestamp: Date.now(),
      success,
      error,
    };

    this.dbQueries.push(queryMetric);

    // Keep only the most recent queries
    if (this.dbQueries.length > this.maxQueries) {
      this.dbQueries = this.dbQueries.slice(-this.maxQueries);
    }
  }

  // Get performance summary
  getSummary(timeWindowMs: number = 300000): {
    metrics: Record<string, { avg: number; min: number; max: number; count: number }>;
    dbQueries: { avgDuration: number; totalQueries: number; errorRate: number };
    memoryUsage: NodeJS.MemoryUsage;
  } {
    const now = Date.now();
    const cutoff = now - timeWindowMs;

    // Filter recent metrics
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);
    const recentQueries = this.dbQueries.filter(q => q.timestamp > cutoff);

    // Aggregate metrics by name
    const metricsSummary: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    recentMetrics.forEach(metric => {
      if (!metricsSummary[metric.name]) {
        metricsSummary[metric.name] = {
          avg: 0,
          min: metric.value,
          max: metric.value,
          count: 0,
        };
      }

      const summary = metricsSummary[metric.name];
      summary.min = Math.min(summary.min, metric.value);
      summary.max = Math.max(summary.max, metric.value);
      summary.count++;
    });

    // Calculate averages
    Object.keys(metricsSummary).forEach(name => {
      const values = recentMetrics
        .filter(m => m.name === name)
        .map(m => m.value);
      
      metricsSummary[name].avg = values.reduce((a, b) => a + b, 0) / values.length;
    });

    // Database query summary
    const totalQueries = recentQueries.length;
    const errorQueries = recentQueries.filter(q => !q.success).length;
    const avgDuration = totalQueries > 0 
      ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / totalQueries 
      : 0;

    return {
      metrics: metricsSummary,
      dbQueries: {
        avgDuration,
        totalQueries,
        errorRate: totalQueries > 0 ? errorQueries / totalQueries : 0,
      },
      memoryUsage: process.memoryUsage(),
    };
  }

  // Get slow database queries
  getSlowQueries(thresholdMs: number = 1000, limit: number = 10): DatabaseQueryMetric[] {
    return this.dbQueries
      .filter(q => q.duration > thresholdMs)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  // Clear old metrics
  cleanup(olderThanMs: number = 3600000): void {
    const cutoff = Date.now() - olderThanMs;
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.dbQueries = this.dbQueries.filter(q => q.timestamp > cutoff);
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// Performance timing utilities
export const timing = {
  // Measure execution time of a function
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      performanceMonitor.recordMetric(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      performanceMonitor.recordMetric(name, duration, { error: true });
      throw error;
    }
  },

  // Measure synchronous function
  measureSync<T>(name: string, fn: () => T): T {
    const start = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - start;
      performanceMonitor.recordMetric(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      performanceMonitor.recordMetric(name, duration, { error: true });
      throw error;
    }
  },

  // Start a timer
  start(name: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      performanceMonitor.recordMetric(name, duration);
    };
  },
};

// Database performance wrapper
export const dbPerformance = {
  // Wrap Prisma queries for performance monitoring
  async wrapQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await queryFn();
      const duration = performance.now() - start;
      performanceMonitor.recordDbQuery(queryName, duration, true);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      performanceMonitor.recordDbQuery(
        queryName, 
        duration, 
        false, 
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  },
};

// Memory optimization utilities
export const memory = {
  // Get current memory usage
  getUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  },

  // Get memory usage in MB
  getUsageMB(): {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  } {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100,
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024 * 100) / 100,
    };
  },

  // Force garbage collection (if --expose-gc flag is used)
  forceGC(): void {
    if (global.gc) {
      global.gc();
    }
  },

  // Monitor memory usage
  startMonitoring(intervalMs: number = 30000): NodeJS.Timeout {
    return setInterval(() => {
      const usage = this.getUsageMB();
      performanceMonitor.recordMetric('memory.heapUsed', usage.heapUsed);
      performanceMonitor.recordMetric('memory.rss', usage.rss);
      
      // Log warning if memory usage is high
      if (usage.heapUsed > 500) { // 500MB threshold
        console.warn(`High memory usage detected: ${usage.heapUsed}MB heap used`);
      }
    }, intervalMs);
  },
};

// Response time optimization
export const responseTime = {
  // Add response time header to API responses
  middleware() {
    return (req: any, res: any, next: any) => {
      const start = performance.now();
      
      res.on('finish', () => {
        const duration = performance.now() - start;
        res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
        performanceMonitor.recordMetric('api.responseTime', duration, {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
        });
      });
      
      next();
    };
  },
};

// Image optimization utilities
export const imageOptimization = {
  // Get optimized image URL for Next.js Image component
  getOptimizedUrl(
    src: string,
    width: number,
    quality: number = 75
  ): string {
    if (src.startsWith('http')) {
      // External image - use Next.js image optimization
      return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
    }
    return src; // Local images are handled by Next.js automatically
  },

  // Generate responsive image sizes
  getResponsiveSizes(): string {
    return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
  },

  // Get image dimensions for optimization
  getDimensions(aspectRatio: number, maxWidth: number): { width: number; height: number } {
    return {
      width: maxWidth,
      height: Math.round(maxWidth / aspectRatio),
    };
  },
};

// Bundle size optimization
export const bundleOptimization = {
  // Dynamic import wrapper with error handling
  async dynamicImport<T>(importFn: () => Promise<T>): Promise<T> {
    try {
      return await importFn();
    } catch (error) {
      console.error('Dynamic import failed:', error);
      throw error;
    }
  },

  // Lazy load component
  lazyComponent<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>
  ): React.LazyExoticComponent<T> {
    const React = require('react');
    return React.lazy(importFn);
  },
};

// API rate limiting
export const rateLimiting = {
  // Simple in-memory rate limiter
  createLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();

    return (identifier: string): boolean => {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Get existing requests for this identifier
      const userRequests = requests.get(identifier) || [];
      
      // Filter out old requests
      const recentRequests = userRequests.filter(time => time > windowStart);
      
      // Check if limit exceeded
      if (recentRequests.length >= maxRequests) {
        return false;
      }

      // Add current request
      recentRequests.push(now);
      requests.set(identifier, recentRequests);

      return true;
    };
  },
};

// Export performance monitor and utilities
export { performanceMonitor };
export default {
  timing,
  dbPerformance,
  memory,
  responseTime,
  imageOptimization,
  bundleOptimization,
  rateLimiting,
  monitor: performanceMonitor,
};