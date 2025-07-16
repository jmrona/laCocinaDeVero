import { supabase } from "@/db/supabase"

const DAYS_ORDER = {
  "es": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"], 
  "en": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",],
  "de": ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
}


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

      
    const dishesPerDay = data.reduce<Record<string, string[]>>((acc, item) => {
        const categoriesName: string[] = item.categories.map(cat => cat.name)

        categoriesName.forEach(category => {
            if(Object.keys(acc).includes(category)){
                acc[category].push(item.name)
            } else {
                acc[category] = [item.name]
            }
        })

        return acc;
    }, {})

    const dishesPerDaySorted: Record<string, string[]> = {}

    DAYS_ORDER[lang].forEach(day => {
        dishesPerDaySorted[day] = dishesPerDay[day]
    })

    return dishesPerDaySorted;
}