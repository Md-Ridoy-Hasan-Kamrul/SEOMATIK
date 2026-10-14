/**
 * SEOMATIK entry sequence (seconds). Order is enforced by tests:
 * near-darkness → sliver of light → rock surfaces emerge → fog → SEOMATIK → nav → tagline.
 */
export const INTRO = {
	DARK_HOLD_S: 0.6,

	SLIT_DELAY_S: 0.6,
	SLIT_DURATION_S: 1.8,

	ROCKS_DELAY_S: 1.9,
	ROCKS_DURATION_S: 3.8,

	FOG_DELAY_S: 2.6,
	FOG_DURATION_S: 3.2,

	WORDMARK_DELAY_S: 3.3,
	WORDMARK_DURATION_S: 2.4,
	WORDMARK_BLUR_PX: 14,

	NAV_DELAY_S: 4.8,
	NAV_DURATION_S: 1.3,
	NAV_OFFSET_Y_PX: -10,

	TAGLINE_DELAY_S: 5.4,
	TAGLINE_DURATION_S: 1.5,

	/** Start anyway if the first plate is slow to load, so the brand never stays hidden. */
	FIRST_PLATE_TIMEOUT_MS: 2500,
} as const;

/** Scene levels animated by the intro timeline and read by the renderer every frame. */
export interface IntroLevels {
	slit: number;
	rocks: number;
	fog: number;
}

export interface IntroPhase {
	name: string;
	delayS: number;
	durationS: number;
}

export const INTRO_PHASES: readonly IntroPhase[] = [
	{ name: 'slit', delayS: INTRO.SLIT_DELAY_S, durationS: INTRO.SLIT_DURATION_S },
	{ name: 'rocks', delayS: INTRO.ROCKS_DELAY_S, durationS: INTRO.ROCKS_DURATION_S },
	{ name: 'fog', delayS: INTRO.FOG_DELAY_S, durationS: INTRO.FOG_DURATION_S },
	{ name: 'wordmark', delayS: INTRO.WORDMARK_DELAY_S, durationS: INTRO.WORDMARK_DURATION_S },
	{ name: 'nav', delayS: INTRO.NAV_DELAY_S, durationS: INTRO.NAV_DURATION_S },
	{ name: 'tagline', delayS: INTRO.TAGLINE_DELAY_S, durationS: INTRO.TAGLINE_DURATION_S },
];

export function phaseEndS(phase: IntroPhase): number {
	return phase.delayS + phase.durationS;
}

export function getIntroEndS(): number {
	return Math.max(...INTRO_PHASES.map(phaseEndS));
}
