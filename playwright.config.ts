import { defineConfig, devices } from '@playwright/test';

/**
 * Standalone Playwright for full-page E2E.
 * Uses `astro dev` so API routes + server islands work with the Vercel adapter.
 */
export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 2 : undefined,
	reporter: 'list',
	use: {
		baseURL: 'http://127.0.0.1:4321',
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'npm run dev -- --host 127.0.0.1 --port 4321',
		url: 'http://127.0.0.1:4321/',
		timeout: 120_000,
		reuseExistingServer: !process.env.CI,
	},
});
