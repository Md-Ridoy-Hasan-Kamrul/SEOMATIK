import { describe, expect, it } from 'vitest';
import { getIntroEndS, INTRO, INTRO_PHASES, phaseEndS } from './introTimeline';

describe('INTRO timing constants', () => {
	it('every delay is non-negative and every duration positive', () => {
		for (const phase of INTRO_PHASES) {
			expect(phase.delayS, phase.name).toBeGreaterThanOrEqual(0);
			expect(phase.durationS, phase.name).toBeGreaterThan(0);
		}
	});

	it('starts in near-darkness: nothing appears before the dark hold ends', () => {
		for (const phase of INTRO_PHASES) {
			expect(phase.delayS, phase.name).toBeGreaterThanOrEqual(INTRO.DARK_HOLD_S);
		}
	});

	it('shows the sliver of light first, alone', () => {
		const others = INTRO_PHASES.filter((p) => p.name !== 'slit');
		for (const phase of others) expect(phase.delayS, phase.name).toBeGreaterThan(INTRO.SLIT_DELAY_S);
	});

	it('lets the rock surfaces emerge before SEOMATIK fades in', () => {
		expect(INTRO.ROCKS_DELAY_S).toBeLessThan(INTRO.WORDMARK_DELAY_S);
	});

	it('brings the nav in after the wordmark and the tagline last', () => {
		expect(INTRO.NAV_DELAY_S).toBeGreaterThan(INTRO.WORDMARK_DELAY_S);
		expect(INTRO.TAGLINE_DELAY_S).toBeGreaterThan(INTRO.NAV_DELAY_S);
	});

	it('keeps the fog subtle by easing it in after the rocks start', () => {
		expect(INTRO.FOG_DELAY_S).toBeGreaterThan(INTRO.ROCKS_DELAY_S);
	});
});

describe('phaseEndS / getIntroEndS', () => {
	it('phase end = delay + duration', () => {
		expect(phaseEndS({ name: 'x', delayS: 1.5, durationS: 2 })).toBe(3.5);
	});

	it('the intro ends when its last phase ends', () => {
		const latest = Math.max(...INTRO_PHASES.map(phaseEndS));
		expect(getIntroEndS()).toBe(latest);
	});

	it('settles within a cinematic but patient window (5–9 s)', () => {
		expect(getIntroEndS()).toBeGreaterThanOrEqual(5);
		expect(getIntroEndS()).toBeLessThanOrEqual(9);
	});
});
