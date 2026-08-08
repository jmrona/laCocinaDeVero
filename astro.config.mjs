// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import svgr from "vite-plugin-svgr";
import minify from 'astro-minify-html-swc'


export default defineConfig({
  vite: {
    plugins: [tailwindcss(), svgr(), minify()],
  },
  i18n: {
    locales: ["es", "en", "de"],
    defaultLocale: "es",
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false
    }
  },
  site: "https://lacocinadevero.es",
  output: "static",
  adapter: vercel({
    // Pages that read the menu from Supabase are rendered on demand and then
    // cached, so edits made in the CMS show up without redeploying the site.
    // Kept short because the "menú del día" depends on the current weekday.
    isr: {
      expiration: 60 * 5,
      // The daily-menu endpoint is cheap and date-sensitive: always fresh.
      exclude: [/^\/api\/.+/],
    },
  }),
  integrations: [react(), sitemap({
    i18n: {
        defaultLocale: 'es',
        locales: {
          en: 'en',
          es: 'es',
          de: 'de',
        },
      },
  })],
});