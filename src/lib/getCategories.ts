
import { supabase } from '@/db/supabase';

type LangType = 'es' | 'en' | 'de';

export interface CategoriesType {
    id: number;
    name: string;
    icon: string | React.JSX.Element;
}

export const getCategories = async (lang: LangType) => {
    const { data, error } = await supabase
    .from('categories')
    .select(`id:category_id, name:name->>${lang}, icon`)

    if (error) return []
    
    return data
}