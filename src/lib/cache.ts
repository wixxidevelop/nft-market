// Simple in-memory cache implementation
// In production, consider using Redis or similar for distributed caching

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired items every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    };
    this.cache.set(key, item);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Global cache instance
const cache = new MemoryCache();

// Cache key generators
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userNfts: (userId: string) => `user:${userId}:nfts`,
  userTransactions: (userId: string) => `user:${userId}:transactions`,
  userBalance: (userId: string) => `user:${userId}:balance`,
  nft: (nftId: string) => `nft:${nftId}`,
  collection: (collectionId: string) => `collection:${collectionId}`,
  auction: (auctionId: string) => `auction:${auctionId}`,
  featuredNfts: () => 'featured:nfts',
  popularCollections: () => 'popular:collections',
  recentTransactions: () => 'recent:transactions',
  systemStats: () => 'system:stats',
  adminDashboard: () => 'admin:dashboard',
  userStats: (userId: string) => `user:${userId}:stats`,
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 900,        // 15 minutes
  HOUR: 3600,       // 1 hour
  DAY: 86400,       // 24 hours
};

// Caching utility functions
export const cacheUtils = {
  // Get data from cache or execute function and cache result
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = CacheTTL.MEDIUM
  ): Promise<T> {
    // Try to get from cache first
    const cached = cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, fetch data
    const data = await fetchFn();
    
    // Cache the result
    cache.set(key, data, ttlSeconds);
    
    return data;
  },

  // Get data from cache
  get<T>(key: string): T | null {
    return cache.get<T>(key);
  },

  // Set data in cache
  set<T>(key: string, data: T, ttlSeconds: number = CacheTTL.MEDIUM): void {
    cache.set(key, data, ttlSeconds);
  },

  // Delete from cache
  delete(key: string): boolean {
    return cache.delete(key);
  },

  // Clear all cache
  clear(): void {
    cache.clear();
  },

  // Check if key exists in cache
  has(key: string): boolean {
    return cache.has(key);
  },

  // Get cache size
  size(): number {
    return cache.size();
  },

  // Invalidate user-related cache
  invalidateUser(userId: string): void {
    const userKeys = [
      CacheKeys.user(userId),
      CacheKeys.userNfts(userId),
      CacheKeys.userTransactions(userId),
      CacheKeys.userBalance(userId),
      CacheKeys.userStats(userId),
    ];

    userKeys.forEach(key => cache.delete(key));
  },

  // Invalidate NFT-related cache
  invalidateNft(nftId: string): void {
    cache.delete(CacheKeys.nft(nftId));
    // Also invalidate featured NFTs as it might include this NFT
    cache.delete(CacheKeys.featuredNfts());
  },

  // Invalidate collection-related cache
  invalidateCollection(collectionId: string): void {
    cache.delete(CacheKeys.collection(collectionId));
    cache.delete(CacheKeys.popularCollections());
  },

  // Invalidate system-wide cache
  invalidateSystem(): void {
    cache.delete(CacheKeys.systemStats());
    cache.delete(CacheKeys.adminDashboard());
    cache.delete(CacheKeys.recentTransactions());
  },
};

// Cache middleware for API routes
export function withCache<T>(
  key: string,
  ttlSeconds: number = CacheTTL.MEDIUM
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Try to get from cache first
      const cached = cache.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // If not in cache, execute original method
      const result = await method.apply(this, args);
      
      // Cache the result
      cache.set(key, result, ttlSeconds);
      
      return result;
    };

    return descriptor;
  };
}

// Redis cache implementation (for production)
class RedisCache {
  private client: any;

  constructor() {
    // Initialize Redis client if REDIS_URL is provided
    if (process.env.REDIS_URL) {
      try {
        // Note: You'll need to install redis package
        // const redis = require('redis');
        // this.client = redis.createClient({ url: process.env.REDIS_URL });
        console.log('Redis cache would be initialized here');
      } catch (error) {
        console.warn('Redis not available, falling back to memory cache');
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    
    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    if (!this.client) return;
    
    try {
      await this.client.flushall();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }
}

// Export the cache instance
export default cache;
export { MemoryCache, RedisCache };