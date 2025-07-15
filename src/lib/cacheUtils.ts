import { menuCache, getCacheKey } from "./cache";
import type { LangType } from "@/types/menu";

/**
 * Cache invalidation utilities for menu data
 */
export const invalidateCache = {
  /**
   * Invalidate all menu data for a specific language
   */
  menuData: (lang: LangType) => {
    menuCache.delete(getCacheKey.menuData(lang));
    console.log(`Invalidated menu data cache for ${lang}`);
  },

  /**
   * Invalidate all menu data for all languages
   */
  allMenuData: () => {
    const languages: LangType[] = ['es', 'en', 'de'];
    languages.forEach(lang => {
      menuCache.delete(getCacheKey.menuData(lang));
    });
    console.log('Invalidated all menu data cache');
  },

  /**
   * Clear entire cache
   */
  all: () => {
    menuCache.clear();
    console.log('Cleared entire menu cache');
  }
};

/**
 * Cache warming utilities
 */
export const warmCache = {
  /**
   * Pre-load menu data for all languages
   */
  allLanguages: async () => {
    const languages: LangType[] = ['es', 'en', 'de'];
    const { getMenuData } = await import('./getMenuData');
    
    try {
      await Promise.all(
        languages.map(lang => getMenuData(lang))
      );
      console.log('Cache warmed for all languages');
    } catch (error) {
      console.error('Error warming cache:', error);
    }
  }
};

/**
 * Cache monitoring utilities
 */
export const cacheMonitor = {
  /**
   * Get cache statistics
   */
  getStats: () => {
    return menuCache.getStats();
  },

  /**
   * Check if cache is healthy (not too large, reasonable hit rate)
   */
  isHealthy: () => {
    const stats = menuCache.getStats();
    return {
      size: stats.size,
      isWithinLimits: stats.size < 100, // Reasonable limit for menu cache
      keys: stats.keys
    };
  }
};

/**
 * Development utilities for cache debugging
 */
export const cacheDebug = {
  /**
   * Log current cache state
   */
  logState: () => {
    const stats = menuCache.getStats();
    console.log('Cache State:', {
      size: stats.size,
      keys: stats.keys
    });
  },

  /**
   * Force cache miss for testing
   */
  forceMiss: (lang: LangType) => {
    invalidateCache.menuData(lang);
    console.log(`Forced cache miss for ${lang}`);
  }
};