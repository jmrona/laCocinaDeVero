type LangType = 'es' | 'en' | 'de';

export const getCategories = async (lan: LangType) => {
    const res = await import('../db/categories.json')

    if (!res) {
        throw new Error('Error loading categories')
    }


    const categories = res.default.reduce((
        acc: { id: number; name: string }[],
        category: { id: number; name: { [key: string]: string } }
    ) => {
        const categoryName = category.name[lan] || category.name['es'] || category.name['en'] || category.name['de'];
        if (categoryName) {
            return [
                ...acc,
                {
                    id: category.id,
                    name: categoryName
                }
            ];
        }
           
        return acc;
    }
    , []);

    console.log('categories: ', categories);
    return categories;
}

export interface CategoriesType {
    id: number;
    name: string;
}