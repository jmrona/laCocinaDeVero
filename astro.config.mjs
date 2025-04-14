// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";


import vercel from "@astrojs/vercel";


export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  i18n: {
    locales: ["es", "en", "de"],
    defaultLocale: "es"
  },
  output: "server",
  adapter: vercel(),
});