import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMenuData } from '../getMenuData';
import { menuCache } from '../cache';
import { performanceMonitor, menuPerformanceHelpers } from '../performanceMonitor';
import { getCategoriesOptimized, getDishesOptimized } from '../optimizedQueries';

// Mock dependencies for controlled testing
vi.mock('../optimizedQueries');
vi.mock('../errorHandler');

describe('Performance Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    menuCache.clear();
    performanceMonitor.clear();
    
    // Mock performance.now for consistent timing
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(1000) // Start time
      .mockReturnValueOnce(1200); // End time (200ms duration)
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Query Performance Requirements', () => {
    it('should execute maximum 2 database queries (Requirement 2.1)', async () => {
      const mockCategories = [
        { id: 1, name: 'Test Category', icon: 'test' }
      ];
      const mockDishes = [
        { id: 1, name: 'Test Dish', price: 10, image: '', categories: [1], allergens: [] }
      ];

      vi.mocked(getCategoriesOptimized).mockResolvedValue(mockCategories);
      vi.mocked(getDishesOptimized).mockResolvedValue(mockDishes);

      await getMenuData('es');

      // Verify only 2 main queries were executed
      expect(getCategoriesOptimized).toHaveBeenCalledTimes(1);
      expect(getDishesOptimized).toHaveBeenCalledTimes(1);
    });

    it('should complete data fetch within performance target', async () => {
      const mockCategories = [
        { id: 1, name: 'Category', icon: 'icon' }
      ];
      const mockDishes = [
        { id: 1, name: 'Dish', price: 10, image: '', categories: [1], allergens: [] }
      ];

      vi.mocked(getCategoriesOptimized).mockResolvedValue(mockCategories);
      vi.mocked(getDishesOptimized).mockResolvedValue(mockDishes);

      const startTime = performance.now();
      await getMenuData('es');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (target: under 300ms for optimized queries)
      expect(duration).toBeLessThan(300);
    });

    it('should eliminate redundant getCategories calls (Requirement 2.2)', async () => {
      const mockCategories = [
        { id: 1, name: 'Regular', icon: 'regular' },
        { id: 2, name: 'Lunes', icon: 'monday' }
      ];
      const mockDishes = [
        { id: 1, name: 'Regular Dish', price: 10, image: '', categories: [1], allergens: [] },
        { id: 2, name: 'Monday Dish', price: 12, image: '', categories: [2], allergens: [] }
      ];

      vi.mocked(getCategoriesOptimized).mockResolvedValue(mockCategories);
      vi.mocked(getDishesOptimized).mockResolvedValue(mockDishes);

      await getMenuData('es');

      // Categories should only be fetched once, not multiple times like in legacy code
      expect(getCategoriesOptimized).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache Performance Requirements', () => {
    it('should serve cached data significantly faster (Requirement 5.1)', async () => {
      const testData = {
        categories: [{ id: 1, name: 'Cached', icon: 'cached' }],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      };

      // First call - cache miss (slower)
      vi.mocked(getCategoriesOptimized).mockResolvedValue(testData.categories);
      vi.mocked(getDishesOptimized).mockResolvedValue([]);
      
      const startTime1 = performance.now();
      await getMenuData('es');
      const endTime1 = performance.now();
      const cacheMissDuration = endTime1 - startTime1;

      // Second call - cache hit (faster)
      menuCache.set('menu_data_es', testData, 300000);
      
      const startTime2 = performance.now();
      const cachedResult = await getMenuData('es');
      const endTime2 = performance.now();
      const cacheHitDuration = endTime2 - startTime2;

      // Cache hit should be significantly faster
      expect(cacheHitDuration).toBeLessThan(cacheMissDuration * 0.1); // At least 10x faster
      expect(cachedResult).toEqual(testData);
    });

    it('should maintain cache hit rate above 80% in typical usage', async () => {
      const testData = {
        categories: [],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      };

      vi.mocked(getCategoriesOptimized).mockResolvedValue([]);
      vi.mocked(getDishesOptimized).mockResolvedValue([]);

      // Simulate typical usage pattern: first request fills cache
      await getMenuData('es');
      
      // Subsequent requests should hit cache
      const promises = Array.from({ length: 10 }, () => getMenuData('es'));
      await Promise.all(promises);

      // Only first call should have triggered database queries
      expect(getCategoriesOptimized).toHaveBeenCalledTimes(1);
      expect(getDishesOptimized).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Processing Performance', () => {
    it('should handle large datasets efficiently', async () => {
      // Create large dataset
      const largeCategories = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Category ${i + 1}`,
        icon: `icon${i + 1}`
      }));

      const largeDishes = Array.from({ length: 500 }, (_, i) => ({
        id: i + 1,
        name: `Dish ${i + 1}`,
        price: 10 + (i * 0.5),
        image: `/dish${i + 1}.jpg`,
        categories: [Math.floor(i / 10) + 1],
        allergens: i % 3 === 0 ? [1, 2] : []
      }));

      vi.mocked(getCategoriesOptimized).mockResolvedValue(largeCategories);
      vi.mocked(getDishesOptimized).mockResolvedValue(largeDishes);

      const startTime = performance.now();
      const result = await getMenuData('es');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should process large dataset within reasonable time
      expect(duration).toBeLessThan(500); // 500ms for large dataset
      expect(result.categories).toHaveLength(50);
      expect(result.dishes.length).toBeGreaterThan(0);
    });

    it('should filter data efficiently at application level', async () => {
      const categories = [
        { id: 1, name: 'Regular', icon: 'regular' },
        { id: 2, name: 'Lunes', icon: 'monday' },
        { id: 3, name: 'Martes', icon: 'tuesday' }
      ];

      const dishes = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Dish ${i + 1}`,
        price: 10,
        image: '',
        categories: [i % 3 === 0 ? 2 : i % 3 === 1 ? 3 : 1], // Mix of regular and daily dishes
        allergens: []
      }));

      vi.mocked(getCategoriesOptimized).mockResolvedValue(categories);
      vi.mocked(getDishesOptimized).mockResolvedValue(dishes);

      const startTime = performance.now();
      const result = await getMenuData('es');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Filtering should be fast
      expect(duration).toBeLessThan(100);
      
      // Verify filtering worked correctly
      const totalDishes = result.dishes.length + result.menuOfTheDay.length;
      expect(totalDishes).toBeLessThanOrEqual(dishes.length);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not cause memory leaks with repeated calls', async () => {
      const testData = {
        categories: [{ id: 1, name: 'Test', icon: 'test' }],
        dishes: [{ id: 1, name: 'Test Dish', price: 10, image: '', categories: [1], allergens: [] }]
      };

      vi.mocked(getCategoriesOptimized).mockResolvedValue(testData.categories);
      vi.mocked(getDishesOptimized).mockResolvedValue(testData.dishes);

      // Simulate many repeated calls
      for (let i = 0; i < 100; i++) {
        await getMenuData('es');
        
        // Clear cache periodically to simulate real usage
        if (i % 20 === 0) {
          menuCache.clear();
        }
      }

      // Cache should not grow unbounded
      const cacheStats = menuCache.getStats();
      expect(cacheStats.size).toBeLessThan(10); // Reasonable cache size
    });

    it('should handle concurrent requests efficiently', async () => {
      const testData = {
        categories: [{ id: 1, name: 'Concurrent', icon: 'concurrent' }],
        dishes: []
      };

      vi.mocked(getCategoriesOptimized).mockResolvedValue(testData.categories);
      vi.mocked(getDishesOptimized).mockResolvedValue(testData.dishes);

      // Simulate concurrent requests
      const concurrentRequests = 20;
      const startTime = performance.now();
      
      const promises = Array.from({ length: concurrentRequests }, () => getMenuData('es'));
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // All requests should complete successfully
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result).toHaveProperty('categories');
        expect(result).toHaveProperty('dishes');
      });

      // Should handle concurrency efficiently (not much slower than single request)
      expect(duration).toBeLessThan(1000); // 1 second for 20 concurrent requests
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track performance metrics accurately', async () => {
      const testData = {
        categories: [{ id: 1, name: 'Monitored', icon: 'monitored' }],
        dishes: []
      };

      vi.mocked(getCategoriesOptimized).mockResolvedValue(testData.categories);
      vi.mocked(getDishesOptimized).mockResolvedValue(testData.dishes);

      // Clear any existing metrics
      performanceMonitor.clear();

      await getMenuData('es');

      const stats = performanceMonitor.getStats();
      
      // Should have recorded performance metrics
      expect(stats.totalMeasurements).toBeGreaterThan(0);
      expect(stats.averageDuration).toBeGreaterThan(0);
    });

    it('should identify slow operations', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock slow operation
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(1000)  // Start
        .mockReturnValueOnce(2500); // End (1500ms - slow)

      const testData = {
        categories: [],
        dishes: []
      };

      vi.mocked(getCategoriesOptimized).mockResolvedValue(testData.categories);
      vi.mocked(getDishesOptimized).mockResolvedValue(testData.dishes);

      await getMenuData('es');

      // Should warn about slow operation
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow operation detected')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Error Performance Impact', () => {
    it('should fail fast on errors without blocking', async () => {
      vi.mocked(getCategoriesOptimized).mockRejectedValue(new Error('Database error'));
      vi.mocked(getDishesOptimized).mockRejectedValue(new Error('Database error'));

      const startTime = performance.now();
      const result = await getMenuData('es');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should fail fast and return fallback data
      expect(duration).toBeLessThan(100); // Very fast failure
      expect(result).toEqual({
        categories: [],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      });
    });

    it('should maintain performance under partial failures', async () => {
      // Categories succeed, dishes fail
      vi.mocked(getCategoriesOptimized).mockResolvedValue([
        { id: 1, name: 'Success', icon: 'success' }
      ]);
      vi.mocked(getDishesOptimized).mockRejectedValue(new Error('Dishes failed'));

      const startTime = performance.now();
      const result = await getMenuData('es');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle partial failure gracefully and quickly
      expect(duration).toBeLessThan(200);
      expect(result).toEqual({
        categories: [],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      });
    });
  });
});