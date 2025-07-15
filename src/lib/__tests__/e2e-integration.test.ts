import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMenuData } from '../getMenuData';
import { menuCache, getCacheKey, CACHE_CONFIG } from '../cache';
import { invalidateCache, warmCache, cacheMonitor } from '../cacheUtils';
import { performanceMonitor } from '../performanceMonitor';
import { errorHandler } from '../errorHandler';

// Mock only external dependencies, not our internal modules
vi.mock('../optimizedQueries', () => ({
  getCategoriesOptimized: vi.fn(),
  getDishesOptimized: vi.fn(),
  queryPerformanceMonitor: {
    measureQuery: vi.fn((name, fn) => fn())
  }
}));

describe('End-to-End Integration Tests', () => {
  const mockCompleteMenuData = {
    categories: [
      { id: 1, name: 'Entrantes', icon: 'appetizers' },
      { id: 2, name: 'Principales', icon: 'mains' },
      { id: 3, name: 'Postres', icon: 'desserts' },
      { id: 4, name: 'Bebidas', icon: 'drinks' },
      { id: 5, name: 'Lunes', icon: 'monday' },
      { id: 6, name: 'Martes', icon: 'tuesday' },
      { id: 7, name: 'Miércoles', icon: 'wednesday' }
    ],
    dishes: [
      { id: 1, name: 'Ensalada César', price: 8.50, image: '/ensalada.jpg', categories: [1], allergens: [1] },
      { id: 2, name: 'Paella Valenciana', price: 15.00, image: '/paella.jpg', categories: [2], allergens: [] },
      { id: 3, name: 'Tiramisú', price: 6.00, image: '/tiramisu.jpg', categories: [3], allergens: [2, 3] },
      { id: 4, name: 'Agua Mineral', price: 2.00, image: '/agua.jpg', categories: [4], allergens: [] },
      { id: 5, name: 'Menú Lunes', price: 12.00, image: '/menu-lunes.jpg', categories: [5], allergens: [] },
      { id: 6, name: 'Menú Martes', price: 11.50, image: '/menu-martes.jpg', categories: [6], allergens: [1] },
      { id: 7, name: 'Menú Miércoles', price: 13.00, image: '/menu-miercoles.jpg', categories: [7], allergens: [] }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    menuCache.clear();
    performanceMonitor.clear();
    
    // Setup default successful mocks
    const { getCategoriesOptimized, getDishesOptimized } = require('../optimizedQueries');
    vi.mocked(getCategoriesOptimized).mockResolvedValue(mockCompleteMenuData.categories);
    vi.mocked(getDishesOptimized).mockResolvedValue(mockCompleteMenuData.dishes);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Complete Menu Data Flow', () => {
    it('should provide complete menu experience for Spanish users', async () => {
      // Mock Monday
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01')); // Monday

      const result = await getMenuData('es');

      // Verify complete data structure
      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('dishes');
      expect(result).toHaveProperty('menuOfTheDay');
      expect(result).toHaveProperty('weekMenu');

      // Verify categories are complete
      expect(result.categories).toHaveLength(7);
      expect(result.categories.map(c => c.name)).toContain('Entrantes');
      expect(result.categories.map(c => c.name)).toContain('Lunes');

      // Verify regular dishes exclude daily specials
      expect(result.dishes).toHaveLength(4); // Only non-daily dishes
      expect(result.dishes.map(d => d.name)).toContain('Ensalada César');
      expect(result.dishes.map(d => d.name)).toContain('Paella Valenciana');
      expect(result.dishes.map(d => d.name)).not.toContain('Menú Lunes');

      // Verify today's menu (Monday)
      expect(result.menuOfTheDay).toHaveLength(1);
      expect(result.menuOfTheDay[0].name).toBe('Menú Lunes');

      // Verify weekly menu structure
      expect(result.weekMenu).toHaveProperty('Lunes');
      expect(result.weekMenu).toHaveProperty('Martes');
      expect(result.weekMenu).toHaveProperty('Miércoles');
      expect(result.weekMenu['Lunes']).toEqual(['Menú Lunes']);
      expect(result.weekMenu['Martes']).toEqual(['Menú Martes']);
      expect(result.weekMenu['Miércoles']).toEqual(['Menú Miércoles']);
    });

    it('should handle different days of the week correctly', async () => {
      vi.useFakeTimers();

      // Test Tuesday
      vi.setSystemTime(new Date('2024-01-02')); // Tuesday
      const tuesdayResult = await getMenuData('es');
      
      expect(tuesdayResult.menuOfTheDay).toHaveLength(1);
      expect(tuesdayResult.menuOfTheDay[0].name).toBe('Menú Martes');

      // Test Wednesday
      vi.setSystemTime(new Date('2024-01-03')); // Wednesday
      const wednesdayResult = await getMenuData('es');
      
      expect(wednesdayResult.menuOfTheDay).toHaveLength(1);
      expect(wednesdayResult.menuOfTheDay[0].name).toBe('Menú Miércoles');

      // Test Sunday (no special menu)
      vi.setSystemTime(new Date('2024-01-07')); // Sunday
      const sundayResult = await getMenuData('es');
      
      expect(sundayResult.menuOfTheDay).toHaveLength(0);
    });

    it('should support all languages with correct translations', async () => {
      const languages = [
        { code: 'es', days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] },
        { code: 'en', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        { code: 'de', days: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'] }
      ] as const;

      for (const { code, days } of languages) {
        const result = await getMenuData(code);
        
        // Verify week menu has correct day names
        const weekMenuKeys = Object.keys(result.weekMenu);
        expect(weekMenuKeys).toEqual(days);
        
        // Verify structure is consistent across languages
        expect(result.categories).toHaveLength(7);
        expect(result.dishes).toHaveLength(4);
      }
    });
  });

  describe('Performance Requirements Validation', () => {
    it('should meet 2-second page load requirement (Requirement 1.1)', async () => {
      const startTime = Date.now();
      
      // Simulate multiple data fetches that would happen on page load
      const [menuData1, menuData2, menuData3] = await Promise.all([
        getMenuData('es'),
        getMenuData('en'),
        getMenuData('de')
      ]);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 2 seconds even with multiple language requests
      expect(duration).toBeLessThan(2000);
      
      // All requests should succeed
      expect(menuData1.categories).toBeDefined();
      expect(menuData2.categories).toBeDefined();
      expect(menuData3.categories).toBeDefined();
    });

    it('should execute maximum 2 database queries per language (Requirement 2.1)', async () => {
      const { getCategoriesOptimized, getDishesOptimized } = require('../optimizedQueries');
      
      await getMenuData('es');
      
      // Should only call the two optimized query functions
      expect(getCategoriesOptimized).toHaveBeenCalledTimes(1);
      expect(getDishesOptimized).toHaveBeenCalledTimes(1);
      expect(getCategoriesOptimized).toHaveBeenCalledWith('es');
      expect(getDishesOptimized).toHaveBeenCalledWith('es');
    });

    it('should eliminate redundant queries (Requirement 2.2)', async () => {
      const { getCategoriesOptimized, getDishesOptimized } = require('../optimizedQueries');
      
      // Multiple calls should use cache after first call
      await getMenuData('es');
      await getMenuData('es');
      await getMenuData('es');
      
      // Database queries should only happen once due to caching
      expect(getCategoriesOptimized).toHaveBeenCalledTimes(1);
      expect(getDishesOptimized).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache System Integration', () => {
    it('should implement complete caching lifecycle (Requirement 5.1, 5.2, 5.3)', async () => {
      // Initial state - no cache
      expect(menuCache.get(getCacheKey.menuData('es'))).toBeNull();
      
      // First call - should populate cache
      const result1 = await getMenuData('es');
      expect(result1.categories).toBeDefined();
      
      // Cache should now contain data
      const cachedData = menuCache.get(getCacheKey.menuData('es'));
      expect(cachedData).toBeTruthy();
      expect(cachedData).toEqual(result1);
      
      // Second call - should use cache
      const { getCategoriesOptimized, getDishesOptimized } = require('../optimizedQueries');
      vi.clearAllMocks(); // Clear previous calls
      
      const result2 = await getMenuData('es');
      expect(result2).toEqual(result1);
      
      // Should not have made new database calls
      expect(getCategoriesOptimized).not.toHaveBeenCalled();
      expect(getDishesOptimized).not.toHaveBeenCalled();
      
      // Cache invalidation
      invalidateCache.menuData('es');
      expect(menuCache.get(getCacheKey.menuData('es'))).toBeNull();
    });

    it('should handle cache warming for all languages', async () => {
      // Warm cache for all languages
      await warmCache.allLanguages();
      
      // All languages should be cached
      expect(menuCache.get(getCacheKey.menuData('es'))).toBeTruthy();
      expect(menuCache.get(getCacheKey.menuData('en'))).toBeTruthy();
      expect(menuCache.get(getCacheKey.menuData('de'))).toBeTruthy();
      
      // Cache statistics should reflect this
      const stats = cacheMonitor.getStats();
      expect(stats.size).toBe(3);
    });

    it('should respect TTL configuration', async () => {
      // Set very short TTL for testing
      const shortTTL = 10; // 10ms
      
      await getMenuData('es');
      
      // Manually set short TTL
      const cacheKey = getCacheKey.menuData('es');
      const data = menuCache.get(cacheKey);
      menuCache.set(cacheKey, data, shortTTL);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Should be expired
      expect(menuCache.get(cacheKey)).toBeNull();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should provide graceful degradation on database errors', async () => {
      const { getCategoriesOptimized, getDishesOptimized } = require('../optimizedQueries');
      
      // Mock database failure
      vi.mocked(getCategoriesOptimized).mockRejectedValue(new Error('Database connection failed'));
      vi.mocked(getDishesOptimized).mockRejectedValue(new Error('Database connection failed'));
      
      const result = await getMenuData('es');
      
      // Should return fallback data structure
      expect(result).toEqual({
        categories: [],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      });
      
      // Should not throw error
      expect(result).toBeDefined();
    });

    it('should handle partial failures gracefully', async () => {
      const { getCategoriesOptimized, getDishesOptimized } = require('../optimizedQueries');
      
      // Categories succeed, dishes fail
      vi.mocked(getCategoriesOptimized).mockResolvedValue(mockCompleteMenuData.categories);
      vi.mocked(getDishesOptimized).mockRejectedValue(new Error('Dishes query failed'));
      
      const result = await getMenuData('es');
      
      // Should still return fallback structure (all or nothing approach for consistency)
      expect(result).toEqual({
        categories: [],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      });
    });

    it('should recover from transient errors', async () => {
      const { getCategoriesOptimized, getDishesOptimized } = require('../optimizedQueries');
      
      // First call fails
      vi.mocked(getCategoriesOptimized).mockRejectedValueOnce(new Error('Transient error'));
      vi.mocked(getDishesOptimized).mockRejectedValueOnce(new Error('Transient error'));
      
      const result1 = await getMenuData('es');
      expect(result1.categories).toHaveLength(0);
      
      // Second call succeeds
      vi.mocked(getCategoriesOptimized).mockResolvedValue(mockCompleteMenuData.categories);
      vi.mocked(getDishesOptimized).mockResolvedValue(mockCompleteMenuData.dishes);
      
      const result2 = await getMenuData('es');
      expect(result2.categories).toHaveLength(7);
      expect(result2.dishes).toHaveLength(4);
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain data consistency across all operations', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01')); // Monday
      
      const result = await getMenuData('es');
      
      // Verify data relationships are consistent
      const allDishIds = [
        ...result.dishes.map(d => d.id),
        ...result.menuOfTheDay.map(d => d.id)
      ];
      
      // No duplicate dishes between regular and daily menus
      const uniqueIds = new Set(allDishIds);
      expect(uniqueIds.size).toBe(allDishIds.length);
      
      // Weekly menu should contain names that exist in the original dataset
      const allDishNames = mockCompleteMenuData.dishes.map(d => d.name);
      Object.values(result.weekMenu).flat().forEach(dishName => {
        expect(allDishNames).toContain(dishName);
      });
      
      // Categories should be properly filtered
      const regularCategoryIds = result.dishes.flatMap(d => d.categories);
      const dayCategoryIds = [5, 6, 7]; // Lunes, Martes, Miércoles
      
      // Regular dishes should not have day category IDs
      regularCategoryIds.forEach(catId => {
        expect(dayCategoryIds).not.toContain(catId);
      });
    });

    it('should handle edge cases in data processing', async () => {
      const { getCategoriesOptimized, getDishesOptimized } = require('../optimizedQueries');
      
      // Test with minimal data
      vi.mocked(getCategoriesOptimized).mockResolvedValue([
        { id: 1, name: 'Only Category', icon: 'only' }
      ]);
      vi.mocked(getDishesOptimized).mockResolvedValue([
        { id: 1, name: 'Only Dish', price: 10, image: '', categories: [1], allergens: [] }
      ]);
      
      const result = await getMenuData('es');
      
      expect(result.categories).toHaveLength(1);
      expect(result.dishes).toHaveLength(1);
      expect(result.menuOfTheDay).toHaveLength(0); // No daily categories
      expect(Object.values(result.weekMenu).every(day => day.length === 0)).toBe(true);
    });
  });

  describe('Concurrent Usage Scenarios', () => {
    it('should handle high concurrent load', async () => {
      const concurrentRequests = 50;
      const languages = ['es', 'en', 'de'];
      
      // Generate concurrent requests across different languages
      const promises = Array.from({ length: concurrentRequests }, (_, i) => {
        const lang = languages[i % languages.length];
        return getMenuData(lang as any);
      });
      
      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // All requests should succeed
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result).toHaveProperty('categories');
        expect(result).toHaveProperty('dishes');
        expect(result).toHaveProperty('menuOfTheDay');
        expect(result).toHaveProperty('weekMenu');
      });
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds for 50 concurrent requests
    });

    it('should maintain cache consistency under concurrent access', async () => {
      // Concurrent requests for same language should all get consistent data
      const promises = Array.from({ length: 20 }, () => getMenuData('es'));
      const results = await Promise.all(promises);
      
      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result).toEqual(firstResult);
      });
      
      // Should have efficient cache usage (minimal database calls)
      const { getCategoriesOptimized, getDishesOptimized } = require('../optimizedQueries');
      expect(getCategoriesOptimized).toHaveBeenCalledTimes(1);
      expect(getDishesOptimized).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track comprehensive performance metrics', async () => {
      performanceMonitor.clear();
      
      await getMenuData('es');
      await getMenuData('en');
      
      const stats = performanceMonitor.getStats();
      
      // Should have recorded metrics for both calls
      expect(stats.totalMeasurements).toBeGreaterThan(0);
      expect(stats.averageDuration).toBeGreaterThan(0);
      
      // Should track different operations
      expect(stats.totalMeasurements).toBeGreaterThanOrEqual(2);
    });

    it('should provide actionable performance insights', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await getMenuData('es');
      
      // Should log cache operations
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cache miss for menu data (es)')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Menu data cached for es')
      );
      
      consoleSpy.mockRestore();
    });
  });
});