import { supabase } from "@/db/supabase";
import { getCategories } from "./getCategories";

type LangType = 'es' | 'en' | 'de';

export interface Category {
  id: number;
  name: string;
  icon: string | React.JSX.Element;
}

export interface Dishes {
  id: number;
  name: string;
  description: string;
  ingredients: string;
  allergens: number[];
  price: number;
  categories: Category[];
  calories: number;
  image: string;
}

export const getDishesByLang = async (options?: { limit?: number, conditions?: string[], featuredOnly?: boolean }): Promise<Record<LangType, Dishes[]>> => {

  let query = supabase
    .from('cms_dishes')
    .select(`
      dish_id,
      name,
      price,
      image,
      categories:cms_dishes_categories_lnk(cms_categories(category_id, name)),
      allergens:cms_dishes_allergens_lnk(cms_allergens(allergen_id, name, icon))
    `);

  if (options?.featuredOnly) query = query.eq('featured', true);
  if (options?.limit) query = query.limit(options.limit);
  if (options?.conditions?.includes("image")) {
    query = query.not("image", "is", null).neq('image', '/img/placeholder-image.webp');
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error('Error fetching dishes:', error?.message);
    return { es: [], en: [], de: [] };
  }


  let excludeCategoryIds: number[] = [];
  // if (data.length) {
  //   const categories = await getCategories();
  //   excludeCategoryIds = categories?.['es']?.filter(cat => ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].includes(cat.name))
  //   .map(cat => cat.id) || [];
  // }


  const langs: LangType[] = ['es', 'en', 'de'];
  const result = { es: [], en: [], de: [] } as Record<LangType, any[]>;

  data
    .filter(dish => !dish.categories?.some?.(cat => excludeCategoryIds.includes(cat.category_id)))
    .forEach(dish => {
      langs.forEach(lang => {
        result[lang].push({
          id: dish.dish_id,
          name: dish.name?.[lang] ?? "",
          price: dish.price,
          image: dish.image,
          categories: dish.categories?.map?.(cat => ({
            id: cat.cms_categories?.category_id,
            name: cat.cms_categories?.name?.[lang] ?? ""
          })) ?? [],
          allergens: dish.allergens?.map?.(allergen => ({
              id: allergen.cms_allergens.allergen_id,
              name: allergen.cms_allergens.name?.[lang] ?? "",
              icon: allergen.cms_allergens.icon ?? ""
          })) ?? []
        });
      });
    });

  return result;
}