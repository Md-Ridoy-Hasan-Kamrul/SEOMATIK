import { expect, test } from '@playwright/test';

/** Asserts the SEOMATIK hero intro (`HeroIntro` island) + Layout title. */
test('landing page loads', async ({ page }) => {
	await page.goto('/');

	await expect(page).toHaveTitle(/SEOMATIK/i);
	await expect(page.getByRole('heading', { name: /SEOMATIK/i })).toBeVisible();
	await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
});
