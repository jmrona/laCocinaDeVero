import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getCategoriesOptimized, 
  getDishesOptimized,
  getDishesByCategoriesOptimized,
  getRegularDishesOptimized,
  getDishNamesForWeeklyMenu,
  queryPerformanceMonitor 
} from '../optimizedQueries';
import { supabase } from '@/db/supabase';

// Mock Supabase
vi.mock('@/db/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        not: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }
}));

describe('Optimized Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCategoriesOptimized', () => {
    it('should fetch categories with optimized query', async () => {
      const mockCategories = [
        { category_id: 1, name: { es: 'Entrantes', en: 'Starters' }, icon: 'icon1' }
      ];

      const mockSupabase = supabase as any;
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      const result = await getCategoriesOptimized('es');

      expect(mockSupabase.from).toHaveBeenCalledWith('categories');
      expect(result).toEqual([
        { id: 1, name: 'Entrantes', icon: 'icon1' }
      ]);
    });

    it('should handle database errors gracefully', async () => {
      const mockSupabase = supabase as any;
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') })
        })
      });

      const result = await getCategoriesOptimized('es');
      expect(result).toEqual([]);
    });
  });

  describe('getDishesOptimized', () => {
    it('should fetch dishes with optimized query', async () => {
      const mockDishes = [
        {
          dish_id: 1,
          name: { es: 'Plato 1', en: 'Dish 1' },
          price: 10.50,
          image: 'image1.jpg',
          dishes_categories: [{ category_id: 1 }],
          dishes_allergens: [{ allergen_id: 1 }]
        }
      ];

      const mockSupabase = supabase as any;
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockDishes, error: null })
        })
      });

      const result = await getDishesOptimized('es');

      expect(result).toEqual([
        {
          id: 1,
          name: 'Plato 1',
          price: 10.50,
          image: 'image1.jpg',
          categories: [1],
          allergens: [1]
        }
      ]);
    });
  });

  describe('getDishesByCategoriesOptimized', () => {
    it('should return empty array for empty category list', async () => {
      const result = await getDishesByCategoriesOptimized('es', []);
      expect(result).toEqual([]);
    });

    it('should fetch dishes for specific categories', async () => {
      const mockDishes = [
        {
          dish_id: 1,
          name: { es: 'Plato del día' },
          price: 12.00,
          image: 'daily.jpg',
          dishes_categories: [{ category_id: 2 }],
          dishes_allergens: []
        }
      ];

      const mockSupabase = supabase as any;
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockDishes, error: null })
          })
        })
      });

      const result = await getDishesByCategoriesOptimized('es', [2]);

      expect(result).toEqual([
        {
          id: 1,
          name: 'Plato del día',
          price: 12.00,
          image: 'daily.jpg',
          categories: [2],
          allergens: []
        }
      ]);
    });
  });

  describe('queryPerformanceMonitor', () => {
    it('should measure query execution time', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const mockQuery = vi.fn().mockResolvedValue('test result');

      const result = await queryPerformanceMonitor.measureQuery('test-query', mockQuery);

      expect(result).toBe('test result');
      expect(mockQuery).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Query "test-query" took')
      );

      consoleSpy.mockRestore();
    });

    it('should handle query errors and still measure time', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockQuery = vi.fn().mockRejectedValue(new Error('Query failed'));

      await expect(
        queryPerformanceMonitor.measureQuery('failing-query', mockQuery)
      ).rejects.toThrow('Query failed');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Query "failing-query" failed after'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Optimizations', () => {
    it('should use efficient field selection', async () => {
      const mockSupabase = supabase as any;
      const selectSpy = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      });
      
      mockSupabase.from.mockReturnValue({
        select: selectSpy
      });

      await getCategoriesOptimized('es');

      // Verify that only necessary fields are selected
      expect(selectSpy).toHaveBeenCalledWith(
        expect.stringContaining('category_id')
      );
      expect(selectSpy).toHaveBeenCalledWith(
        expect.stringContaining('name')
      );
      expect(selectSpy).toHaveBeenCalledWith(
        expect.stringContaining('icon')
      );
    });

    it('should use LEFT JOINs for optional relationships', async () => {
      const mockSupabase = supabase as any;
      const selectSpy = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      });
      
      mockSupabase.from.mockReturnValue({
        select: selectSpy
      });

      await getDishesOptimized('es');

      // Verify that LEFT JOINs are used for allergens (optional)
      expect(selectSpy).toHaveBeenCalledWith(
        expect.stringContaining('dishes_allergens!left')
      );
    });

    it('should order results for consistent output', async () => {
      const mockSupabase = supabase as any;
      const orderSpy = vi.fn().mockResolvedValue({ data: [], error: null });
      const selectSpy = vi.fn().mockReturnValue({
        order: orderSpy
      });
      
      mockSupabase.from.mockReturnValue({
        select: selectSpy
      });

      await getCategoriesOptimized('es');

      expect(orderSpy).toHaveBeenCalledWith('category_id');
    });

    it('should handle database connection errors', async () => {
      const mockSupabase = supabase as any;
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockRejectedValue(new Error('Connection failed'))
        })
      });

      const result = await getCategoriesOptimized('es');
      expect(result).toEqual([]);
    });

    it('should process multilingual data correctly', async () => {
      const mockCategories = [
        { 
          category_id: 1, 
          name: { es: 'Entrantes', en: 'Starters', de: 'Vorspeisen' }, 
          icon: 'icon1' 
        }
      ];

      const mockSupabase = supabase as any;
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      const resultEs = await getCategoriesOptimized('es');
      const resultEn = await getCategoriesOptimized('en');
      const resultDe = await getCategoriesOptimized('de');

      expect(resultEs[0].name).toBe('Entrantes');
      expect(resultEn[0].name).toBe('Starters');
      expect(resultDe[0].name).toBe('Vorspeisen');
    });

    it('should fallback to Spanish when language not available', async () => {
      const mockCategories = [
        { 
          category_id: 1, 
          name: { es: 'Entrantes' }, // Only Spanish available
          icon: 'icon1' 
        }
      ];

      const mockSupabase = supabase as any;
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
        })
      });

      const result = await getCategoriesOptimized('en'); // Request English
      expect(result[0].name).toBe('Entrantes'); // Should fallback to Spanish
    });
  });

  describe('Query Optimization Strategies', () => {
    it('should minimize data transfer with selective fields', async () => {
      const mockSupabase = supabase as any;
      const selectSpy = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      });
      
      mockSupabase.from.mockReturnValue({
        select: selectSpy
      });

      await getDishesOptimized('es');

      // Should not select unnecessary fields like description, ingredients, etc.
      const selectCall = selectSpy.mock.calls[0][0];
      expect(selectCall).not.toContain('description');
      expect(selectCall).not.toContain('ingredients');
      expect(selectCall).not.toContain('created_at');
      expect(selectCall).not.toContain('updated_at');
    });

    it('should use appropriate JOIN types', async () => {
      const mockSupabase = supabase as any;
      const selectSpy = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null })
      });
      
      mockSupabase.from.mockReturnValue({
        select: selectSpy
      });

      await getDishesOptimized('es');

      const selectCall = selectSpy.mock.calls[0][0];
      // Categories are required, allergens are optional
      expect(selectCall).toContain('dishes_categories!left');
      expect(selectCall).toContain('dishes_allergens!left');
    });

    it('should handle empty result sets efficiently', async () => {
      const mockSupabase = supabase as any;
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      });

      const categories = await getCategoriesOptimized('es');
      const dishes = await getDishesOptimized('es');

      expect(categories).toEqual([]);
      expect(dishes).toEqual([]);
    });
  });
});