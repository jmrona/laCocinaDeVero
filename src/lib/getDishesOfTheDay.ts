import { supabase } from "@/db/supabase";

const WEEK_DAYS = {
    "es": ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"], 
    "en": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",], 
    "de": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
  } as const;

const today = new Date()
const dayOfWeek = today.getDay()

export const getDishesOfTheDay = async (lang: "es" | "en" | "de") => { 
    const today = WEEK_DAYS[lang][dayOfWeek]

    const { data: category, error: categoriesError } = await supabase
        .from('categories')
        .select('category_id')
        .in(`name->>${lang}`, [today]);
    
    if(categoriesError) return []
    const categoryId: number | undefined = category?.[0]?.category_id

      
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
      `)
      .in('dishes_categories.category_id', [categoryId]);

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

}