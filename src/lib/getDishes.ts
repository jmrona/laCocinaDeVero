import { supabase } from "@/db/supabase";
import { getCategories } from "./getCategories";

type LangType = 'es' | 'en' | 'de';

export const getDishes = async (lang: LangType, options?: { limit?: number, conditions?: string[] }) => {

  let query = supabase
    .from('dishes')
    .select(`
      dish_id,
      name:name->>${lang},
      price,
      image,
      categories:dishes_categories(category_id, categories(name:name->>${lang})),
      allergens:dishes_allergens(allergen_id)
    `);

  if (options?.limit) query = query.limit(options.limit);
  if (options?.conditions?.includes("image")) {
    query = query.not("image", "is", null).neq('image', '/img/placeholder-image.webp');
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error('Error fetching dishes:', error?.message);
    return [];
  }

  // Solo llamamos a getCategories si hay data
  let excludeCategoryIds: number[] = [];
  if (data.length) {
    const categories = await getCategories("es");
    excludeCategoryIds = categories
      .filter(cat => ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].includes(cat.name))
      .map(cat => cat.id);
  }

  return data
    .filter(dish => !dish.categories?.some?.(cat => excludeCategoryIds.includes(cat.category_id)))
    .map(dish => ({
      id: dish.dish_id,
      name: dish.name,
      price: dish.price,
      image: dish.image,
      categories: dish.categories?.map?.(cat => cat.category_id) ?? [],
      allergens: dish.allergens?.map?.(allergen => allergen.allergen_id) ?? []
    }));
}

export interface DishesType {
  id: number;
  name: string;
  description: string;
  ingredients: string;
  allergens: number[];
  price: number;
  category: number[];
  calories: number;
  image: string;
}