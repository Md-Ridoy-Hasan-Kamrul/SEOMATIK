import { expect, test, type Page } from '@playwright/test';

/** Intro + scroll contract for the canyon hero (`HeroIntro` island). */
const INTRO_TIMEOUT_MS = 15_000;
const hero = (page: Page) => page.locator('[data-hero]');
const opacityOf = (page: Page, selector: string) =>
	page.locator(selector).evaluate((el) => Number(getComputedStyle(el).opacity));

async function scrollThroughHero(page: Page) {
	await page.evaluate(() => {
		const el = document.querySelector<HTMLElement>('[data-hero]');
		if (el) window.scrollTo(0, el.offsetTop + el.offsetHeight - window.innerHeight);
	});
}

test.describe('canyon hero', () => {
	test('begins in near-darkness: brand + nav hidden on first paint', async ({ page }) => {
		await page.goto('/');
		expect(await opacityOf(page, '.hero-wordmark')).toBeLessThan(0.2);
		expect(await opacityOf(page, '.hero-nav')).toBeLessThan(0.2);
	});

	test('renders the scene with WebGL and plays the intro to completion', async ({ page }) => {
		await page.goto('/');
		await expect(hero(page)).toHaveAttribute('data-renderer', 'webgl');
		await expect(hero(page)).toHaveAttribute('data-intro', 'done', { timeout: INTRO_TIMEOUT_MS });
		await expect(page.getByRole('heading', { level: 1, name: 'SEOMATIK' })).toBeVisible();
		await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
		expect(await opacityOf(page, '.hero-wordmark')).toBe(1);
	});

	test('rests on frame 1, then scrolling opens the canyon to frame 5', async ({ page }) => {
		await page.goto('/');
		await expect(hero(page)).toHaveAttribute('data-frame', '0');
		await expect(hero(page)).toHaveAttribute('data-intro', 'done', { timeout: INTRO_TIMEOUT_MS });
		await scrollThroughHero(page);
		await expect(hero(page)).toHaveAttribute('data-frame', '4', { timeout: 6_000 });
	});

	test('reduced motion still shows the full brand entrance', async ({ browser }) => {
		const context = await browser.newContext({ reducedMotion: 'reduce' });
		const page = await context.newPage();
		await page.goto('/');
		await expect(hero(page)).toHaveAttribute('data-intro', 'done', { timeout: INTRO_TIMEOUT_MS });
		await expect(page.getByRole('heading', { level: 1, name: 'SEOMATIK' })).toBeVisible();
		await context.close();
	});

	for (const width of [1440, 1020, 768, 425, 375, 320]) {
		test(`wordmark stays on one line inside the viewport at ${width}px`, async ({ browser }) => {
			const context = await browser.newContext({ viewport: { width, height: 800 } });
			const page = await context.newPage();
			await page.goto('/');
			const box = await page.locator('.hero-wordmark').boundingBox();
			expect(box).not.toBeNull();
			expect(box!.x).toBeGreaterThanOrEqual(0);
			expect(box!.x + box!.width).toBeLessThanOrEqual(width);
			expect(box!.height).toBeLessThan(200);
			await context.close();
		});
	}
});
