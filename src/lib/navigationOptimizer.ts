/**
 * Navigation optimization utilities for faster page transitions
 */

import { getMenuData } from './getMenuData';
import { warmCache } from './cacheUtils';
import type { LangType } from '@/types/menu';

class NavigationOptimizer {
  private preloadedRoutes = new Set<string>();
  private isPreloading = false;

  /**
   * Preload menu data for faster navigation
   */
  async preloadMenuData(lang: LangType): Promise<void> {
    const cacheKey = `menu_${lang}`;

    if (this.preloadedRoutes.has(cacheKey) || this.isPreloading) {
      return;
    }

    this.isPreloading = true;

    try {
      console.log(`🚀 Preloading menu data for ${lang}`);
      const startTime = performance.now();

      await getMenuData(lang);

      const endTime = performance.now();
      console.log(`✅ Menu data preloaded for ${lang} in ${(endTime - startTime).toFixed(2)}ms`);

      this.preloadedRoutes.add(cacheKey);
    } catch (error) {
      console.warn(`⚠️ Failed to preload menu data for ${lang}:`, error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Preload data for all languages
   */
  async preloadAllLanguages(): Promise<void> {
    const languages: LangType[] = ['es', 'en', 'de'];

    try {
      await Promise.all(
        languages.map(lang => this.preloadMenuData(lang))
      );
      console.log('🎉 All menu data preloaded successfully');
    } catch (error) {
      console.warn('⚠️ Some menu data failed to preload:', error);
    }
  }

  /**
   * Setup intelligent preloading based on user behavior
   */
  setupIntelligentPreloading(): void {
    if (typeof window === 'undefined') return;

    // Preload on hover over menu links
    const menuLinks = document.querySelectorAll('a[href*="/menu"]');
    menuLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        const href = (link as HTMLAnchorElement).href;
        const lang = this.extractLanguageFromUrl(href);
        if (lang) {
          this.preloadMenuData(lang);
        }
      }, { once: true });
    });

    // Preload on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const currentLang = document.documentElement.lang as LangType;
        if (currentLang) {
          this.preloadMenuData(currentLang);
        }
      });
    }

    // Preload on page visibility change (when user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const currentLang = document.documentElement.lang as LangType;
        if (currentLang) {
          this.preloadMenuData(currentLang);
        }
      }
    });
  }

  /**
   * Extract language from URL
   */
  private extractLanguageFromUrl(url: string): LangType | null {
    const match = url.match(/\/(es|en|de)\//);
    return match ? match[1] as LangType : null;
  }

  /**
   * Clear preload cache
   */
  clearPreloadCache(): void {
    this.preloadedRoutes.clear();
    console.log('🧹 Preload cache cleared');
  }

  /**
   * Get preload statistics
   */
  getStats() {
    return {
      preloadedRoutes: Array.from(this.preloadedRoutes),
      isPreloading: this.isPreloading,
      totalPreloaded: this.preloadedRoutes.size
    };
  }
}

// Export singleton instance
export const navigationOptimizer = new NavigationOptimizer();

// Convenience functions
export const preloadMenuData = (lang: LangType) => navigationOptimizer.preloadMenuData(lang);
export const setupIntelligentPreloading = () => navigationOptimizer.setupIntelligentPreloading();
export const preloadAllLanguages = () => navigationOptimizer.preloadAllLanguages();

// Auto-setup on client-side
if (typeof window !== 'undefined') {
  // Setup after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupIntelligentPreloading);
  } else {
    setupIntelligentPreloading();
  }
}