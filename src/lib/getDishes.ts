import { supabase } from "@/db/supabase";

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
  
  return data.map(dish => {
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


  const dishes = res.default.map((dish) => {
    return ({
      id: dish.id,
      name: dish.name[lang] || dish.name['es'] || dish.name['en'] || dish.name['de'],
      description: dish.description[lang] || dish.description['es'] || dish.description['en'] || dish.description['de'],
      ingredients: dish.ingredients[lang] || dish.ingredients['es'] || dish.ingredients['en'] || dish.ingredients['de'],
      allergens: dish.allergens,
      price: dish.price,
      category: dish.category,
      calories: dish.calories,
      image: dish.image,
    })
  })

  return dishes;
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