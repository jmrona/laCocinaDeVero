import { supabase } from "@/db/supabase";

type LangType = 'es' | 'en' | 'de';

export interface Testimonial {
  id: number;
  author: string;
  quote: string;
}

/**
 * Customer reviews, managed from the CMS.
 * Returns an empty list on failure so the section simply disappears
 * rather than breaking the page.
 */
export const getTestimonials = async (lang: LangType): Promise<Testimonial[]> => {
  const { data, error } = await supabase
    .from('cms_testimonials')
    .select('id, author, quote, sort_order')
    .not('published_at', 'is', null)
    .order('sort_order', { ascending: true });

  if (error || !data) {
    console.error('Error fetching testimonials:', error?.message);
    return [];
  }

  return data.map(t => ({
    id: t.id,
    author: t.author,
    quote: t.quote?.[lang] ?? t.quote?.es ?? "",
  }));
};
