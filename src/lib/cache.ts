interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired, remove it
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached data with TTL (time to live) in milliseconds
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Remove specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries from cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create singleton cache instance
export const menuCache = new MemoryCache();

// Cache configuration constants
export const CACHE_CONFIG = {
  MENU_DATA_TTL: 5 * 60 * 1000, // 5 minutes
  CATEGORIES_TTL: 10 * 60 * 1000, // 10 minutes (categories change less frequently)
  DISHES_TTL: 5 * 60 * 1000, // 5 minutes
  MENU_OF_THE_DAY_TTL: 2 * 60 * 1000, // 2 minutes (changes more frequently)
  WEEK_MENU_TTL: 30 * 60 * 1000 // 30 minutes (weekly menu is more stable)
};

// Cache key generators
export const getCacheKey = {
  menuData: (lang: string) => `menu_data_${lang}`,
  categories: (lang: string) => `categories_${lang}`,
  dishes: (lang: string) => `dishes_${lang}`,
  menuOfTheDay: (lang: string) => `menu_of_the_day_${lang}`,
  weekMenu: (lang: string) => `week_menu_${lang}`
};

// Cleanup expired cache entries every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    menuCache.cleanup();
  }, 10 * 60 * 1000);
}