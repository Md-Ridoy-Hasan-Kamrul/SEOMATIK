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
	server: {
		open: true,
	},
	vite: {
		plugins: [tailwindcss()],
		// React 19 + Vite dep-optimizer: force correct CJS interop for
		// react-dom/client (createRoot) and dedupe a single React copy.
		resolve: {
			dedupe: ['react', 'react-dom'],
		},
		optimizeDeps: {
			include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
		},
	},
});
