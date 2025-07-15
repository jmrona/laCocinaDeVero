
import { supabase } from '@/db/supabase';
import type { LangType, CategoriesType } from '@/types/menu';

// Re-export types for backward compatibility
export type { CategoriesType };

export const getCategories = async (lang: LangType) => {
    const { data, error } = await supabase
    .from('categories')
    .select(`id:category_id, name:name->>${lang}, icon`)

    if (error) return []
    
    return data
}