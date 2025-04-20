type LangType = 'es' | 'en' | 'de';

export const getAllergens = async (lang: LangType) => {
  const res = await import('../db/allergens.json')

  if (!res) {
      throw new Error('Error loading categories')
  }


  const allergens = res.default.map((allergen) => {
    return ({
      id: allergen.id,
      name: allergen.name[lang] || allergen.name['es'] || allergen.name['en'] || allergen.name['de'],
      icon: allergen.icon
    })
  })

  return allergens;
}

export interface AllergensType {
  id: number;
  name: string;
  icon: string;
}