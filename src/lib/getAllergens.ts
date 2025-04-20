type LangType = 'es' | 'en' | 'de';

export const getAllergens = async (lang: LangType) => {
  const res = await import('../db/allergens.json')

  if (!res) {
      throw new Error('Error loading categories')
  }


  const allergens = res.default.map((dish) => {
    return ({
      id: dish.id,
      name: dish.name[lang] || dish.name['es'] || dish.name['en'] || dish.name['de'],
    })
  })

  return allergens;
}

export interface AllergensType {
  id: number;
  name: string;
}