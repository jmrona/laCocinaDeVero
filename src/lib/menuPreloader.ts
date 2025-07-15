/**
 * Menu-specific preloader for faster navigation
 */

import { getMenuData } from './getMenuData';
import { menuCache, getCacheKey } from './cache';
import type { LangType } from '@/types/menu';

class MenuPreloader {
  private isPreloading = false;
  private preloadPromises = new Map<string, Promise<any>>();

  /**
   * Aggressively preload menu data on page load
   */
  async aggressivePreload(): Promise<void> {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    
    try {
      const currentLang = this.getCurrentLanguage();
      const allLanguages: LangType[] = ['es', 'en', 'de'];
      
      // Preload current language first (highest priority)
      if (currentLang) {
        await this.preloadLanguage(currentLang);
      }
      
      // Preload other languages in background
      const otherLanguages = allLanguages.filter(lang => lang !== currentLang);
      otherLanguages.forEach(lang => {
        // Don't await - run in background
        this.preloadLanguage(lang).catch(err => 
          console.warn(`Background preload failed for ${lang}:`, err)
        );
      });
      
    } catch (error) {
      console.warn('Aggressive preload failed:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Preload menu data for a specific language
   */
  private async preloadLanguage(lang: LangType): Promise<void> {
    const cacheKey = getCacheKey.menuData(lang);
    
    // Check if already cached
    if (menuCache.get(cacheKey)) {
      return;
    }
    
    // Check if already preloading
    if (this.preloadPromises.has(lang)) {
      return this.preloadPromises.get(lang);
    }
    
    const preloadPromise = this.performPreload(lang);
    this.preloadPromises.set(lang, preloadPromise);
    
    try {
      await preloadPromise;
    } finally {
      this.preloadPromises.delete(lang);
    }
  }

  /**
   * Perform the actual preload
   */
  private async performPreload(lang: LangType): Promise<void> {
    const startTime = performance.now();
    
    try {
      await getMenuData(lang);
      const endTime = performance.now();
      console.log(`🚀 Preloaded menu data for ${lang} in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      console.warn(`❌ Failed to preload menu data for ${lang}:`, error);
      throw error;
    }
  }

  /**
   * Get current language from DOM or URL
   */
  private getCurrentLanguage(): LangType | null {
    // Try to get from HTML lang attribute
    const htmlLang = document.documentElement.lang;
    if (htmlLang && ['es', 'en', 'de'].includes(htmlLang)) {
      return htmlLang as LangType;
    }
    
    // Try to get from URL
    const pathLang = window.location.pathname.match(/^\/(es|en|de)\//);
    if (pathLang) {
      return pathLang[1] as LangType;
    }
    
    // Default to Spanish
    return 'es';
  }

  /**
   * Setup event listeners for intelligent preloading
   */
  setupEventListeners(): void {
    // Preload on hover over menu links
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href*="/menu"]') as HTMLAnchorElement;
      
      if (link) {
        const lang = this.extractLangFromUrl(link.href);
        if (lang) {
          this.preloadLanguage(lang).catch(() => {});
        }
      }
    });

    // Preload on focus (keyboard navigation)
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'A' && (target as HTMLAnchorElement).href.includes('/menu')) {
        const lang = this.extractLangFromUrl((target as HTMLAnchorElement).href);
        if (lang) {
          this.preloadLanguage(lang).catch(() => {});
        }
      }
    });

    // Preload on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // User returned to tab - preload current language
        const currentLang = this.getCurrentLanguage();
        if (currentLang) {
          this.preloadLanguage(currentLang).catch(() => {});
        }
      }
    });
  }

  /**
   * Extract language from URL
   */
  private extractLangFromUrl(url: string): LangType | null {
    const match = url.match(/\/(es|en|de)\//);
    return match ? match[1] as LangType : null;
  }

  /**
   * Check if menu data is ready for a language
   */
  isMenuDataReady(lang: LangType): boolean {
    const cacheKey = getCacheKey.menuData(lang);
    return menuCache.get(cacheKey) !== null;
  }

  /**
   * Get preload statistics
   */
  getStats() {
    const languages: LangType[] = ['es', 'en', 'de'];
    const readyLanguages = languages.filter(lang => this.isMenuDataReady(lang));
    
    return {
      totalLanguages: languages.length,
      readyLanguages: readyLanguages.length,
      readyLanguagesList: readyLanguages,
      isPreloading: this.isPreloading,
      activePreloads: this.preloadPromises.size
    };
  }
}

// Create singleton instance
export const menuPreloader = new MenuPreloader();

// Auto-initialize on client side
if (typeof window !== 'undefined') {
  // Setup immediately
  menuPreloader.setupEventListeners();
  
  // Start aggressive preload after a short delay
  setTimeout(() => {
    menuPreloader.aggressivePreload().catch(err => 
      console.warn('Initial menu preload failed:', err)
    );
  }, 100);
  
  // Also preload on idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      menuPreloader.aggressivePreload().catch(() => {});
    });
  }
}

// Export convenience functions
export const preloadMenuForCurrentLanguage = () => {
  const currentLang = menuPreloader['getCurrentLanguage']();
  if (currentLang) {
    return menuPreloader['preloadLanguage'](currentLang);
  }
};

export const isMenuReady = (lang: LangType) => menuPreloader.isMenuDataReady(lang);
export const getPreloadStats = () => menuPreloader.getStats();