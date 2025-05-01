import { supabase } from "@/db/supabase";

export async function GET({params, request}: { params: { lang: "es" | "en" | "de" }, request: Request }) {
    const lang = params.lang ?? "es"
    const WEEK_DAYS = {
        "es": ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"], 
        "en": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",], 
        "de": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
      } as const;
    
    const now = new Date()
    const dayOfWeek = now.getDay()
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
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const dishes = data.map(dish => {
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

    return new Response(JSON.stringify({ dishes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
}



