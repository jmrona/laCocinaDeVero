
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

export async function GET({params, request}: { params: { lang: "es" | "en" | "de" }, request: Request }): Promise<Response> {
  const lang = params.lang ?? "es";
  const WEEK_DAYS = {
    es: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
    en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    de: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
  } as const;

  const today = WEEK_DAYS[lang][new Date().getDay()];

  // Obtén el categoryId directamente
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('category_id')
    .eq(`name->>${lang}`, today)
    .single();

  if (catError || !category) {
    return new Response(JSON.stringify({ dishes: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const categoryId = category.category_id;

  // Consulta optimizada de platos
  const { data, error } = await supabase
    .from('dishes')
    .select(`
      dish_id,
      name:name->>${lang},
      price,
      image,
      categories:dishes_categories(category_id),
      allergens:dishes_allergens(allergen_id)
    `)
    .eq('dishes_categories.category_id', categoryId);

  if (error || !data) {
    return new Response(JSON.stringify({ error: error?.message ?? "No data" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Evita mapeos innecesarios y usa tipado opcional
  const dishes = data.map(dish => ({
    id: dish.dish_id,
    name: dish.name,
    price: dish.price,
    image: dish.image,
    categories: dish.categories?.map?.(cat => cat.category_id) ?? [],
    allergens: dish.allergens?.map?.(allergen => allergen.allergen_id) ?? []
  }));

  return new Response(JSON.stringify({ dishes }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}



