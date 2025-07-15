import { describe, it, expect, beforeEach, vi } from 'vitest';
import { menuCache, CACHE_CONFIG, getCacheKey } from '../cache';
import { invalidateCache, warmCache, cacheMonitor } from '../cacheUtils';

describe('Menu Cache System', () => {
  beforeEach(() => {
    menuCache.clear();
    vi.clearAllMocks();
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve data', () => {
      const testData = { test: 'data' };
      const key = 'test_key';
      const ttl = 1000;

      menuCache.set(key, testData, ttl);
      const retrieved = menuCache.get(key);

      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = menuCache.get('non_existent_key');
      expect(result).toBeNull();
    });

    it('should expire data after TTL', async () => {
      const testData = { test: 'data' };
      const key = 'test_key';
      const ttl = 10; // 10ms

      menuCache.set(key, testData, ttl);
      
      // Should exist immediately
      expect(menuCache.get(key)).toEqual(testData);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Should be expired
      expect(menuCache.get(key)).toBeNull();
    });

    it('should delete specific entries', () => {
      menuCache.set('key1', 'data1', 1000);
      menuCache.set('key2', 'data2', 1000);

      menuCache.delete('key1');

      expect(menuCache.get('key1')).toBeNull();
      expect(menuCache.get('key2')).toBe('data2');
    });

    it('should clear all entries', () => {
      menuCache.set('key1', 'data1', 1000);
      menuCache.set('key2', 'data2', 1000);

      menuCache.clear();

      expect(menuCache.get('key1')).toBeNull();
      expect(menuCache.get('key2')).toBeNull();
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate unique keys for different languages', () => {
      const esKey = getCacheKey.menuData('es');
      const enKey = getCacheKey.menuData('en');
      const deKey = getCacheKey.menuData('de');

      expect(esKey).toBe('menu_data_es');
      expect(enKey).toBe('menu_data_en');
      expect(deKey).toBe('menu_data_de');
      expect(esKey).not.toBe(enKey);
      expect(enKey).not.toBe(deKey);
    });
  });

  describe('Cache Utilities', () => {
    it('should invalidate cache for specific language', () => {
      const key = getCacheKey.menuData('es');
      menuCache.set(key, { test: 'data' }, 1000);

      expect(menuCache.get(key)).toBeTruthy();
      
      invalidateCache.menuData('es');
      
      expect(menuCache.get(key)).toBeNull();
    });

    it('should provide cache statistics', () => {
      menuCache.set('key1', 'data1', 1000);
      menuCache.set('key2', 'data2', 1000);

      const stats = cacheMonitor.getStats();

      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });

    it('should report cache health', () => {
      const health = cacheMonitor.isHealthy();

      expect(health).toHaveProperty('size');
      expect(health).toHaveProperty('isWithinLimits');
      expect(health).toHaveProperty('keys');
      expect(typeof health.isWithinLimits).toBe('boolean');
    });
  });

  describe('Cache Configuration', () => {
    it('should have reasonable TTL values', () => {
      expect(CACHE_CONFIG.MENU_DATA_TTL).toBe(5 * 60 * 1000); // 5 minutes
      expect(CACHE_CONFIG.CATEGORIES_TTL).toBe(10 * 60 * 1000); // 10 minutes
      expect(CACHE_CONFIG.DISHES_TTL).toBe(5 * 60 * 1000); // 5 minutes
      expect(CACHE_CONFIG.MENU_OF_THE_DAY_TTL).toBe(2 * 60 * 1000); // 2 minutes
      expect(CACHE_CONFIG.WEEK_MENU_TTL).toBe(30 * 60 * 1000); // 30 minutes
    });
  });

  describe('Advanced Cache Operations', () => {
    it('should handle concurrent access', () => {
      const key = 'concurrent_test';
      const data1 = { value: 1 };
      const data2 = { value: 2 };

      menuCache.set(key, data1, 1000);
      menuCache.set(key, data2, 1000); // Overwrite

      expect(menuCache.get(key)).toEqual(data2);
    });

    it('should handle large data objects', () => {
      const largeData = {
        categories: Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Category ${i}` })),
        dishes: Array.from({ length: 500 }, (_, i) => ({ id: i, name: `Dish ${i}`, price: i * 1.5 }))
      };

      menuCache.set('large_data', largeData, 1000);
      const retrieved = menuCache.get('large_data');

      expect(retrieved).toEqual(largeData);
      expect(retrieved.categories).toHaveLength(100);
      expect(retrieved.dishes).toHaveLength(500);
    });

    it('should cleanup expired entries', async () => {
      menuCache.set('short_lived', 'data1', 10);
      menuCache.set('long_lived', 'data2', 1000);

      await new Promise(resolve => setTimeout(resolve, 20));
      
      menuCache.cleanup();

      expect(menuCache.get('short_lived')).toBeNull();
      expect(menuCache.get('long_lived')).toBe('data2');
    });

    it('should provide accurate statistics', () => {
      menuCache.set('key1', 'data1', 1000);
      menuCache.set('key2', 'data2', 1000);
      menuCache.set('key3', 'data3', 1000);

      const stats = menuCache.getStats();

      expect(stats.size).toBe(3);
      expect(stats.keys).toEqual(['key1', 'key2', 'key3']);
    });
  });

  describe('Cache Utilities Integration', () => {
    it('should invalidate all menu data', () => {
      menuCache.set(getCacheKey.menuData('es'), 'es_data', 1000);
      menuCache.set(getCacheKey.menuData('en'), 'en_data', 1000);
      menuCache.set(getCacheKey.menuData('de'), 'de_data', 1000);

      invalidateCache.allMenuData();

      expect(menuCache.get(getCacheKey.menuData('es'))).toBeNull();
      expect(menuCache.get(getCacheKey.menuData('en'))).toBeNull();
      expect(menuCache.get(getCacheKey.menuData('de'))).toBeNull();
    });

    it('should clear entire cache', () => {
      menuCache.set('key1', 'data1', 1000);
      menuCache.set('key2', 'data2', 1000);

      invalidateCache.all();

      expect(menuCache.get('key1')).toBeNull();
      expect(menuCache.get('key2')).toBeNull();
    });

    it('should report unhealthy cache when too large', () => {
      // Add many entries to exceed healthy limit
      for (let i = 0; i < 150; i++) {
        menuCache.set(`key_${i}`, `data_${i}`, 1000);
      }

      const health = cacheMonitor.isHealthy();
      expect(health.isWithinLimits).toBe(false);
      expect(health.size).toBeGreaterThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values', () => {
      menuCache.set('null_key', null, 1000);
      menuCache.set('undefined_key', undefined, 1000);

      expect(menuCache.get('null_key')).toBeNull();
      expect(menuCache.get('undefined_key')).toBeUndefined();
    });

    it('should handle zero TTL', () => {
      menuCache.set('zero_ttl', 'data', 0);
      
      // Should expire immediately
      expect(menuCache.get('zero_ttl')).toBeNull();
    });

    it('should handle negative TTL', () => {
      menuCache.set('negative_ttl', 'data', -1000);
      
      // Should expire immediately
      expect(menuCache.get('negative_ttl')).toBeNull();
    });

    it('should handle empty string keys', () => {
      menuCache.set('', 'empty_key_data', 1000);
      expect(menuCache.get('')).toBe('empty_key_data');
    });

    it('should handle special characters in keys', () => {
      const specialKey = 'key-with_special.chars@123';
      menuCache.set(specialKey, 'special_data', 1000);
      expect(menuCache.get(specialKey)).toBe('special_data');
    });
  });
});