import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMenuData } from '../getMenuData';
import { menuCache } from '../cache';
import { getCategoriesOptimized, getDishesOptimized } from '../optimizedQueries';
import { menuPerformanceHelpers } from '../performanceMonitor';
import { withErrorHandling } from '../errorHandler';
import type { MenuData } from '@/types/menu';

// Mock dependencies
vi.mock('../cache');
vi.mock('../optimizedQueries');
vi.mock('../performanceMonitor');
vi.mock('../errorHandler');

describe('getMenuData', () => {
  const mockCategories = [
    { id: 1, name: 'Entrantes', icon: 'icon1' },
    { id: 2, name: 'Principales', icon: 'icon2' },
    { id: 3, name: 'Lunes', icon: 'icon3' },
    { id: 4, name: 'Martes', icon: 'icon4' }
  ];

  const mockDishes = [
    {
      id: 1,
      name: 'Ensalada César',
      price: 8.50,
      image: '/images/ensalada.jpg',
      categories: [1], // Entrantes
      allergens: [1]
    },
    {
      id: 2,
      name: 'Paella Valenciana',
      price: 15.00,
      image: '/images/paella.jpg',
      categories: [2], // Principales
      allergens: []
    },
    {
      id: 3,
      name: 'Menú del Lunes',
      price: 12.00,
      image: '/images/menu-lunes.jpg',
      categories: [3], // Lunes
      allergens: [2]
    }
  ];

  const expectedMenuData: MenuData = {
    categories: mockCategories,
    dishes: [mockDishes[0], mockDishes[1]], // Excluding daily menu items
    menuOfTheDay: [mockDishes[2]], // Only Monday's dish (assuming today is Monday)
    weekMenu: {
      'Lunes': ['Menú del Lunes'],
      'Martes': [],
      'Miércoles': [],
      'Jueves': [],
      'Viernes': [],
      'Sábado': [],
      'Domingo': []
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Date to always return Monday (day 1)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01')); // This is a Monday
    
    // Setup default mocks
    vi.mocked(menuPerformanceHelpers.measureDataFetch).mockReturnValue('perf-id');
    vi.mocked(menuPerformanceHelpers.endMeasure).mockReturnValue(100);
    vi.mocked(menuPerformanceHelpers.recordMenuError).mockImplementation(() => {});
    
    vi.mocked(getCategoriesOptimized).mockResolvedValue(mockCategories);
    vi.mocked(getDishesOptimized).mockResolvedValue(mockDishes);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Cache Hit Scenarios', () => {
    it('should return cached data when available', async () => {
      const cachedData = expectedMenuData;
      
      vi.mocked(withErrorHandling.cache).mockResolvedValue(cachedData);

      const result = await getMenuData('es');

      expect(result).toEqual(cachedData);
      expect(menuPerformanceHelpers.measureDataFetch).toHaveBeenCalledWith('es');
      expect(menuPerformanceHelpers.endMeasure).toHaveBeenCalledWith('perf-id');
    });

    it('should handle cache errors and fallback to database', async () => {
      vi.mocked(withErrorHandling.cache).mockResolvedValue({
        categories: mockCategories,
        allDishes: mockDishes
      });

      const result = await getMenuData('es');

      expect(result.categories).toEqual(mockCategories);
      expect(result.dishes).toHaveLength(2); // Excluding daily menu items
      expect(result.menuOfTheDay).toHaveLength(1); // Monday's menu
    });
  });

  describe('Data Processing', () => {
    beforeEach(() => {
      vi.mocked(withErrorHandling.cache).mockResolvedValue({
        categories: mockCategories,
        allDishes: mockDishes
      });
    });

    it('should filter out daily menu items from regular dishes', async () => {
      const result = await getMenuData('es');

      expect(result.dishes).toHaveLength(2);
      expect(result.dishes.map(d => d.name)).toEqual(['Ensalada César', 'Paella Valenciana']);
      expect(result.dishes.map(d => d.name)).not.toContain('Menú del Lunes');
    });

    it('should correctly identify today\'s menu items', async () => {
      const result = await getMenuData('es');

      expect(result.menuOfTheDay).toHaveLength(1);
      expect(result.menuOfTheDay[0].name).toBe('Menú del Lunes');
    });

    it('should build weekly menu correctly', async () => {
      const result = await getMenuData('es');

      expect(result.weekMenu['Lunes']).toEqual(['Menú del Lunes']);
      expect(result.weekMenu['Martes']).toEqual([]);
      expect(Object.keys(result.weekMenu)).toHaveLength(7);
    });

    it('should handle different languages', async () => {
      const result = await getMenuData('en');

      expect(result.weekMenu).toHaveProperty('Monday');
      expect(result.weekMenu).toHaveProperty('Tuesday');
      expect(Object.keys(result.weekMenu)).toHaveLength(7);
    });

    it('should handle German language', async () => {
      const result = await getMenuData('de');

      expect(result.weekMenu).toHaveProperty('Montag');
      expect(result.weekMenu).toHaveProperty('Dienstag');
      expect(Object.keys(result.weekMenu)).toHaveLength(7);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty categories', async () => {
      vi.mocked(withErrorHandling.cache).mockResolvedValue({
        categories: [],
        allDishes: mockDishes
      });

      const result = await getMenuData('es');

      expect(result.categories).toEqual([]);
      expect(result.dishes).toEqual(mockDishes); // All dishes since no day categories
      expect(result.menuOfTheDay).toEqual([]);
    });

    it('should handle empty dishes', async () => {
      vi.mocked(withErrorHandling.cache).mockResolvedValue({
        categories: mockCategories,
        allDishes: []
      });

      const result = await getMenuData('es');

      expect(result.dishes).toEqual([]);
      expect(result.menuOfTheDay).toEqual([]);
      expect(Object.values(result.weekMenu).every(day => day.length === 0)).toBe(true);
    });

    it('should handle missing day categories', async () => {
      const categoriesWithoutDays = [
        { id: 1, name: 'Entrantes', icon: 'icon1' },
        { id: 2, name: 'Principales', icon: 'icon2' }
      ];

      vi.mocked(withErrorHandling.cache).mockResolvedValue({
        categories: categoriesWithoutDays,
        allDishes: mockDishes
      });

      const result = await getMenuData('es');

      expect(result.dishes).toEqual(mockDishes); // All dishes since no day categories to filter
      expect(result.menuOfTheDay).toEqual([]);
    });

    it('should handle different days of the week', async () => {
      // Test Tuesday
      vi.setSystemTime(new Date('2024-01-02')); // Tuesday

      const tuesdayDish = {
        id: 4,
        name: 'Menú del Martes',
        price: 11.00,
        image: '/images/menu-martes.jpg',
        categories: [4], // Martes
        allergens: []
      };

      vi.mocked(withErrorHandling.cache).mockResolvedValue({
        categories: mockCategories,
        allDishes: [...mockDishes, tuesdayDish]
      });

      const result = await getMenuData('es');

      expect(result.menuOfTheDay).toHaveLength(1);
      expect(result.menuOfTheDay[0].name).toBe('Menú del Martes');
    });
  });

  describe('Performance Monitoring', () => {
    it('should measure performance correctly', async () => {
      vi.mocked(withErrorHandling.cache).mockResolvedValue({
        categories: mockCategories,
        allDishes: mockDishes
      });

      await getMenuData('es');

      expect(menuPerformanceHelpers.measureDataFetch).toHaveBeenCalledWith('es');
      expect(menuPerformanceHelpers.endMeasure).toHaveBeenCalledWith('perf-id');
    });

    it('should end performance measurement even on error', async () => {
      vi.mocked(withErrorHandling.cache).mockRejectedValue(new Error('Test error'));

      const result = await getMenuData('es');

      expect(menuPerformanceHelpers.endMeasure).toHaveBeenCalledWith('perf-id');
      expect(menuPerformanceHelpers.recordMenuError).toHaveBeenCalledWith(
        'data-fetch',
        expect.any(Error),
        { language: 'es' }
      );
      expect(result).toEqual({
        categories: [],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      });
    });
  });

  describe('Error Handling', () => {
    it('should return fallback data on error', async () => {
      vi.mocked(withErrorHandling.cache).mockRejectedValue(new Error('Database error'));

      const result = await getMenuData('es');

      expect(result).toEqual({
        categories: [],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      });
    });

    it('should log errors appropriately', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(withErrorHandling.cache).mockRejectedValue(new Error('Test error'));

      await getMenuData('es');

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching menu data:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Cache Integration', () => {
    it('should cache successful results', async () => {
      vi.mocked(withErrorHandling.cache).mockResolvedValue({
        categories: mockCategories,
        allDishes: mockDishes
      });

      await getMenuData('es');

      // Verify that cache.set would be called through the withErrorHandling.cache mock
      expect(withErrorHandling.cache).toHaveBeenCalled();
    });

    it('should use correct cache key for different languages', async () => {
      vi.mocked(withErrorHandling.cache).mockResolvedValue({
        categories: mockCategories,
        allDishes: mockDishes
      });

      await getMenuData('en');

      expect(withErrorHandling.cache).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        { language: 'en', operation: 'getMenuData' }
      );
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data structure consistency', async () => {
      vi.mocked(withErrorHandling.cache).mockResolvedValue({
        categories: mockCategories,
        allDishes: mockDishes
      });

      const result = await getMenuData('es');

      // Verify all required properties exist
      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('dishes');
      expect(result).toHaveProperty('menuOfTheDay');
      expect(result).toHaveProperty('weekMenu');

      // Verify data types
      expect(Array.isArray(result.categories)).toBe(true);
      expect(Array.isArray(result.dishes)).toBe(true);
      expect(Array.isArray(result.menuOfTheDay)).toBe(true);
      expect(typeof result.weekMenu).toBe('object');
    });

    it('should not mutate original data', async () => {
      const originalCategories = [...mockCategories];
      const originalDishes = [...mockDishes];

      vi.mocked(withErrorHandling.cache).mockResolvedValue({
        categories: mockCategories,
        allDishes: mockDishes
      });

      await getMenuData('es');

      expect(mockCategories).toEqual(originalCategories);
      expect(mockDishes).toEqual(originalDishes);
    });
  });
});