/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

/**
 * Vite-native unit/component tests (Astro Container API).
 * Full-page E2E stays in Playwright — do not expand Vitest into page E2E.
 */
export default getViteConfig({
	test: {
		name: 'unit',
		include: ['src/**/*.{test,spec}.{ts,js}'],
		environment: 'node',
		pool: 'threads',
		isolate: true,
		clearMocks: true,
		restoreMocks: true,
		// Bound workers in CI; leave undefined locally for watch-friendly feedback.
		maxWorkers: process.env.CI ? 2 : undefined,
	},
});
