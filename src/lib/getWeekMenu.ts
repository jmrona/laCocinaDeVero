import { supabase } from "@/db/supabase"


export const getWeekMenu = async (lang: "es" | "en" | "de") => { 
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
      .in('dishes_categories.categories.name->>es', ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]);

    if (error) {
      console.error('Error fetching dishes:', error.message);
      return [];
    }

      
    const groupedByDay = data.reduce<Record<string, string[]>>((acc, item) => {
        const categoriesName: string[] = item.categories.map(cat => cat.categories.name)

        categoriesName.forEach(category => {
           
            if(Object.keys(acc).includes(category)){
                acc[category].push(item.name)
            } else {
                acc[category] = [item.name]
            }
        })

        return acc;
    }, {})

    return groupedByDay;
}