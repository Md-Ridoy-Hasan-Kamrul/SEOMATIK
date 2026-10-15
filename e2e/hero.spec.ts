import { expect, test, type Page } from '@playwright/test';
import { SCROLL } from '../src/lib/hero/canyonMorph';
import { LAST_FRAME, SECTION3_START_FRAME } from '../src/lib/hero/canyonPlates';

/** Intro + scroll contract for the canyon hero (`HeroIntro` island). */
// Headless WebGL renders in software; under parallel workers the 7 s intro can stretch.
const INTRO_TIMEOUT_MS = 30_000;
const hero = (page: Page) => page.locator('[data-hero]');
const opacityOf = (page: Page, selector: string) =>
	page.locator(selector).evaluate((el) => Number(getComputedStyle(el).opacity));

/** Scroll so the hero settles on a given frame position (0 = Picture1 … LAST_FRAME = Picture10). */
async function scrollToFrame(page: Page, frame: number) {
	await page.evaluate(
		([f, start, end, last]) => {
			const el = document.querySelector<HTMLElement>('[data-hero]')!;
			const p = start + (f / last) * (end - start);
			window.scrollTo(0, el.offsetTop + p * (el.offsetHeight - window.innerHeight));
		},
		[frame, SCROLL.HOLD_START, SCROLL.HOLD_END, LAST_FRAME],
	);
}

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

	test('rests on frame 1, then scrolling runs through to the final frame', async ({ page }) => {
		await page.goto('/');
		await expect(hero(page)).toHaveAttribute('data-frame', '0');
		await expect(hero(page)).toHaveAttribute('data-intro', 'done', { timeout: INTRO_TIMEOUT_MS });
		await scrollThroughHero(page);
		await expect(hero(page)).toHaveAttribute('data-frame', String(LAST_FRAME), { timeout: 6_000 });
	});

	test('section 2 is hidden during the intro and fully revealed at frame 8', async ({ page }) => {
		await page.goto('/');
		const title = page.getByRole('heading', { level: 2, name: 'WE BUILD DIGITAL GROWTH.' });
		await expect(title).toBeAttached();
		expect(await opacityOf(page, '.reveal__cta--primary')).toBe(0);

		await expect(hero(page)).toHaveAttribute('data-intro', 'done', { timeout: INTRO_TIMEOUT_MS });
		await scrollToFrame(page, SECTION3_START_FRAME);
		await expect(hero(page)).toHaveAttribute('data-frame', String(SECTION3_START_FRAME), { timeout: 6_000 });
		await expect.poll(() => opacityOf(page, '.reveal__cta--secondary'), { timeout: 4_000 }).toBe(1);
		await expect.poll(() => opacityOf(page, '.reveal'), { timeout: 4_000 }).toBe(1);

		await expect(page.getByRole('list', { name: 'Disziplinen', exact: true }).getByRole('listitem')).toHaveCount(8);
		await expect(page.getByText('SEOMATIK kombiniert Strategie, Technologie und Umsetzung')).toBeVisible();
		await expect(page.getByRole('link', { name: /Growth Potential analysieren/ })).toHaveAttribute('href', '#projekt');
		await expect(page.getByRole('link', { name: /SEOMATIK entdecken/ })).toHaveAttribute('href', '#company');
		expect(await opacityOf(page, '.hero-wordmark__char >> nth=0')).toBe(0);
	});

	test('the nav "Growth" link lands on the settled Growth System', async ({ page }) => {
		await page.goto('/');
		await expect(hero(page)).toHaveAttribute('data-intro', 'done', { timeout: INTRO_TIMEOUT_MS });
		await page.evaluate(() => document.getElementById('growth')?.scrollIntoView());
		await expect(hero(page)).toHaveAttribute('data-frame', String(LAST_FRAME), { timeout: 6_000 });
	});

	test('reduced motion still shows the full brand entrance', async ({ browser }) => {
		const context = await browser.newContext({ reducedMotion: 'reduce' });
		const page = await context.newPage();
		await page.goto('/');
		await expect(hero(page)).toHaveAttribute('data-intro', 'done', { timeout: INTRO_TIMEOUT_MS });
		await expect(page.getByRole('heading', { level: 1, name: 'SEOMATIK' })).toBeVisible();
		await context.close();
	});

	test('section 3: Picture9 shows strategy + seven dormant pins and no connections yet', async ({ page }) => {
		await page.goto('/');
		await expect(hero(page)).toHaveAttribute('data-intro', 'done', { timeout: INTRO_TIMEOUT_MS });
		await scrollToFrame(page, SECTION3_START_FRAME + 1);
		await expect(hero(page)).toHaveAttribute('data-frame', String(SECTION3_START_FRAME + 1), { timeout: 6_000 });
		await expect.poll(() => opacityOf(page, '.reveal'), { timeout: 4_000 }).toBe(0);
		await expect.poll(() => opacityOf(page, '.gs__node[data-key="seo"] .gs__pin--dormant'), { timeout: 4_000 }).toBe(1);
		expect(await opacityOf(page, '.gs__node[data-key="seo"] .gs__pin--active')).toBe(0);
		const draws = await page.locator('.gs__link').evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).getPropertyValue('--draw') || 0)));
		expect(draws.every((d) => d === 0)).toBe(true);
	});

	test('section 3: Picture10 shows the full system, statement and CTA', async ({ page }) => {
		await page.goto('/');
		await expect(hero(page)).toHaveAttribute('data-intro', 'done', { timeout: INTRO_TIMEOUT_MS });
		await scrollThroughHero(page);
		await expect(hero(page)).toHaveAttribute('data-frame', String(LAST_FRAME), { timeout: 6_000 });
		await expect(page.locator('.hero__stage')).toHaveAttribute('data-gs-live', '', { timeout: 4_000 });
		await expect(page.getByRole('heading', { level: 2, name: /Strategy at the core/i })).toBeAttached();
		await expect(page.getByRole('list', { name: 'Disziplinen rund um Strategy' }).getByRole('listitem')).toHaveCount(7);
		await expect(page.getByRole('link', { name: /Explore Growth/ })).toBeVisible();
		const draws = await page.locator('.gs__link').evaluateAll((els) => els.map((el) => Number(getComputedStyle(el).getPropertyValue('--draw'))));
		expect(draws.every((d) => d === 1)).toBe(true);
	});

	test('section 3: focusing or hovering a specialist highlights it and its connections', async ({ page }) => {
		await page.goto('/');
		await expect(hero(page)).toHaveAttribute('data-intro', 'done', { timeout: INTRO_TIMEOUT_MS });
		await scrollThroughHero(page);
		await expect(page.locator('.hero__stage')).toHaveAttribute('data-gs-live', '', { timeout: 8_000 });
		await page.locator('.gs__node[data-key="seo"]').focus();
		await expect(page.locator('.gs__node[data-key="seo"]')).toHaveAttribute('data-hot', '');
		await expect(page.locator('.gs__link[data-key="seo"]').first()).toHaveAttribute('data-hot', '');
		await expect(page.locator('.gs__link[data-key="sea"]').first()).not.toHaveAttribute('data-hot', '');
		await page.locator('.gs__node[data-key="seo"]').blur();
		await page.locator('.gs__node[data-key="design"] .gs__name').hover();
		await expect(page.locator('.gs__node[data-key="design"]')).toHaveAttribute('data-hot', '');
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

		test(`section 2 content fits inside the viewport at ${width}px`, async ({ browser }) => {
			const context = await browser.newContext({ viewport: { width, height: 800 } });
			const page = await context.newPage();
			await page.goto('/');
			for (const selector of ['.reveal__line--2', '.reveal__disciplines', '.reveal__explanation', '.reveal__ctas']) {
				const box = await page.locator(selector).boundingBox();
				expect(box, selector).not.toBeNull();
				expect(box!.x, selector).toBeGreaterThanOrEqual(0);
				expect(box!.x + box!.width, selector).toBeLessThanOrEqual(width);
				expect(box!.y + box!.height, selector).toBeLessThanOrEqual(800);
			}
			await context.close();
		});
	}
});
