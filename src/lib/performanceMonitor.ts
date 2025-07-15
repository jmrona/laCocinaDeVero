/**
 * Performance monitoring utilities for menu page optimization
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface ErrorMetric {
  name: string;
  error: Error;
  timestamp: number;
  context?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorMetric[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = typeof window !== 'undefined' && 'performance' in window;
  }

  /**
   * Start measuring a performance metric
   */
  startMeasure(name: string, metadata?: Record<string, any>): string {
    if (!this.isEnabled) return name;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    this.metrics.push(metric);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 Started measuring: ${name}`);
    }

    return name;
  }

  /**
   * End measuring a performance metric
   */
  endMeasure(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.find(m => m.name === name && !m.endTime);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found or already ended`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Completed measuring: ${name} - ${metric.duration.toFixed(2)}ms`);
    }

    // Log slow operations
    if (metric.duration > 1000) {
      console.warn(`⚠️ Slow operation detected: ${name} took ${metric.duration.toFixed(2)}ms`);
    }

    return metric.duration;
  }

  /**
   * Measure an async operation
   */
  async measureAsync<T>(name: string, operation: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.startMeasure(name, metadata);
    
    try {
      const result = await operation();
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      this.recordError(name, error as Error, metadata);
      throw error;
    }
  }

  /**
   * Record an error with context
   */
  recordError(name: string, error: Error, context?: Record<string, any>): void {
    const errorMetric: ErrorMetric = {
      name,
      error,
      timestamp: Date.now(),
      context
    };

    this.errors.push(errorMetric);

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ Error in ${name}:`, error, context);
    }

    // In production, you might want to send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorToService(errorMetric);
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    const completedMetrics = this.metrics.filter(m => m.duration !== undefined);
    
    return {
      totalMeasurements: completedMetrics.length,
      averageDuration: completedMetrics.length > 0 
        ? completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / completedMetrics.length 
        : 0,
      slowestOperation: completedMetrics.reduce((slowest, current) => 
        (current.duration || 0) > (slowest.duration || 0) ? current : slowest, 
        completedMetrics[0]
      ),
      fastestOperation: completedMetrics.reduce((fastest, current) => 
        (current.duration || 0) < (fastest.duration || 0) ? current : fastest, 
        completedMetrics[0]
      ),
      errorCount: this.errors.length,
      recentErrors: this.errors.slice(-5)
    };
  }

  /**
   * Get Core Web Vitals if available
   */
  getCoreWebVitals(): Promise<any> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(null);
        return;
      }

      // Try to get web-vitals library metrics
      try {
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          const vitals: any = {};

          getCLS((metric) => vitals.cls = metric);
          getFID((metric) => vitals.fid = metric);
          getFCP((metric) => vitals.fcp = metric);
          getLCP((metric) => vitals.lcp = metric);
          getTTFB((metric) => vitals.ttfb = metric);

          setTimeout(() => resolve(vitals), 100);
        }).catch(() => resolve(null));
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clear(): void {
    this.metrics = [];
    this.errors = [];
  }

  /**
   * Send error to external service (placeholder)
   */
  private sendErrorToService(errorMetric: ErrorMetric): void {
    // Placeholder for error tracking service integration
    // Could integrate with Sentry, LogRocket, etc.
    console.log('Would send error to tracking service:', errorMetric);
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const measurePageLoad = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      totalPageLoad: navigation.loadEventEnd - navigation.fetchStart,
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnection: navigation.connectEnd - navigation.connectStart,
      serverResponse: navigation.responseEnd - navigation.requestStart
    };

    console.log('📊 Page Load Metrics:', metrics);
  });
};

// Menu-specific performance helpers
export const menuPerformanceHelpers = {
  measureDataFetch: (lang: string) => 
    performanceMonitor.startMeasure(`menu-data-fetch-${lang}`, { language: lang }),
  
  measureComponentRender: (componentName: string) =>
    performanceMonitor.startMeasure(`component-render-${componentName}`, { component: componentName }),
  
  measureCacheOperation: (operation: string, key: string) =>
    performanceMonitor.startMeasure(`cache-${operation}`, { key, operation }),

  endMeasure: (name: string) => performanceMonitor.endMeasure(name),

  recordMenuError: (operation: string, error: Error, context?: Record<string, any>) =>
    performanceMonitor.recordError(`menu-${operation}`, error, context)
};