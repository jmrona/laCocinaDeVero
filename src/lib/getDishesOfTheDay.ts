import categories from "@/db/categories.json"
import dishes from "@/db/dishes.json"
console.log('dishes: ', dishes);

const DAY_CATEGORY = {
    0: ["Domingo", "Sunday", "Sonntag"],
    1: ["Lunes", "Monday", "Montag"],
    2: ["Martes", "Tuesday", "Dienstag"],
    3: ["Miércoles", "Wednesday", "Mittwoch"],
    4: ["Jueves", "Thursday", "Donnerstag"],
    5: ["Viernes", "Friday", "Freitag"],
    6: ["Sábado", "Saturday", "Samstag"],
} as const;

const WEEK_DAYS = {
    "es": ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"], 
    "en": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",], 
    "de": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
  } as const;

const today = new Date()
const dayOfWeek = today.getDay()


export const getDishesOfTheDay = async (lang: "es" | "en" | "de") => { 
    const day = WEEK_DAYS[lang][dayOfWeek]
    
    const categoryId = Object.values(DAY_CATEGORY).findIndex(category => category.some(cat => cat === day))
    
    if( categoryId === -1) return []
    const category = categories.find(category => category.id === categoryId)
    
    return dishes.filter(dish => dish.category.some(cat => cat === category?.id)).map(dish => ({
        ...dish,
        name: dish.name[lang],
        ingredients: dish.ingredients[lang],
        description: dish.description[lang]
    }))
}