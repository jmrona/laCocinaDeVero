type LangType = 'es' | 'en' | 'de';

export interface CategoriesType {
    id: number;
    name: string;
    icon: string | React.JSX.Element;
}

export const getCategories = async (lan: LangType) => {
    const res = await import('../db/categories.json')

    if (!res) {
        throw new Error('Error loading categories')
    }


    const categories = res.default.reduce((
        acc: { id: number; name: string }[],
        category: { id: number; name: { [key: string]: string }, icon?: string | React.JSX.Element }
    ) => {
        const categoryName = category.name[lan] || category.name['es'] || category.name['en'] || category.name['de'];
        if (categoryName) {
            return [
                ...acc,
                {
                    id: category.id,
                    name: categoryName,
                    icon: "icon" in category ? category.icon : ""
                }
            ];
        }
           
        return acc;
    }
    , []);

    return categories;
}

