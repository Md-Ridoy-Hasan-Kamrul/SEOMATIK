// @ts-check
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, memoryCache } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://seomatik.example.com',
	adapter: vercel(),
	integrations: [react(), sitemap()],
	cache: {
		provider: memoryCache(),
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
