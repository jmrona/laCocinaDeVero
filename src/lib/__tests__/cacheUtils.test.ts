import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invalidateCache, warmCache, cacheMonitor, cacheDebug } from '../cacheUtils';
import { menuCache, getCacheKey } from '../cache';

// Mock getMenuData to avoid circular dependency
vi.mock('../getMenuData', () => ({
  getMenuData: vi.fn()
}));

describe('Cache Utils', () => {
  beforeEach(() => {
    menuCache.clear();
    vi.clearAllMocks();
  });

  describe('Cache Invalidation', () => {
    it('should invalidate menu data for specific language', () => {
      const key = getCacheKey.menuData('es');
      menuCache.set(key, { test: 'data' }, 1000);

      expect(menuCache.get(key)).toBeTruthy();
      
      invalidateCache.menuData('es');
      
      expect(menuCache.get(key)).toBeNull();
    });

    it('should invalidate all menu data for all languages', () => {
      const esKey = getCacheKey.menuData('es');
      const enKey = getCacheKey.menuData('en');
      const deKey = getCacheKey.menuData('de');

      menuCache.set(esKey, { lang: 'es' }, 1000);
      menuCache.set(enKey, { lang: 'en' }, 1000);
      menuCache.set(deKey, { lang: 'de' }, 1000);

      invalidateCache.allMenuData();

      expect(menuCache.get(esKey)).toBeNull();
      expect(menuCache.get(enKey)).toBeNull();
      expect(menuCache.get(deKey)).toBeNull();
    });

    it('should clear entire cache', () => {
      menuCache.set('key1', 'data1', 1000);
      menuCache.set('key2', 'data2', 1000);
      menuCache.set('key3', 'data3', 1000);

      invalidateCache.all();

      expect(menuCache.get('key1')).toBeNull();
      expect(menuCache.get('key2')).toBeNull();
      expect(menuCache.get('key3')).toBeNull();
    });

    it('should log invalidation actions', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      invalidateCache.menuData('es');
      
      expect(consoleSpy).toHaveBeenCalledWith('Invalidated menu data cache for es');
      consoleSpy.mockRestore();
    });
  });

  describe('Cache Warming', () => {
    it('should warm cache for all languages', async () => {
      const { getMenuData } = await import('../getMenuData');
      const mockGetMenuData = vi.mocked(getMenuData);
      
      mockGetMenuData.mockResolvedValue({
        categories: [],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      });

      await warmCache.allLanguages();

      expect(mockGetMenuData).toHaveBeenCalledWith('es');
      expect(mockGetMenuData).toHaveBeenCalledWith('en');
      expect(mockGetMenuData).toHaveBeenCalledWith('de');
      expect(mockGetMenuData).toHaveBeenCalledTimes(3);
    });

    it('should handle errors during cache warming', async () => {
      const { getMenuData } = await import('../getMenuData');
      const mockGetMenuData = vi.mocked(getMenuData);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockGetMenuData.mockRejectedValue(new Error('Warming failed'));

      await warmCache.allLanguages();

      expect(consoleSpy).toHaveBeenCalledWith('Error warming cache:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should log successful cache warming', async () => {
      const { getMenuData } = await import('../getMenuData');
      const mockGetMenuData = vi.mocked(getMenuData);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      mockGetMenuData.mockResolvedValue({
        categories: [],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      });

      await warmCache.allLanguages();

      expect(consoleSpy).toHaveBeenCalledWith('Cache warmed for all languages');
      consoleSpy.mockRestore();
    });
  });

  describe('Cache Monitoring', () => {
    it('should provide accurate cache statistics', () => {
      menuCache.set('key1', 'data1', 1000);
      menuCache.set('key2', 'data2', 1000);
      menuCache.set('key3', 'data3', 1000);

      const stats = cacheMonitor.getStats();

      expect(stats.size).toBe(3);
      expect(stats.keys).toEqual(['key1', 'key2', 'key3']);
    });

    it('should report healthy cache when within limits', () => {
      menuCache.set('key1', 'data1', 1000);
      menuCache.set('key2', 'data2', 1000);

      const health = cacheMonitor.isHealthy();

      expect(health.size).toBe(2);
      expect(health.isWithinLimits).toBe(true);
      expect(health.keys).toEqual(['key1', 'key2']);
    });

    it('should report unhealthy cache when exceeding limits', () => {
      // Add entries to exceed the healthy limit (100)
      for (let i = 0; i < 150; i++) {
        menuCache.set(`key_${i}`, `data_${i}`, 1000);
      }

      const health = cacheMonitor.isHealthy();

      expect(health.size).toBe(150);
      expect(health.isWithinLimits).toBe(false);
      expect(health.keys).toHaveLength(150);
    });

    it('should handle empty cache monitoring', () => {
      const stats = cacheMonitor.getStats();
      const health = cacheMonitor.isHealthy();

      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
      expect(health.size).toBe(0);
      expect(health.isWithinLimits).toBe(true);
    });
  });

  describe('Cache Debugging', () => {
    it('should log current cache state', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      menuCache.set('debug_key1', 'debug_data1', 1000);
      menuCache.set('debug_key2', 'debug_data2', 1000);

      cacheDebug.logState();

      expect(consoleSpy).toHaveBeenCalledWith('Cache State:', {
        size: 2,
        keys: ['debug_key1', 'debug_key2']
      });
      
      consoleSpy.mockRestore();
    });

    it('should force cache miss for testing', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const key = getCacheKey.menuData('es');
      
      menuCache.set(key, { test: 'data' }, 1000);
      expect(menuCache.get(key)).toBeTruthy();

      cacheDebug.forceMiss('es');

      expect(menuCache.get(key)).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Forced cache miss for es');
      
      consoleSpy.mockRestore();
    });

    it('should handle debugging empty cache', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      cacheDebug.logState();

      expect(consoleSpy).toHaveBeenCalledWith('Cache State:', {
        size: 0,
        keys: []
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('should work with multiple cache operations', () => {
      // Set up initial cache state
      menuCache.set(getCacheKey.menuData('es'), { lang: 'es', data: 'test' }, 1000);
      menuCache.set(getCacheKey.menuData('en'), { lang: 'en', data: 'test' }, 1000);
      menuCache.set('other_key', 'other_data', 1000);

      // Check initial state
      let stats = cacheMonitor.getStats();
      expect(stats.size).toBe(3);

      // Invalidate specific language
      invalidateCache.menuData('es');
      
      stats = cacheMonitor.getStats();
      expect(stats.size).toBe(2);
      expect(menuCache.get(getCacheKey.menuData('es'))).toBeNull();
      expect(menuCache.get(getCacheKey.menuData('en'))).toBeTruthy();

      // Clear all
      invalidateCache.all();
      
      stats = cacheMonitor.getStats();
      expect(stats.size).toBe(0);
    });

    it('should maintain cache health monitoring during operations', () => {
      // Start with healthy cache
      menuCache.set('key1', 'data1', 1000);
      expect(cacheMonitor.isHealthy().isWithinLimits).toBe(true);

      // Add many entries to make it unhealthy
      for (let i = 0; i < 150; i++) {
        menuCache.set(`bulk_key_${i}`, `bulk_data_${i}`, 1000);
      }
      expect(cacheMonitor.isHealthy().isWithinLimits).toBe(false);

      // Clear cache to make it healthy again
      invalidateCache.all();
      expect(cacheMonitor.isHealthy().isWithinLimits).toBe(true);
    });

    it('should handle rapid invalidation and warming cycles', async () => {
      const { getMenuData } = await import('../getMenuData');
      const mockGetMenuData = vi.mocked(getMenuData);
      
      mockGetMenuData.mockResolvedValue({
        categories: [],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      });

      // Rapid cycles
      for (let i = 0; i < 5; i++) {
        await warmCache.allLanguages();
        invalidateCache.allMenuData();
      }

      // Should still work correctly
      const stats = cacheMonitor.getStats();
      expect(stats.size).toBe(0); // All invalidated at the end
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid language codes gracefully', () => {
      expect(() => {
        // @ts-ignore - Testing invalid input
        invalidateCache.menuData('invalid');
      }).not.toThrow();
    });

    it('should handle cache operations on non-existent keys', () => {
      expect(() => {
        invalidateCache.menuData('es'); // No data to invalidate
      }).not.toThrow();

      expect(() => {
        cacheDebug.forceMiss('en'); // No data to force miss
      }).not.toThrow();
    });

    it('should handle concurrent invalidation operations', () => {
      menuCache.set(getCacheKey.menuData('es'), 'data', 1000);

      // Concurrent invalidations
      expect(() => {
        invalidateCache.menuData('es');
        invalidateCache.menuData('es'); // Second call on already invalidated
        invalidateCache.allMenuData();
      }).not.toThrow();
    });
  });
});