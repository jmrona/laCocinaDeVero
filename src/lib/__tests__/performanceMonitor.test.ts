import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { performanceMonitor, menuPerformanceHelpers, measurePageLoad } from '../performanceMonitor';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  getEntriesByType: vi.fn(() => [])
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

describe('Performance Monitor', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    vi.clearAllMocks();
    mockPerformance.now.mockReturnValue(1000);
  });

  describe('Basic Measurements', () => {
    it('should start and end measurements', () => {
      const name = 'test-operation';
      
      performanceMonitor.startMeasure(name);
      mockPerformance.now.mockReturnValue(1500);
      
      const duration = performanceMonitor.endMeasure(name);
      
      expect(duration).toBe(500);
    });

    it('should handle non-existent measurements gracefully', () => {
      const duration = performanceMonitor.endMeasure('non-existent');
      expect(duration).toBeNull();
    });

    it('should measure async operations', async () => {
      const asyncOperation = vi.fn().mockResolvedValue('result');
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1300);

      const result = await performanceMonitor.measureAsync('async-test', asyncOperation);

      expect(result).toBe('result');
      expect(asyncOperation).toHaveBeenCalled();
    });

    it('should handle async operation errors', async () => {
      const asyncOperation = vi.fn().mockRejectedValue(new Error('Test error'));

      await expect(
        performanceMonitor.measureAsync('failing-async', asyncOperation)
      ).rejects.toThrow('Test error');
    });
  });

  describe('Error Recording', () => {
    it('should record errors with context', () => {
      const error = new Error('Test error');
      const context = { operation: 'test', userId: '123' };

      performanceMonitor.recordError('test-operation', error, context);

      const stats = performanceMonitor.getStats();
      expect(stats.errorCount).toBe(1);
      expect(stats.recentErrors).toHaveLength(1);
      expect(stats.recentErrors[0].name).toBe('test-operation');
    });

    it('should limit recent errors to 5', () => {
      // Record 7 errors
      for (let i = 0; i < 7; i++) {
        performanceMonitor.recordError(`error-${i}`, new Error(`Error ${i}`));
      }

      const stats = performanceMonitor.getStats();
      expect(stats.errorCount).toBe(7);
      expect(stats.recentErrors).toHaveLength(5);
    });
  });

  describe('Statistics', () => {
    it('should calculate performance statistics', () => {
      // Add some measurements
      performanceMonitor.startMeasure('fast-op');
      mockPerformance.now.mockReturnValue(1100);
      performanceMonitor.endMeasure('fast-op');

      performanceMonitor.startMeasure('slow-op');
      mockPerformance.now.mockReturnValue(1600);
      performanceMonitor.endMeasure('slow-op');

      const stats = performanceMonitor.getStats();
      
      expect(stats.totalMeasurements).toBe(2);
      expect(stats.averageDuration).toBe(300); // (100 + 500) / 2
      expect(stats.fastestOperation?.name).toBe('fast-op');
      expect(stats.slowestOperation?.name).toBe('slow-op');
    });

    it('should handle empty statistics', () => {
      const stats = performanceMonitor.getStats();
      
      expect(stats.totalMeasurements).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.errorCount).toBe(0);
    });
  });

  describe('Menu Performance Helpers', () => {
    it('should measure data fetch operations', () => {
      const measureId = menuPerformanceHelpers.measureDataFetch('es');
      expect(measureId).toBe('menu-data-fetch-es');
    });

    it('should measure component render operations', () => {
      const measureId = menuPerformanceHelpers.measureComponentRender('MenuList');
      expect(measureId).toBe('component-render-MenuList');
    });

    it('should measure cache operations', () => {
      const measureId = menuPerformanceHelpers.measureCacheOperation('get', 'menu_data_es');
      expect(measureId).toBe('cache-get');
    });

    it('should record menu-specific errors', () => {
      const error = new Error('Menu fetch failed');
      const context = { language: 'es' };

      menuPerformanceHelpers.recordMenuError('data-fetch', error, context);

      const stats = performanceMonitor.getStats();
      expect(stats.errorCount).toBe(1);
      expect(stats.recentErrors[0].name).toBe('menu-data-fetch');
    });
  });

  describe('Page Load Measurement', () => {
    it('should set up page load measurement', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      
      measurePageLoad();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));
    });
  });

  describe('Environment Handling', () => {
    it('should handle missing performance API', () => {
      const originalPerformance = global.performance;
      // @ts-ignore
      delete global.performance;

      const name = performanceMonitor.startMeasure('test');
      const duration = performanceMonitor.endMeasure(name);

      expect(duration).toBeNull();

      global.performance = originalPerformance;
    });
  });
});