import categories from "@/db/categories.json"
import dishes from "@/db/dishes.json"
import type { DishesType } from "./getDishes"

export const getWeekMenu = (lang: "es" | "en" | "de") => {
    const menuGroupedByCategory = {} as Record<string, DishesType[]>
    categories.slice(0,7).forEach((category) => {
        const foods = dishes.filter(dish => dish.category.some(cat => cat === Number(category.id)))
        const key = category.name[lang];

        return menuGroupedByCategory[key] = foods.map(food => ({
            ...food,
            name: food.name[lang],
            ingredients: food.ingredients[lang],
            description: food.description[lang]
        }))
    })

    return menuGroupedByCategory
}