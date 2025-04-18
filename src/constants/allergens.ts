import {Wheat, Egg, Fish, Milk, Shell, Nut} from "@lucide/astro"


export const ALLERGENS = {
    "gluten": Wheat,
    "egg": Egg,
    "fish": Fish,
    "milk": Milk,
    "mollusc": Shell,
    "nuts": Nut,
} as const;