import { supabase } from "@/db/supabase";
import { getCategories } from "./getCategories";

type LangType = 'es' | 'en' | 'de';

export const getDishes = async (lang: LangType) => {
  const { data, error } = await supabase
  .from('dishes')
  .select(`
    dish_id,
    name:name->>${lang},
    price,
    image,
    dishes_categories!inner(
      categories!inner(
        name, category_id
      )
    ),
    categories:dishes_categories( category_id, categories( name:name->>${lang} )),
    allergens:dishes_allergens( allergen_id )
  `);
  
  if (error) {
    console.error('Error fetching dishes:', error.message);
    return [];
  }

  const categories = await getCategories("es")
  const categoriesIds: number[] = categories
  .filter(cat => ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].includes(cat.name))
  .map(cat => cat.id)

  return data
    .filter(dish => !dish.categories.some(cat => categoriesIds.includes(cat.category_id)))
    .map(dish => {
      const categories = dish.categories.map(cat => cat.category_id)
      const allergens = dish.allergens.map(allergen => allergen.allergen_id)

      return {
          id: dish.dish_id,
          name: dish.name,
          price: dish.price,
          image: dish.image,
          categories,
          allergens
      }
    });
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