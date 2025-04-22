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
      customPages: [
        "https://lacocinadevero.es/es/menu",
        "https://lacocinadevero.es/en/menu",
        "https://lacocinadevero.es/de/menu",
      ]
  })],
});