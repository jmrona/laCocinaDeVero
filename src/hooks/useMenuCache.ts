import { useEffect, useState } from 'react';
import { menuCache, getCacheKey } from '@/lib/cache';
import { invalidateCache, cacheMonitor } from '@/lib/cacheUtils';
import type { LangType, MenuData } from '@/types/menu';

/**
 * React hook for menu cache management
 */
export const useMenuCache = (lang: LangType) => {
  const [cacheStats, setCacheStats] = useState(cacheMonitor.getStats());

  // Update cache stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(cacheMonitor.getStats());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    // Cache statistics
    stats: cacheStats,
    
    // Cache operations
    invalidate: () => invalidateCache.menuData(lang),
    invalidateAll: invalidateCache.allMenuData,
    clearAll: invalidateCache.all,
    
    // Cache inspection
    getCachedData: () => menuCache.get<MenuData>(getCacheKey.menuData(lang)),
    isCached: () => menuCache.get<MenuData>(getCacheKey.menuData(lang)) !== null,
    
    // Health check
    isHealthy: cacheMonitor.isHealthy()
  };
};

/**
 * Hook for cache debugging in development
 */
export const useMenuCacheDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    enabled: process.env.NODE_ENV === 'development',
    stats: cacheMonitor.getStats()
  });

  useEffect(() => {
    if (!debugInfo.enabled) return;

    const interval = setInterval(() => {
      setDebugInfo(prev => ({
        ...prev,
        stats: cacheMonitor.getStats()
      }));
    }, 5000); // Update every 5 seconds in debug mode

    return () => clearInterval(interval);
  }, [debugInfo.enabled]);

  return debugInfo;
};