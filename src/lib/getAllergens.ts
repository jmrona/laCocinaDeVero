import { supabase } from "@/db/supabase";

type LangType = 'es' | 'en' | 'de';

export const getAllergens = async (lang: LangType) => {
  const { data, error } = await supabase
  .from('cms_allergens')
  .select(`id:allergen_id, name, icon`)

  if (error) return []

  // Translations are optional in the CMS: fall back to Spanish.
  return data.map(allergen => ({
    id: allergen.id,
    name: (allergen.name as any)?.[lang] || (allergen.name as any)?.es || "",
    icon: allergen.icon,
  }))
}

export interface AllergensType {
  id: number;
  name: string;
  icon: string;
}