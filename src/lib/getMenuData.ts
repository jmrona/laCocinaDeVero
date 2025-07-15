import { supabase } from "@/db/supabase";
import type { LangType, CategoriesType, DishesType, MenuData } from "@/types/menu";
import { menuCache, CACHE_CONFIG, getCacheKey } from "./cache";
import {
  getCategoriesOptimized,
  getDishesOptimized,
  getDishNamesForWeeklyMenu,
  queryPerformanceMonitor
} from "./optimizedQueries";
import { menuPerformanceHelpers } from "./performanceMonitor";
import { withErrorHandling, ErrorType, MenuError } from "./errorHandler";

const DAYS_ORDER = {
  "es": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
  "en": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  "de": ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
};

const WEEK_DAYS = {
  "es": ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
  "en": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  "de": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
};

/**
 * Consolidated function to fetch all menu-related data in optimized queries
 * Replaces getCategories, getDishes, getDishesOfTheDay, and getWeekMenu
 */
export const getMenuData = async (lang: LangType): Promise<MenuData> => {
  // Start performance monitoring
  const performanceId = menuPerformanceHelpers.measureDataFetch(lang);

  try {
    // Check cache first with error handling
    const cacheKey = getCacheKey.menuData(lang);

    const cachedData = await withErrorHandling.cache(
      () => menuCache.get<MenuData>(cacheKey),
      async () => {
        console.log(`Cache miss for menu data (${lang}), fetching from database`);

        // Execute both main queries in parallel for optimal performance
        const [categories, allDishes] = await Promise.all([
          queryPerformanceMonitor.measureQuery('categories', () => getCategoriesOptimized(lang)),
          queryPerformanceMonitor.measureQuery('dishes', () => getDishesOptimized(lang))
        ]);

        return { categories, allDishes };
      },
      { language: lang, operation: 'getMenuData' }
    );

    if (cachedData && 'categories' in cachedData && 'dishes' in cachedData) {
      console.log(`Cache hit for menu data (${lang})`);
      menuPerformanceHelpers.endMeasure(performanceId);
      return cachedData as MenuData;
    }

    // If we get here, we have fresh data from database
    const { categories, allDishes } = cachedData as { categories: any[], allDishes: any[] };

    // Get day category IDs for filtering
    const dayCategories = categories.filter(cat =>
      DAYS_ORDER[lang].includes(cat.name)
    );
    const dayCategoryIds = dayCategories.map(cat => cat.id);

    // Filter regular dishes (exclude daily menu items)
    const dishes = allDishes.filter(dish =>
      !dish.categories.some(catId => dayCategoryIds.includes(catId))
    );

    // Get today's menu items
    const now = new Date();
    const dayOfWeek = now.getDay();
    const today = WEEK_DAYS[lang][dayOfWeek];
    const todayCategory = categories.find(cat => cat.name === today);

    const menuOfTheDay = todayCategory
      ? allDishes.filter(dish => dish.categories.includes(todayCategory.id))
      : [];
      
    // Build week menu
    const weekMenu: Record<string, string[]> = {};
    DAYS_ORDER[lang].forEach(day => {
      const dayCategory = categories.find(cat => cat.name === day);
      if (dayCategory) {
        weekMenu[day] = allDishes
          .filter(dish => dish.categories.includes(dayCategory.id))
          .map(dish => dish.name);
      } else {
        weekMenu[day] = [];
      }
    });

    const menuData: MenuData = {
      categories,
      dishes,
      menuOfTheDay,
      weekMenu
    };

    // Cache the result for future requests
    menuCache.set(cacheKey, menuData, CACHE_CONFIG.MENU_DATA_TTL);
    console.log(`Menu data cached for ${lang} with TTL: ${CACHE_CONFIG.MENU_DATA_TTL}ms`);

    // End performance monitoring
    menuPerformanceHelpers.endMeasure(performanceId);

    return menuData;

  } catch (error) {
    // Record error with performance monitoring
    menuPerformanceHelpers.recordMenuError('data-fetch', error as Error, { language: lang });
    menuPerformanceHelpers.endMeasure(performanceId);

    console.error('Error fetching menu data:', error);

    // Return fallback data structure for graceful degradation
    return {
      categories: [],
      dishes: [],
      menuOfTheDay: [],
      weekMenu: {}
    };
  }
};