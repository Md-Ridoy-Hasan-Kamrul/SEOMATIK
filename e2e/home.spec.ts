import { expect, test } from '@playwright/test';

/** Asserts copy from `src/pages/index.astro` (hero `<h1>` + Layout title). */
test('landing page loads', async ({ page }) => {
	await page.goto('/');

	await expect(page).toHaveTitle(/Seomatik/);
	await expect(
		page.getByRole('heading', { name: /Your animated site starts here/i }),
	).toBeVisible();
});
