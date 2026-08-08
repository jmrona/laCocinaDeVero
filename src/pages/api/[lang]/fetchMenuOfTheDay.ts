export const prerender = false;

import { supabase } from "@/db/supabase";

type DishApiType = {
  id: number;
  name: string;
  price: number;
  image: string;
  categories: number[];
  allergens: number[];
};

type MenuOfTheDayResponse =
  | { dishes: DishApiType[] }
  | { error: string };

const SUPPORTED_LANGS = ["es", "en", "de"] as const;
type SupportedLang = typeof SUPPORTED_LANGS[number];

export async function GET({params, request}: { params: { lang: string }, request: Request }): Promise<Response> {
  if (!SUPPORTED_LANGS.includes(params.lang as SupportedLang)) {
    return new Response(JSON.stringify({ error: "Unsupported language" }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const lang = params.lang as SupportedLang;
  const WEEK_DAYS = {
    es: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
    en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    de: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
  } as const;

  const today = WEEK_DAYS[lang][new Date().getDay()];

  // Obtén el categoryId directamente
  const { data: category, error: catError } = await supabase
    .from('cms_categories')
    .select('id')
    .eq(`name->>${lang}`, today)
    .single();

  if (catError || !category) {
    return new Response(JSON.stringify({ dishes: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const categoryId = category.id;

  // Consulta optimizada de platos
  const { data, error } = await supabase
    .from('cms_dishes')
    .select(`
      dish_id,
      name,
      price,
      image,
      categories:cms_dishes_categories_lnk(cms_categories(category_id)),
      allergens:cms_dishes_allergens_lnk(cms_allergens(allergen_id))
    `)
    .eq('cms_dishes_categories_lnk.category_id', categoryId);

  if (error || !data) {
    console.error('Error fetching dishes of the day:', error?.message);
    return new Response(JSON.stringify({ error: "Could not fetch today's menu" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Evita mapeos innecesarios y usa tipado opcional
  const dishes = data.map(dish => ({
    id: dish.dish_id,
    // Translations are optional in the CMS: fall back to Spanish.
    name: (dish.name as any)?.[lang] || (dish.name as any)?.es || "",
    price: dish.price,
    image: dish.image,
    categories: dish.categories?.map?.(cat => cat.cms_categories?.category_id) ?? [],
    allergens: dish.allergens?.map?.(allergen => allergen.cms_allergens?.allergen_id) ?? []
  }));

  return new Response(JSON.stringify({ dishes }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}



