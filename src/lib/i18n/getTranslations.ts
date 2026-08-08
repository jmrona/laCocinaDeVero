import { supabase } from "@/db/supabase";
import { ui } from './ui';

type LangType = 'es' | 'en' | 'de';

/**
 * Maps the CMS "Site copy" fields onto the flat dot-notation keys the
 * components already use, so `t("hero.title")` keeps working unchanged.
 */
const KEY_MAP: Record<string, Record<string, string>> = {
  nav: {
    menu: 'nav.menu',
    about: 'nav.about',
    contact: 'nav.contact',
  },
  hero: {
    title: 'hero.title',
    subtitle: 'hero.subtitle',
  },
  why_choose_us: {
    title: 'whyChooseUs.title',
    subtitle: 'whyChooseUs.subtitle',
    description: 'whyChooseUs.description',
    freshIngredients: 'whyChooseUs.freshIngredients',
    freshIngredientsDescription: 'whyChooseUs.freshIngredients.description',
    dailyPrepared: 'whyChooseUs.dailyPrepared',
    dailyPreparedDescription: 'whyChooseUs.dailyPrepared.description',
    readyToTakeAway: 'whyChooseUs.readyToTakeAway',
    readyToTakeAwayDescription: 'whyChooseUs.readyToTakeAway.description',
  },
  our_dishes: {
    title: 'ourDishes.title',
    description: 'ourDishes.description',
    allergens: 'ourDishes.allergens',
    loadMore: 'ourDishes.loadMore',
  },
  how_it_works: {
    title: 'howItWorks.title',
    description: 'howItWorks.description',
    chooseYourMeal: 'howItWorks.chooseYourMeal',
    chooseYourMealDescription: 'howItWorks.chooseYourMeal.description',
    placeYourOrder: 'howItWorks.placeYourOrder',
    placeYourOrderDescription: 'howItWorks.placeYourOrder.description',
    enjoyYourMeal: 'howItWorks.enjoyYourMeal',
    enjoyYourMealDescription: 'howItWorks.enjoyYourMeal.description',
  },
  testimonials_section: {
    title: 'testimonials.title',
    description: 'testimonials.description',
  },
  cta: {
    title: 'cta.title',
    subtitle: 'cta.subtitle',
    viewMenu: 'cta.viewMenu',
    getDirections: 'cta.getDirections',
  },
  footer: {
    description: 'footer.description',
    menu: 'footer.menu',
    contact: 'footer.contact',
    hours: 'footer.hours',
  },
  menu_page: {
    specialMenu: 'menu.specialMenu',
    categories: 'menu.categories',
    allergens: 'menu.allergens',
    seeSpecialMenu: 'menu.seeSpecialMenu',
  },
  about_page: {
    title: 'about.title',
    experience: 'about.experience',
    contact: 'about.contact',
    telephone: 'about.telephone',
    address: 'about.address',
  },
  misc: {
    modalClose: 'modal.close',
    allergensTitle: 'allergens.title',
  },
};

// The pages themselves are cached by ISR, so this only guards against
// re-querying once per component within a single render.
const CACHE_TTL_MS = 30_000;
let cache: { data: Record<string, any> | null; at: number } | null = null;

const fetchSiteCopy = async (): Promise<Record<string, any> | null> => {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;

  const { data, error } = await supabase
    .from('cms_site_copy')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching site copy:', error.message);
    cache = { data: null, at: Date.now() };
    return null;
  }

  cache = { data, at: Date.now() };
  return data;
};

/**
 * Flattens the CMS record into `{ "hero.title": "…" }` for one language.
 * Anything missing simply isn't included, so the ui.ts default wins.
 */
const flatten = (row: Record<string, any> | null, lang: LangType) => {
  const out: Record<string, string> = {};
  if (!row) return out;

  for (const [field, subkeys] of Object.entries(KEY_MAP)) {
    const section = row[field]?.[lang];
    if (!section) continue;
    for (const [subkey, uiKey] of Object.entries(subkeys)) {
      const value = section[subkey];
      if (typeof value === 'string' && value.trim() !== '') out[uiKey] = value;
    }
  }
  return out;
};

/**
 * Same shape as useTranslations, but text edited in the CMS takes priority.
 * The bundled ui.ts strings stay as the fallback, so the site still renders
 * correctly if the CMS is empty or unreachable.
 */
export const getTranslations = async (lang: LangType = 'es') => {
  const row = await fetchSiteCopy();
  const overrides = flatten(row, lang);

  return function t(key: string): string {
    return overrides[key] ?? (ui[lang] as any)?.[key] ?? (ui.es as any)?.[key] ?? '';
  };
};
