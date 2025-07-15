import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler, withErrorHandling, MenuError, ErrorType } from '../errorHandler';

describe('Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('MenuError', () => {
    it('should create MenuError with correct properties', () => {
      const context = { operation: 'test', userId: '123' };
      const error = new MenuError('Test error', ErrorType.DATABASE_ERROR, context);

      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ErrorType.DATABASE_ERROR);
      expect(error.context).toEqual(context);
      expect(error.timestamp).toBeTypeOf('number');
      expect(error.name).toBe('MenuError');
    });
  });

  describe('Database Error Handling', () => {
    it('should return result when operation succeeds', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const fallback = 'fallback';

      const result = await errorHandler.handleDatabaseError(operation, fallback);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    it('should return fallback when operation fails', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('DB Error'));
      const fallback = 'fallback';

      const result = await errorHandler.handleDatabaseError(operation, fallback);

      expect(result).toBe('fallback');
      expect(operation).toHaveBeenCalled();
    });

    it('should log error when operation fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const operation = vi.fn().mockRejectedValue(new Error('DB Error'));
      const fallback = 'fallback';

      await errorHandler.handleDatabaseError(operation, fallback);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Cache Error Handling', () => {
    it('should return cached result when available', async () => {
      const cacheOperation = vi.fn().mockReturnValue('cached-data');
      const databaseFallback = vi.fn().mockResolvedValue('db-data');

      const result = await errorHandler.handleCacheError(cacheOperation, databaseFallback);

      expect(result).toBe('cached-data');
      expect(cacheOperation).toHaveBeenCalled();
      expect(databaseFallback).not.toHaveBeenCalled();
    });

    it('should fallback to database when cache returns null', async () => {
      const cacheOperation = vi.fn().mockReturnValue(null);
      const databaseFallback = vi.fn().mockResolvedValue('db-data');

      const result = await errorHandler.handleCacheError(cacheOperation, databaseFallback);

      expect(result).toBe('db-data');
      expect(databaseFallback).toHaveBeenCalled();
    });

    it('should fallback to database when cache throws error', async () => {
      const cacheOperation = vi.fn().mockImplementation(() => {
        throw new Error('Cache error');
      });
      const databaseFallback = vi.fn().mockResolvedValue('db-data');

      const result = await errorHandler.handleCacheError(cacheOperation, databaseFallback);

      expect(result).toBe('db-data');
      expect(databaseFallback).toHaveBeenCalled();
    });

    it('should throw error when both cache and database fail', async () => {
      const cacheOperation = vi.fn().mockImplementation(() => {
        throw new Error('Cache error');
      });
      const databaseFallback = vi.fn().mockRejectedValue(new Error('DB error'));

      await expect(
        errorHandler.handleCacheError(cacheOperation, databaseFallback)
      ).rejects.toThrow('Database fallback failed');
    });
  });

  describe('Component Error Handling', () => {
    it('should handle component errors', () => {
      const error = new Error('Component error');
      const componentName = 'TestComponent';
      const props = { test: 'prop' };

      const result = errorHandler.handleComponentError(error, componentName, props);

      expect(result.hasError).toBe(true);
      expect(result.error).toBeInstanceOf(MenuError);
      expect(result.errorInfo).toEqual({ componentName, props });
    });
  });

  describe('Network Error Handling', () => {
    it('should return result when network operation succeeds', async () => {
      const networkOperation = vi.fn().mockResolvedValue('success');
      const fallback = 'fallback';

      const result = await errorHandler.handleNetworkError(networkOperation, fallback);

      expect(result).toBe('success');
      expect(networkOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry failed operations', async () => {
      const networkOperation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      const fallback = 'fallback';

      const result = await errorHandler.handleNetworkError(networkOperation, fallback, 1);

      expect(result).toBe('success');
      expect(networkOperation).toHaveBeenCalledTimes(2);
    });

    it('should return fallback after max retries', async () => {
      const networkOperation = vi.fn().mockRejectedValue(new Error('Network error'));
      const fallback = 'fallback';

      const result = await errorHandler.handleNetworkError(networkOperation, fallback, 1);

      expect(result).toBe('fallback');
      expect(networkOperation).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });
  });

  describe('Data Validation', () => {
    it('should validate correct menu data', () => {
      const validData = {
        categories: [],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      };

      const isValid = errorHandler.validateMenuData(validData);
      expect(isValid).toBe(true);
    });

    it('should reject invalid data structure', () => {
      const invalidData = null;

      const isValid = errorHandler.validateMenuData(invalidData);
      expect(isValid).toBe(false);
    });

    it('should reject invalid categories', () => {
      const invalidData = {
        categories: 'not-an-array',
        dishes: []
      };

      const isValid = errorHandler.validateMenuData(invalidData);
      expect(isValid).toBe(false);
    });

    it('should reject invalid dishes', () => {
      const invalidData = {
        categories: [],
        dishes: 'not-an-array'
      };

      const isValid = errorHandler.validateMenuData(invalidData);
      expect(isValid).toBe(false);
    });
  });

  describe('Fallback Data', () => {
    it('should provide default fallback data', () => {
      const fallbackData = errorHandler.getFallbackData();

      expect(fallbackData).toEqual({
        categories: [],
        dishes: [],
        menuOfTheDay: [],
        weekMenu: {}
      });
    });

    it('should allow setting custom fallback data', () => {
      const customFallback = {
        categories: [{ id: 1, name: 'Test', icon: 'test' }]
      };

      errorHandler.setFallbackData(customFallback);
      const fallbackData = errorHandler.getFallbackData();

      expect(fallbackData.categories).toEqual(customFallback.categories);
    });
  });

  describe('Convenience Functions', () => {
    it('should provide database error handling', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const fallback = 'fallback';

      const result = await withErrorHandling.database(operation, fallback);

      expect(result).toBe('success');
    });

    it('should provide cache error handling', async () => {
      const cacheOp = vi.fn().mockReturnValue('cached');
      const dbFallback = vi.fn().mockResolvedValue('db');

      const result = await withErrorHandling.cache(cacheOp, dbFallback);

      expect(result).toBe('cached');
    });

    it('should provide network error handling', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const fallback = 'fallback';

      const result = await withErrorHandling.network(operation, fallback);

      expect(result).toBe('success');
    });

    it('should provide component error handling', () => {
      const error = new Error('Component error');
      const componentName = 'TestComponent';

      const result = withErrorHandling.component(error, componentName);

      expect(result.hasError).toBe(true);
    });
  });
});