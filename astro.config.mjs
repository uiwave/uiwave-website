// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL ?? 'http://localhost:4321',

  output: 'server',

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: node({
    mode: 'standalone',
  }),

  integrations: [mdx(), sitemap({
    filter: (page) => {
      const privatePrefixes = [
        '/dashboard',
        '/playground',
        '/exercises',
        '/exams',
        '/profile',
        '/progress',
        '/certificates',
        '/api',
      ];
      return !privatePrefixes.some((prefix) => page.startsWith(prefix));
    },
  })],
});