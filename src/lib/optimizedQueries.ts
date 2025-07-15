import { supabase } from "@/db/supabase";
import type { LangType } from "@/types/menu";

/**
 * Optimized database queries for menu data
 * These queries are designed for maximum performance with minimal data transfer
 */

/**
 * Get categories with optimized field selection
 */
export const getCategoriesOptimized = async (lang: LangType) => {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      category_id,
      name,
      icon
    `)
    .order('category_id');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data?.map(cat => ({
    id: cat.category_id,
    name: cat.name?.[lang] || cat.name?.es || '',
    icon: cat.icon
  })) || [];
};

/**
 * Get all dishes with their relationships in a single optimized query
 * Uses efficient JOINs and only selects necessary fields
 */
export const getDishesOptimized = async (lang: LangType) => {
  const { data, error } = await supabase
    .from('dishes')
    .select(`
      dish_id,
      name,
      price,
      image,
      dishes_categories!left(category_id),
      dishes_allergens!left(allergen_id)
    `)
    .order('dish_id');

  if (error) {
    console.error('Error fetching dishes:', error);
    return [];
  }

  return data?.map(dish => ({
    id: dish.dish_id,
    name: dish.name?.[lang] || dish.name?.es || '',
    price: dish.price,
    image: dish.image,
    categories: dish.dishes_categories?.map(dc => dc.category_id) || [],
    allergens: dish.dishes_allergens?.map(da => da.allergen_id) || []
  })) || [];
};

/**
 * Get dishes for specific categories (used for daily menus)
 * More efficient than filtering in application layer
 */
export const getDishesByCategoriesOptimized = async (lang: LangType, categoryIds: number[]) => {
  if (categoryIds.length === 0) return [];

  const { data, error } = await supabase
    .from('dishes')
    .select(`
      dish_id,
      name,
      price,
      image,
      dishes_categories!inner(category_id),
      dishes_allergens!left(allergen_id)
    `)
    .in('dishes_categories.category_id', categoryIds)
    .order('dish_id');

  if (error) {
    console.error('Error fetching dishes by categories:', error);
    return [];
  }

  return data?.map(dish => ({
    id: dish.dish_id,
    name: dish.name?.[lang] || dish.name?.es || '',
    price: dish.price,
    image: dish.image,
    categories: dish.dishes_categories?.map(dc => dc.category_id) || [],
    allergens: dish.dishes_allergens?.map(da => da.allergen_id) || []
  })) || [];
};

/**
 * Get regular menu dishes (excluding daily specials)
 * Filters at database level for better performance
 */
export const getRegularDishesOptimized = async (lang: LangType, excludeCategoryIds: number[]) => {
  if (excludeCategoryIds.length === 0) {
    // If no categories to exclude, get all dishes
    return getDishesOptimized(lang);
  }

  const { data, error } = await supabase
    .from('dishes')
    .select(`
      dish_id,
      name,
      price,
      image,
      dishes_categories!left(category_id),
      dishes_allergens!left(allergen_id)
    `)
    .not('dishes_categories.category_id', 'in', `(${excludeCategoryIds.join(',')})`)
    .order('dish_id');

  if (error) {
    console.error('Error fetching regular dishes:', error);
    return [];
  }

  return data?.map(dish => ({
    id: dish.dish_id,
    name: dish.name?.[lang] || dish.name?.es || '',
    price: dish.price,
    image: dish.image,
    categories: dish.dishes_categories?.map(dc => dc.category_id) || [],
    allergens: dish.dishes_allergens?.map(da => da.allergen_id) || []
  })) || [];
};

/**
 * Get dish names for weekly menu (optimized for minimal data transfer)
 */
export const getDishNamesForWeeklyMenu = async (lang: LangType, categoryIds: number[]) => {
  if (categoryIds.length === 0) return [];

  const { data, error } = await supabase
    .from('dishes')
    .select(`
      name,
      dishes_categories!inner(category_id)
    `)
    .in('dishes_categories.category_id', categoryIds);

  if (error) {
    console.error('Error fetching dish names for weekly menu:', error);
    return [];
  }

  return data?.map(dish => ({
    name: dish.name?.[lang] || dish.name?.es || '',
    categoryId: dish.dishes_categories?.[0]?.category_id
  })) || [];
};

/**
 * Performance monitoring for queries
 */
export const queryPerformanceMonitor = {
  async measureQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Query "${queryName}" took ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`Query "${queryName}" failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }
};