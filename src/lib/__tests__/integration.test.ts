import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMenuData } from '../getMenuData';
import { menuCache, getCacheKey } from '../cache';
import { invalidateCache } from '../cacheUtils';
import { performanceMonitor } from '../performanceMonitor';
import { errorHandler } from '../errorHandler';

// Mock all dependencies
vi.mock('../optimizedQueries');
vi.mock('../performanceMonitor');
vi.mock('../errorHandler');

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    menuCache.clear();
    performanceMonitor.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('End-to-End Menu Data Flow', () => {
    it('should handle complete menu data lifecycle', async () => {
      // Mock successful data fetch
      const { getCategoriesOptimized, getDishesOptimized } = await import('../optimizedQueries');
      const { menuPerformanceHelpers } = await import('../performanceMonitor');
      const { withErrorHandling } = await import('../errorHandler');

      const mockCategories = [
        { id: 1, name: 'Entrantes', icon: 'icon1' },
        { id: 2, name: 'Lunes', icon: 'icon2' }
      ];

      const mockDishes = [
        {
          id: 1,
          name: 'Ensalada',
          price: 8.50,
          image: '/ensalada.jpg',
          categories: [1],
          allergens: []
        },
        {
          id: 2,
          name: 'Menú Lunes',
          price: 12.00,
          image: '/menu.jpg',
          categories: [2],
          allergens: [1]
        }
      ];

      vi.mocked(menuPerformanceHelpers.measureDataFetch).mockReturnValue('perf-id');
      vi.mocked(menuPerformanceHelpers.endMeasure).mockReturnValue(100);
      vi.mocked(getCategoriesOptimized).mockResolvedValue(mockCategories);
      vi.mocked(getDishesOptimized).mockResolvedValue(mockDishes);
      
      // Mock cache miss scenario
      vi.mocked(withErrorHandling.cache).mockResolvedValue({
        categories: mockCategories,
        allDishes: mockDishes
      });

      // Mock Monday
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01')); // Monday

      const result = await getMenuData('es');

      // Verify complete data structure
      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('dishes');
      expect(result).toHaveProperty('menuOfTheDay');
      expect(result).toHaveProperty('weekMenu');

      // Verify data filtering
      expect(result.dishes).toHaveLength(1); // Only non-daily dishes
      expect(result.dishes[0].name).toBe('Ensalada');
      expect(result.menuOfTheDay).toHaveLength(1); // Monday's dish
      expect(result.menuOfTheDay[0].name).toBe('Menú Lunes');

      // Verify performance monitoring
      expect(menuPerformanceHelpers.measureDataFetch).toHaveBeenCalledWith('es');
      expect(menuPerformanceHelpers.endMeasure).toHaveBeenCalledWith('perf-id');
    });

    it('should handle cache hit scenario', async () => {
      const cachedData = {
        categories: [{ id: 1, name: 'Cached Category', icon: 'cached' }],
        dishes: [{ id: 1, name: 'Cached Dish', price: 10, image: '', categories: [1], allergens: [] }],
        menuOfTheDay: [],
        weekMenu: {}
      };

      const { withErrorHandling } = await import('../errorHandler');
      const { menuPerformanceHelpers } = await import('../performanceMonitor');

      vi.mocked(menuPerformanceHelpers.measureDataFetch).mockReturnValue('perf-id');
      vi.mocked(menuPerformanceHelpers.endMeasure).mockReturnValue(50);
      vi.mocked(withErrorHandling.cache).mockResolvedValue(cachedData);

      const result = await getMenuData('es');

      expect(result).toEqual(cachedData);
      expect(menuPerformanceHelpers.endMeasure).toHaveBeenCalledWith('perf-id');
    });

    it('should handle error scenarios with fallback', async () => {
      const { withErrorHandling } = await import('../errorHandler');
      const { menuPerformanceHelpers } = await import('../performanceMonitor');

      vi.mocked(menuPerformanceHelpers.measureDataFetch).mockReturnValue('perf-id');
      vi.mocked(menuPerformanceHelpers.endMeasure).mockReturnValue(200);
      vi.mocked(menuPerformanceHelpers.recordMenuError).mockImplementation(() => {});
      vi.mocked(withErrorHandling.cache).mockRejectedValue(new Error('Database error'));

      const result = await getMenuData('es');

      // Should return fallback data
      expect(result).toEqual({
        categories: [],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      });

      // Should record error
      expect(menuPerformanceHelpers.recordMenuError).toHaveBeenCalledWith(
        'data-fetch',
        expect.any(Error),
        { language: 'es' }
      );
    });
  });

  describe('Multi-Language Support', () => {
    it('should handle all supported languages correctly', async () => {
      const { getCategoriesOptimized, getDishesOptimized } = await import('../optimizedQueries');
      const { withErrorHandling } = await import('../errorHandler');
      const { menuPerformanceHelpers } = await import('../performanceMonitor');

      const mockData = {
        categories: [{ id: 1, name: 'Test Category', icon: 'test' }],
        allDishes: [{ id: 1, name: 'Test Dish', price: 10, image: '', categories: [1], allergens: [] }]
      };

      vi.mocked(menuPerformanceHelpers.measureDataFetch).mockReturnValue('perf-id');
      vi.mocked(menuPerformanceHelpers.endMeasure).mockReturnValue(100);
      vi.mocked(getCategoriesOptimized).mockResolvedValue(mockData.categories);
      vi.mocked(getDishesOptimized).mockResolvedValue(mockData.allDishes);
      vi.mocked(withErrorHandling.cache).mockResolvedValue(mockData);

      const languages = ['es', 'en', 'de'] as const;
      
      for (const lang of languages) {
        const result = await getMenuData(lang);
        
        expect(result).toHaveProperty('categories');
        expect(result).toHaveProperty('dishes');
        expect(result).toHaveProperty('menuOfTheDay');
        expect(result).toHaveProperty('weekMenu');
        
        // Verify week menu has correct day names for language
        const weekMenuKeys = Object.keys(result.weekMenu);
        expect(weekMenuKeys).toHaveLength(7);
        
        if (lang === 'es') {
          expect(weekMenuKeys).toContain('Lunes');
          expect(weekMenuKeys).toContain('Martes');
        } else if (lang === 'en') {
          expect(weekMenuKeys).toContain('Monday');
          expect(weekMenuKeys).toContain('Tuesday');
        } else if (lang === 'de') {
          expect(weekMenuKeys).toContain('Montag');
          expect(weekMenuKeys).toContain('Dienstag');
        }
      }
    });
  });

  describe('Performance and Caching Integration', () => {
    it('should integrate cache and performance monitoring', async () => {
      const { withErrorHandling } = await import('../errorHandler');
      const { menuPerformanceHelpers } = await import('../performanceMonitor');

      const testData = {
        categories: [{ id: 1, name: 'Test', icon: 'test' }],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      };

      vi.mocked(menuPerformanceHelpers.measureDataFetch).mockReturnValue('perf-id');
      vi.mocked(menuPerformanceHelpers.endMeasure).mockReturnValue(150);
      vi.mocked(withErrorHandling.cache).mockResolvedValue(testData);

      // First call - cache miss
      const result1 = await getMenuData('es');
      expect(result1).toEqual(testData);

      // Second call - should hit cache (mocked)
      vi.mocked(withErrorHandling.cache).mockResolvedValue(testData);
      const result2 = await getMenuData('es');
      expect(result2).toEqual(testData);

      // Verify performance monitoring was called for both
      expect(menuPerformanceHelpers.measureDataFetch).toHaveBeenCalledTimes(2);
      expect(menuPerformanceHelpers.endMeasure).toHaveBeenCalledTimes(2);
    });

    it('should handle cache invalidation correctly', async () => {
      const { withErrorHandling } = await import('../errorHandler');
      const { menuPerformanceHelpers } = await import('../performanceMonitor');

      const testData = {
        categories: [],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      };

      vi.mocked(menuPerformanceHelpers.measureDataFetch).mockReturnValue('perf-id');
      vi.mocked(menuPerformanceHelpers.endMeasure).mockReturnValue(100);
      vi.mocked(withErrorHandling.cache).mockResolvedValue(testData);

      // Get data
      await getMenuData('es');

      // Invalidate cache
      invalidateCache.menuData('es');

      // Get data again - should refetch
      await getMenuData('es');

      expect(menuPerformanceHelpers.measureDataFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should recover from transient errors', async () => {
      const { withErrorHandling } = await import('../errorHandler');
      const { menuPerformanceHelpers } = await import('../performanceMonitor');

      vi.mocked(menuPerformanceHelpers.measureDataFetch).mockReturnValue('perf-id');
      vi.mocked(menuPerformanceHelpers.endMeasure).mockReturnValue(100);
      vi.mocked(menuPerformanceHelpers.recordMenuError).mockImplementation(() => {});

      // First call fails
      vi.mocked(withErrorHandling.cache).mockRejectedValueOnce(new Error('Transient error'));
      
      const result1 = await getMenuData('es');
      expect(result1).toEqual({
        categories: [],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      });

      // Second call succeeds
      const successData = {
        categories: [{ id: 1, name: 'Recovered', icon: 'recovered' }],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      };
      vi.mocked(withErrorHandling.cache).mockResolvedValue(successData);

      const result2 = await getMenuData('es');
      expect(result2).toEqual(successData);

      expect(menuPerformanceHelpers.recordMenuError).toHaveBeenCalledTimes(1);
    });

    it('should maintain system stability under load', async () => {
      const { withErrorHandling } = await import('../errorHandler');
      const { menuPerformanceHelpers } = await import('../performanceMonitor');

      vi.mocked(menuPerformanceHelpers.measureDataFetch).mockReturnValue('perf-id');
      vi.mocked(menuPerformanceHelpers.endMeasure).mockReturnValue(100);

      const testData = {
        categories: [],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      };
      vi.mocked(withErrorHandling.cache).mockResolvedValue(testData);

      // Simulate concurrent requests
      const promises = Array.from({ length: 10 }, () => getMenuData('es'));
      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result).toEqual(testData);
      });

      expect(menuPerformanceHelpers.measureDataFetch).toHaveBeenCalledTimes(10);
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain data consistency across operations', async () => {
      const { getCategoriesOptimized, getDishesOptimized } = await import('../optimizedQueries');
      const { withErrorHandling } = await import('../errorHandler');
      const { menuPerformanceHelpers } = await import('../performanceMonitor');

      const categories = [
        { id: 1, name: 'Regular', icon: 'regular' },
        { id: 2, name: 'Lunes', icon: 'monday' },
        { id: 3, name: 'Martes', icon: 'tuesday' }
      ];

      const dishes = [
        { id: 1, name: 'Regular Dish', price: 10, image: '', categories: [1], allergens: [] },
        { id: 2, name: 'Monday Special', price: 12, image: '', categories: [2], allergens: [] },
        { id: 3, name: 'Tuesday Special', price: 11, image: '', categories: [3], allergens: [] }
      ];

      vi.mocked(menuPerformanceHelpers.measureDataFetch).mockReturnValue('perf-id');
      vi.mocked(menuPerformanceHelpers.endMeasure).mockReturnValue(100);
      vi.mocked(getCategoriesOptimized).mockResolvedValue(categories);
      vi.mocked(getDishesOptimized).mockResolvedValue(dishes);
      vi.mocked(withErrorHandling.cache).mockResolvedValue({
        categories,
        allDishes: dishes
      });

      // Test Monday
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01')); // Monday

      const mondayResult = await getMenuData('es');
      
      expect(mondayResult.dishes).toHaveLength(1); // Only regular dish
      expect(mondayResult.dishes[0].name).toBe('Regular Dish');
      expect(mondayResult.menuOfTheDay).toHaveLength(1); // Monday special
      expect(mondayResult.menuOfTheDay[0].name).toBe('Monday Special');
      expect(mondayResult.weekMenu['Lunes']).toEqual(['Monday Special']);
      expect(mondayResult.weekMenu['Martes']).toEqual(['Tuesday Special']);

      // Test Tuesday
      vi.setSystemTime(new Date('2024-01-02')); // Tuesday

      const tuesdayResult = await getMenuData('es');
      
      expect(tuesdayResult.dishes).toHaveLength(1); // Only regular dish
      expect(tuesdayResult.menuOfTheDay).toHaveLength(1); // Tuesday special
      expect(tuesdayResult.menuOfTheDay[0].name).toBe('Tuesday Special');
    });
  });
});