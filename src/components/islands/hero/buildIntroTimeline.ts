import { gsap } from 'gsap';
import { INTRO, type IntroLevels } from '../../../lib/hero/introTimeline';

export interface IntroTargets {
	levels: IntroLevels;
	wordmark: HTMLElement | null;
	nav: HTMLElement | null;
	tagline: HTMLElement | null;
}

function addSceneLevels(tl: gsap.core.Timeline, levels: IntroLevels): void {
	tl.to(levels, { slit: 1, duration: INTRO.SLIT_DURATION_S, ease: 'sine.inOut' }, INTRO.SLIT_DELAY_S);
	tl.to(levels, { rocks: 1, duration: INTRO.ROCKS_DURATION_S, ease: 'power1.inOut' }, INTRO.ROCKS_DELAY_S);
	tl.to(levels, { fog: 1, duration: INTRO.FOG_DURATION_S, ease: 'sine.inOut' }, INTRO.FOG_DELAY_S);
}

function addWordmark(tl: gsap.core.Timeline, wordmark: HTMLElement | null, reducedMotion: boolean): void {
	if (!wordmark) return;
	const blurPx = reducedMotion ? 0 : INTRO.WORDMARK_BLUR_PX;
	tl.fromTo(
		wordmark,
		{ opacity: 0, filter: `blur(${blurPx}px)` },
		{ opacity: 1, filter: 'blur(0px)', duration: INTRO.WORDMARK_DURATION_S, ease: 'power2.out', clearProps: 'filter' },
		INTRO.WORDMARK_DELAY_S,
	);
}

function addNav(tl: gsap.core.Timeline, nav: HTMLElement | null, reducedMotion: boolean): void {
	if (!nav) return;
	const offsetY = reducedMotion ? 0 : INTRO.NAV_OFFSET_Y_PX;
	tl.fromTo(
		nav,
		{ opacity: 0, y: offsetY },
		{ opacity: 1, y: 0, duration: INTRO.NAV_DURATION_S, ease: 'power2.out', clearProps: 'transform' },
		INTRO.NAV_DELAY_S,
	);
}

function addTagline(tl: gsap.core.Timeline, tagline: HTMLElement | null): void {
	if (!tagline) return;
	tl.fromTo(tagline, { opacity: 0 }, { opacity: 1, duration: INTRO.TAGLINE_DURATION_S, ease: 'sine.out' }, INTRO.TAGLINE_DELAY_S);
}

/**
 * Entry sequence: near-darkness → sliver of light → rock surfaces → fog →
 * SEOMATIK → nav → tagline. Reduced motion keeps the fades, drops blur/offset.
 */
export function buildIntroTimeline(targets: IntroTargets, reducedMotion: boolean): gsap.core.Timeline {
	const tl = gsap.timeline({ paused: true });
	addSceneLevels(tl, targets.levels);
	addWordmark(tl, targets.wordmark, reducedMotion);
	addNav(tl, targets.nav, reducedMotion);
	addTagline(tl, targets.tagline);
	return tl;
}
