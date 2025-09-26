
import { supabase } from '@/db/supabase';

type LangType = 'es' | 'en' | 'de';

export interface CategoriesType {
    id: number;
    name: string;
    icon: string | React.JSX.Element;
}

export const getCategories = async (): Promise<Record<LangType, CategoriesType[]>> => {
    const { data, error } = await supabase
    .from('categories')
    .select(`id:category_id, name, icon`)

    if (error) return { es: [], en: [], de: [] }

    const langs: LangType[] = ['es', 'en', 'de'];
    const result = { es: [], en: [], de: [] } as Record<LangType, any[]>;


    data.forEach(category => {
        langs.forEach(lang => {
            result[lang].push({
                id: category.id,
                name: category.name?.[lang] ?? "",
                icon: category.icon
            })
        })
    })
    
    return result
}