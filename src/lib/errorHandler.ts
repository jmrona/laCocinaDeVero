/**
 * Error handling utilities for graceful degradation
 */

import { performanceMonitor } from './performanceMonitor';

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export interface FallbackData {
  categories: any[];
  dishes: any[];
  menuOfTheDay: any[];
  weekMenu: Record<string, string[]>;
}

/**
 * Error types for better error handling
 */
export enum ErrorType {
  DATABASE_ERROR = 'DATABASE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  COMPONENT_ERROR = 'COMPONENT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export class MenuError extends Error {
  public readonly type: ErrorType;
  public readonly context?: Record<string, any>;
  public readonly timestamp: number;

  constructor(message: string, type: ErrorType, context?: Record<string, any>) {
    super(message);
    this.name = 'MenuError';
    this.type = type;
    this.context = context;
    this.timestamp = Date.now();
  }
}

/**
 * Error handler with graceful degradation
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private fallbackData: FallbackData;

  private constructor() {
    this.fallbackData = {
      categories: [],
      dishes: [],
      menuOfTheDay: [],
      weekMenu: {}
    };
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle database errors with fallback
   */
  async handleDatabaseError<T>(
    operation: () => Promise<T>,
    fallback: T,
    context?: Record<string, any>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const menuError = new MenuError(
        `Database operation failed: ${(error as Error).message}`,
        ErrorType.DATABASE_ERROR,
        context
      );

      this.logError(menuError);
      performanceMonitor.recordError('database-operation', menuError, context);

      return fallback;
    }
  }

  /**
   * Handle cache errors with fallback to database
   */
  async handleCacheError<T>(
    cacheOperation: () => T | null,
    databaseFallback: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    try {
      const cachedResult = cacheOperation();
      if (cachedResult !== null) {
        return cachedResult;
      }
    } catch (error) {
      const menuError = new MenuError(
        `Cache operation failed: ${(error as Error).message}`,
        ErrorType.CACHE_ERROR,
        context
      );

      this.logError(menuError);
      performanceMonitor.recordError('cache-operation', menuError, context);
    }

    // Fallback to database
    try {
      return await databaseFallback();
    } catch (dbError) {
      const menuError = new MenuError(
        `Database fallback failed: ${(dbError as Error).message}`,
        ErrorType.DATABASE_ERROR,
        { ...context, fallbackAttempt: true }
      );

      this.logError(menuError);
      throw menuError;
    }
  }

  /**
   * Handle component errors
   */
  handleComponentError(error: Error, componentName: string, props?: any): ErrorBoundaryState {
    const menuError = new MenuError(
      `Component error in ${componentName}: ${error.message}`,
      ErrorType.COMPONENT_ERROR,
      { componentName, props }
    );

    this.logError(menuError);
    performanceMonitor.recordError('component-error', menuError, { componentName });

    return {
      hasError: true,
      error: menuError,
      errorInfo: { componentName, props }
    };
  }

  /**
   * Handle network errors
   */
  async handleNetworkError<T>(
    networkOperation: () => Promise<T>,
    fallback: T,
    retries: number = 2
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await networkOperation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
      }
    }

    const menuError = new MenuError(
      `Network operation failed after ${retries + 1} attempts: ${lastError!.message}`,
      ErrorType.NETWORK_ERROR,
      { retries, lastError: lastError!.message }
    );

    this.logError(menuError);
    performanceMonitor.recordError('network-operation', menuError);

    return fallback;
  }

  /**
   * Validate data and handle validation errors
   */
  validateMenuData(data: any, context?: Record<string, any>): boolean {
    try {
      // Basic validation
      if (!data || typeof data !== 'object') {
        throw new MenuError('Invalid data structure', ErrorType.VALIDATION_ERROR, context);
      }

      if (data.categories && !Array.isArray(data.categories)) {
        throw new MenuError('Categories must be an array', ErrorType.VALIDATION_ERROR, context);
      }

      if (data.dishes && !Array.isArray(data.dishes)) {
        throw new MenuError('Dishes must be an array', ErrorType.VALIDATION_ERROR, context);
      }

      return true;
    } catch (error) {
      this.logError(error as MenuError);
      return false;
    }
  }

  /**
   * Get fallback data for graceful degradation
   */
  getFallbackData(): FallbackData {
    return { ...this.fallbackData };
  }

  /**
   * Set custom fallback data
   */
  setFallbackData(data: Partial<FallbackData>): void {
    this.fallbackData = { ...this.fallbackData, ...data };
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: MenuError): void {
    const logData = {
      message: error.message,
      type: error.type,
      timestamp: error.timestamp,
      context: error.context,
      stack: error.stack
    };

    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Menu Error:', logData);
    } else {
      // In production, send to error tracking service
      this.sendToErrorService(logData);
    }
  }

  /**
   * Send error to external service (placeholder)
   */
  private sendToErrorService(errorData: any): void {
    // Placeholder for error tracking service integration
    console.log('Would send to error service:', errorData);
  }

  /**
   * Create error boundary props for React components
   */
  createErrorBoundaryProps(componentName: string) {
    return {
      onError: (error: Error, errorInfo: any) => 
        this.handleComponentError(error, componentName, errorInfo),
      fallback: ({ error, resetError }: { error: Error; resetError: () => void }) => {
        // Return a simple object that can be used to create JSX in React components
        return {
          type: 'error-fallback',
          error: error.message,
          onRetry: resetError,
          componentName
        };
      }
    };
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export const withErrorHandling = {
  database: <T>(operation: () => Promise<T>, fallback: T, context?: Record<string, any>) =>
    errorHandler.handleDatabaseError(operation, fallback, context),

  cache: <T>(cacheOp: () => T | null, dbFallback: () => Promise<T>, context?: Record<string, any>) =>
    errorHandler.handleCacheError(cacheOp, dbFallback, context),

  network: <T>(operation: () => Promise<T>, fallback: T, retries?: number) =>
    errorHandler.handleNetworkError(operation, fallback, retries),

  component: (error: Error, componentName: string, props?: any) =>
    errorHandler.handleComponentError(error, componentName, props)
};