import { supabase } from "@/db/supabase";

type LangType = 'es' | 'en' | 'de';

export interface BusinessInfo {
  phone: string;
  phoneLink: string;
  address: string;
  mapsUrl: string;
  instagramUrl: string;
  hours: {
    weekdaysLabel: string;
    weekdaysValue: string;
    weekendsLabel: string;
    weekendsValue: string;
    closedLabel: string;
    closedValue: string;
  };
  openingHoursSchema: string[];
}

/**
 * Phone, address, hours and social links, managed from the CMS.
 *
 * These used to be copy-pasted literals in the footer, the about page and
 * the SEO structured data, which is how the site ended up advertising that
 * it opened on Tuesdays while the footer said it was closed.
 *
 * Falls back to the last known-good values if the database is unreachable,
 * so a CMS outage can never blank out the restaurant's phone number.
 */
const FALLBACK: BusinessInfo = {
  phone: '+34 652 64 05 38',
  phoneLink: '+34652640538',
  address: 'Pórtico n1, Urb. Laguna Beach, Torrox Costa, Málaga',
  mapsUrl: 'https://maps.app.goo.gl/hFwAX95oncCDGKkJ7',
  instagramUrl: 'https://www.instagram.com/lacocinadevero_lagunabeach',
  hours: {
    weekdaysLabel: 'Lunes a viernes',
    weekdaysValue: '12:00 - 16:30',
    weekendsLabel: 'Sábados y domingos',
    weekendsValue: '12:00 - 16:30',
    closedLabel: 'Martes',
    closedValue: 'Cerrado',
  },
  openingHoursSchema: ['Mo 12:00-16:30', 'We-Su 12:00-16:30'],
};

export const getBusinessInfo = async (lang: LangType): Promise<BusinessInfo> => {
  const { data, error } = await supabase
    .from('cms_business_info')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching business info:', error?.message);
    return FALLBACK;
  }

  const pick = (field: any, fallback: string) => field?.[lang] ?? field?.es ?? fallback;

  return {
    phone: data.phone ?? FALLBACK.phone,
    phoneLink: data.phone_link ?? FALLBACK.phoneLink,
    address: data.address ?? FALLBACK.address,
    mapsUrl: data.maps_url ?? FALLBACK.mapsUrl,
    instagramUrl: data.instagram_url ?? FALLBACK.instagramUrl,
    hours: {
      weekdaysLabel: pick(data.hours_weekdays_label, FALLBACK.hours.weekdaysLabel),
      weekdaysValue: data.hours_weekdays_value ?? FALLBACK.hours.weekdaysValue,
      weekendsLabel: pick(data.hours_weekends_label, FALLBACK.hours.weekendsLabel),
      weekendsValue: data.hours_weekends_value ?? FALLBACK.hours.weekendsValue,
      closedLabel: pick(data.hours_closed_label, FALLBACK.hours.closedLabel),
      closedValue: pick(data.hours_closed_value, FALLBACK.hours.closedValue),
    },
    openingHoursSchema: data.opening_hours_schema ?? FALLBACK.openingHoursSchema,
  };
};
