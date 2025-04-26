import { supabase } from "@/db/supabase";

type LangType = 'es' | 'en' | 'de';

export const getAllergens = async (lang: LangType) => {
  const { data, error } = await supabase
  .from('allergens')
  .select(`id:allergen_id, name:name->>${lang}, icon`)

  if (error) return []
  
  return data
}

export interface AllergensType {
  id: number;
  name: string;
  icon: string;
}