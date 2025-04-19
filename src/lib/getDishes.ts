type LangType = 'es' | 'en' | 'de';

export const getDishes = async (lang: LangType) => {
  const res = await import('../db/dishes.json')

  if (!res) {
      throw new Error('Error loading categories')
  }


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