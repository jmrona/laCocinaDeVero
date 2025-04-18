// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  i18n: {
    locales: ["es", "en", "de"],
    defaultLocale: "es"
  },
  site: "https://lacocinadevero.es",
  output: "server",
  adapter: vercel(),
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